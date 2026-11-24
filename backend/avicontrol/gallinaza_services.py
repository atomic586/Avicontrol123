"""Operaciones transaccionales del módulo aislado de gallinaza."""

from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Max, Sum
from django.utils import timezone

from .gallinaza_models import (
    DetalleVentaGallinaza,
    EntradaGallinaza,
    MovimientoGallinaza,
    PagoGallinaza,
    ProductoGallinaza,
    VentaGallinaza,
)
from .models import Cliente, Granja, Usuario


CONVERSION_KG = {"bulto": Decimal("50"), "kg": Decimal("1"), "tonelada": Decimal("1000")}
PRECIO_POR_UNIDAD = {"bulto": "precio_bulto", "kg": "precio_kg", "tonelada": "precio_tonelada"}


def _decimal(valor, nombre):
    try:
        numero = Decimal(str(valor))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError(f"{nombre} debe ser un número válido.")
    if not numero.is_finite():
        raise ValueError(f"{nombre} debe ser un número finito.")
    return numero


@transaction.atomic
def registrar_entrada(*, granja, producto_id, fecha, cantidad_kg, origen, observaciones="", usuario=None):
    producto = ProductoGallinaza.objects.select_for_update().filter(pk=producto_id, granja=granja).first()
    if not producto:
        raise ValueError("Producto de gallinaza no encontrado en esta granja.")
    cantidad = _decimal(cantidad_kg, "La cantidad")
    if cantidad <= 0:
        raise ValueError("La cantidad de entrada debe ser mayor que cero.")
    entrada = EntradaGallinaza.objects.create(
        granja=granja, producto=producto, fecha=fecha, cantidad_kg=cantidad,
        origen=origen.strip(), observaciones=observaciones, usuario=usuario,
    )
    producto.stock_actual_kg += cantidad
    producto.save(update_fields=["stock_actual_kg", "updated_at"])
    MovimientoGallinaza.objects.create(
        granja=granja, producto=producto, tipo="entrada", cantidad_kg=cantidad,
        referencia=f"Entrada #{entrada.pk}: {entrada.origen}", entrada=entrada, usuario=usuario,
    )
    return entrada


@transaction.atomic
def registrar_venta(*, granja, fecha, lineas, metodo_pago, cliente_id=None,
                    monto_recibido=Decimal("0"), usuario=None):
    if not lineas:
        raise ValueError("Agrega al menos un producto a la venta.")
    if metodo_pago not in dict(VentaGallinaza.METODOS_PAGO):
        raise ValueError("Forma de pago no válida.")

    cliente = None
    if cliente_id:
        cliente = Cliente.objects.filter(pk=cliente_id, granja=granja, activo=True).first()
        if not cliente:
            raise ValueError("Cliente no encontrado o inactivo en esta granja.")

    # Lock de granja serializa la asignación de consecutivos entre ventas concurrentes.
    Granja.objects.select_for_update().get(pk=granja.pk)
    siguiente_numero = (VentaGallinaza.objects.filter(granja=granja).aggregate(n=Max("numero"))["n"] or 0) + 1
    preparados = []
    total = Decimal("0")
    acumulado_por_producto = {}
    for linea in lineas:
        unidad = linea.get("unidad_vendida")
        if unidad not in CONVERSION_KG:
            raise ValueError("Unidad inválida. Usa bulto, kg o tonelada.")
        cantidad = _decimal(linea.get("cantidad"), "La cantidad")
        if cantidad <= 0:
            raise ValueError("La cantidad debe ser mayor que cero.")
        producto_id = linea.get("producto_id")
        producto = ProductoGallinaza.objects.select_for_update().filter(
            pk=producto_id, granja=granja, activo=True
        ).first()
        if not producto:
            raise ValueError(f"Producto {producto_id} no encontrado o inactivo.")
        kg = cantidad * CONVERSION_KG[unidad]
        acumulado_por_producto[producto.pk] = acumulado_por_producto.get(producto.pk, Decimal("0")) + kg
        precio = getattr(producto, PRECIO_POR_UNIDAD[unidad])
        subtotal = cantidad * precio
        total += subtotal
        preparados.append((producto, unidad, cantidad, kg, precio, subtotal))

    for producto_id, solicitado in acumulado_por_producto.items():
        producto = next(p for p, *_ in preparados if p.pk == producto_id)
        if producto.stock_actual_kg < solicitado:
            raise ValueError(
                f"Stock insuficiente para '{producto.nombre}'. Disponible: "
                f"{producto.stock_actual_kg} kg, solicitado: {solicitado} kg."
            )

    recibido = _decimal(monto_recibido or 0, "El monto recibido")
    if recibido < 0:
        raise ValueError("El monto recibido no puede ser negativo.")
    if metodo_pago == "efectivo" and recibido < total:
        raise ValueError("El monto recibido no cubre el total de la venta.")
    if metodo_pago == "credito" and recibido > total:
        raise ValueError("El pago inicial no puede superar el total de la venta.")
    if metodo_pago != "credito" and metodo_pago != "efectivo":
        recibido = total

    estado = "pendiente" if recibido == 0 else ("pagada" if recibido >= total else "parcial")
    venta = VentaGallinaza.objects.create(
        granja=granja, numero=siguiente_numero, fecha=fecha, cliente=cliente,
        total=total, metodo_pago=metodo_pago, estado=estado,
        monto_recibido=recibido, cambio=max(recibido - total, Decimal("0")), usuario=usuario,
    )
    for producto, unidad, cantidad, kg, precio, subtotal in preparados:
        detalle = DetalleVentaGallinaza.objects.create(
            venta=venta, producto=producto, unidad_vendida=unidad, cantidad=cantidad,
            cantidad_kg=kg, precio_unitario=precio, subtotal=subtotal,
        )
        producto.stock_actual_kg -= kg
        producto.save(update_fields=["stock_actual_kg", "updated_at"])
        MovimientoGallinaza.objects.create(
            granja=granja, producto=producto, tipo="salida", cantidad_kg=kg,
            referencia=f"Venta #{venta.numero}", detalle_venta=detalle, usuario=usuario,
        )
    if recibido > 0:
        PagoGallinaza.objects.create(
            venta=venta, monto=min(recibido, total), fecha=timezone.now(),
            metodo=metodo_pago, usuario=usuario,
        )
    return venta


@transaction.atomic
def registrar_pago(*, granja, venta_id, monto, metodo, usuario=None):
    venta = VentaGallinaza.objects.select_for_update().filter(pk=venta_id, granja=granja).first()
    if not venta:
        raise ValueError("Venta de gallinaza no encontrada.")
    if metodo not in dict(VentaGallinaza.METODOS_PAGO) or metodo == "credito":
        raise ValueError("Selecciona un método válido para registrar el abono.")
    monto = _decimal(monto, "El monto del abono")
    pagado = venta.pagos.aggregate(total=Sum("monto"))["total"] or Decimal("0")
    saldo = venta.total - pagado
    if monto <= 0:
        raise ValueError("El abono debe ser mayor que cero.")
    if monto > saldo:
        raise ValueError(f"El abono supera el saldo pendiente de Bs. {saldo}.")
    pago = PagoGallinaza.objects.create(
        venta=venta, monto=monto, fecha=timezone.now(), metodo=metodo, usuario=usuario,
    )
    saldo -= monto
    venta.estado = "pagada" if saldo == 0 else "parcial"
    venta.updated_at = timezone.now()
    venta.save(update_fields=["estado", "updated_at"])
    return pago
