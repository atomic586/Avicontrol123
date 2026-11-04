"""
Schema GraphQL de AVICONTROL.
Define Query (lecturas) y Mutation (escrituras) para las 11 tablas.
"""

import strawberry
import strawberry_django
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone
from strawberry.types import Info

from avicontrol.models import (
    Usuario, Cliente, Granja, Galpon, Lote,
    Produccion, Producto, Insumo, Pedido, DetallePedido, Venta,
)
from .types import (
    UsuarioType, ClienteType, GranjaType, GalponType, LoteType,
    ProduccionType, ProductoType, InsumoType, PedidoType,
    DetallePedidoType, VentaType,
)
from .auth_jwt import generar_tokens, usuario_desde_request


# ============================================================
# TIPOS AUXILIARES (deben declararse ANTES de Query y Mutation
# para que Strawberry resuelva los tipos sin forward refs)
# ============================================================
@strawberry.input
class DetalleInput:
    producto_id: strawberry.ID
    cantidad: int


@strawberry.type
class LoginPayload:
    access: str
    refresh: str
    usuario: UsuarioType


@strawberry.type
class DashboardType:
    total_clientes: int
    pedidos_hoy: int
    pedidos_semana: int
    pedidos_mes: int
    ingresos_totales: Decimal
    producto_mas_vendido: str
    producto_mas_vendido_cantidad: int
    insumos_stock_bajo: List[InsumoType]
    insumos_por_vencer: List[InsumoType]


# ============================================================
# QUERY (lecturas)
# ============================================================
@strawberry.type
class Query:

    # ---- USUARIOS ----
    @strawberry.field
    def usuarios(self) -> List[UsuarioType]:
        return list(Usuario.objects.all())

    @strawberry.field
    def usuario(self, id: strawberry.ID) -> Optional[UsuarioType]:
        return Usuario.objects.filter(pk=id).first()

    # ---- CLIENTES ----
    @strawberry.field
    def clientes(self, busqueda: Optional[str] = None) -> List[ClienteType]:
        qs = Cliente.objects.all()
        if busqueda:
            qs = qs.filter(
                Q(nombres__icontains=busqueda) |
                Q(apellidos__icontains=busqueda) |
                Q(dni__icontains=busqueda) |
                Q(telefono__icontains=busqueda)
            )
        return list(qs)

    @strawberry.field
    def cliente(self, id: strawberry.ID) -> Optional[ClienteType]:
        return Cliente.objects.filter(pk=id).first()

    # ---- GRANJAS ----
    @strawberry.field
    def granjas(self) -> List[GranjaType]:
        return list(Granja.objects.all())

    # ---- GALPONES ----
    @strawberry.field
    def galpones(self, granja_id: Optional[strawberry.ID] = None) -> List[GalponType]:
        qs = Galpon.objects.all()
        if granja_id:
            qs = qs.filter(granja_id=granja_id)
        return list(qs)

    # ---- LOTES ----
    @strawberry.field
    def lotes(self, estado: Optional[str] = None) -> List[LoteType]:
        qs = Lote.objects.all()
        if estado:
            qs = qs.filter(estado=estado)
        return list(qs)

    @strawberry.field
    def lote(self, id: strawberry.ID) -> Optional[LoteType]:
        return Lote.objects.filter(pk=id).first()

    # ---- PRODUCCIONES ----
    @strawberry.field
    def producciones(
        self,
        lote_id: Optional[strawberry.ID] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
    ) -> List[ProduccionType]:
        qs = Produccion.objects.all()
        if lote_id:
            qs = qs.filter(lote_id=lote_id)
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)
        return list(qs)

    # ---- PRODUCTOS ----
    @strawberry.field
    def productos(self, solo_activos: bool = False) -> List[ProductoType]:
        qs = Producto.objects.all()
        if solo_activos:
            qs = qs.filter(activo=True)
        return list(qs)

    @strawberry.field
    def producto(self, id: strawberry.ID) -> Optional[ProductoType]:
        return Producto.objects.filter(pk=id).first()

    # ---- INSUMOS ----
    @strawberry.field
    def insumos(self, tipo: Optional[str] = None) -> List[InsumoType]:
        qs = Insumo.objects.all()
        if tipo:
            qs = qs.filter(tipo=tipo)
        return list(qs)

    @strawberry.field
    def insumos_stock_bajo(self) -> List[InsumoType]:
        return [i for i in Insumo.objects.all() if i.stock_bajo]

    @strawberry.field
    def insumos_por_vencer(self, dias: int = 30) -> List[InsumoType]:
        hoy = timezone.now().date()
        limite = hoy + timezone.timedelta(days=dias)
        return list(
            Insumo.objects.filter(
                fecha_vencimiento__isnull=False,
                fecha_vencimiento__gte=hoy,
                fecha_vencimiento__lte=limite,
            )
        )

    # ---- PEDIDOS ----
    @strawberry.field
    def pedidos(
        self,
        estado: Optional[str] = None,
        fecha: Optional[date] = None,
        cliente_id: Optional[strawberry.ID] = None,
    ) -> List[PedidoType]:
        qs = Pedido.objects.all()
        if estado:
            qs = qs.filter(estado=estado)
        if fecha:
            qs = qs.filter(fecha_pedido=fecha)
        if cliente_id:
            qs = qs.filter(cliente_id=cliente_id)
        return list(qs)

    @strawberry.field
    def pedido(self, id: strawberry.ID) -> Optional[PedidoType]:
        return Pedido.objects.filter(pk=id).first()

    @strawberry.field
    def detalles_pedido(self, pedido_id: strawberry.ID) -> List[DetallePedidoType]:
        return list(DetallePedido.objects.filter(pedido_id=pedido_id))

    # ---- VENTAS ----
    @strawberry.field
    def ventas(self, cliente_id: Optional[strawberry.ID] = None) -> List[VentaType]:
        qs = Venta.objects.select_related("pedido")
        if cliente_id:
            qs = qs.filter(pedido__cliente_id=cliente_id)
        return list(qs)

    # ---- HISTORIAL DE COMPRAS POR CLIENTE ----
    @strawberry.field
    def historial_cliente(self, cliente_id: strawberry.ID) -> List[PedidoType]:
        return list(
            Pedido.objects.filter(cliente_id=cliente_id)
            .prefetch_related("detalles__producto")
            .order_by("-fecha_pedido")
        )

    # ---- DASHBOARD (métricas) ----
    @strawberry.field
    def dashboard(self) -> DashboardType:
        hoy = timezone.now().date()
        inicio_semana = hoy - timezone.timedelta(days=hoy.weekday())
        inicio_mes = hoy.replace(day=1)

        total_clientes = Cliente.objects.count()

        pedidos_hoy = Pedido.objects.filter(fecha_pedido=hoy).count()
        pedidos_semana = Pedido.objects.filter(fecha_pedido__gte=inicio_semana).count()
        pedidos_mes = Pedido.objects.filter(fecha_pedido__gte=inicio_mes).count()

        ingresos_totales = Venta.objects.aggregate(t=Sum("monto_total"))["t"] or Decimal("0")

        top = (
            DetallePedido.objects
            .filter(pedido__estado="entregado")
            .values("producto__nombre")
            .annotate(total=Sum("cantidad"))
            .order_by("-total")
            .first()
        )
        producto_mas_vendido = top["producto__nombre"] if top else "Sin ventas aún"
        producto_mas_vendido_cantidad = top["total"] if top else 0

        insumos_bajos_list = [i for i in Insumo.objects.all() if i.stock_bajo]

        limite = hoy + timezone.timedelta(days=30)
        proximos_vencer = list(
            Insumo.objects.filter(
                fecha_vencimiento__isnull=False,
                fecha_vencimiento__gte=hoy,
                fecha_vencimiento__lte=limite,
            )
        )

        return DashboardType(
            total_clientes=total_clientes,
            pedidos_hoy=pedidos_hoy,
            pedidos_semana=pedidos_semana,
            pedidos_mes=pedidos_mes,
            ingresos_totales=ingresos_totales,
            producto_mas_vendido=producto_mas_vendido,
            producto_mas_vendido_cantidad=producto_mas_vendido_cantidad,
            insumos_stock_bajo=insumos_bajos_list,
            insumos_por_vencer=proximos_vencer,
        )


# ============================================================
# MUTATIONS (escrituras)
# ============================================================
@strawberry.type
class Mutation:

    # ---- AUTENTICACIÓN ----
    @strawberry.mutation
    def login(self, username: str, password: str) -> LoginPayload:
        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)
        if user is None or not user.is_active:
            raise ValueError("Credenciales inválidas o usuario inactivo.")
        tokens = generar_tokens(user)
        return LoginPayload(
            access=tokens["access"],
            refresh=tokens["refresh"],
            usuario=user,
        )

    @strawberry.mutation
    def refresh_token(self, refresh: str) -> LoginPayload:
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        try:
            rt = RefreshToken(refresh)
            user_id = rt.get("user_id")
            user = Usuario.objects.filter(pk=user_id, is_active=True).first()
            if not user:
                raise ValueError("Usuario no válido.")
            return LoginPayload(
                access=str(rt.access_token),
                refresh=str(rt),
                usuario=user,
            )
        except TokenError:
            raise ValueError("Refresh token inválido o expirado.")

    @strawberry.mutation
    def me(self, info: Info) -> Optional[UsuarioType]:
        return usuario_desde_request(info.context.request)

    # ---- CLIENTES ----
    @strawberry.mutation
    def crear_cliente(
        self, nombres: str, apellidos: str, dni: str, telefono: str,
        email: Optional[str] = None, direccion: str = "",
    ) -> ClienteType:
        cliente = Cliente.objects.create(
            nombres=nombres, apellidos=apellidos, dni=dni,
            telefono=telefono, email=email, direccion=direccion,
        )
        return cliente

    @strawberry.mutation
    def actualizar_cliente(
        self, id: strawberry.ID, nombres: Optional[str] = None,
        apellidos: Optional[str] = None, telefono: Optional[str] = None,
        email: Optional[str] = None, direccion: Optional[str] = None,
    ) -> Optional[ClienteType]:
        cliente = Cliente.objects.filter(pk=id).first()
        if not cliente:
            return None
        for campo, valor in [
            ("nombres", nombres), ("apellidos", apellidos),
            ("telefono", telefono), ("email", email), ("direccion", direccion),
        ]:
            if valor is not None:
                setattr(cliente, campo, valor)
        cliente.save()
        return cliente

    @strawberry.mutation
    def eliminar_cliente(self, id: strawberry.ID) -> bool:
        eliminado, _ = Cliente.objects.filter(pk=id).delete()
        return eliminado > 0

    # ---- GRANJAS ----
    @strawberry.mutation
    def crear_granja(
        self, nombre: str, ubicacion: str, telefono: str = "",
    ) -> GranjaType:
        return Granja.objects.create(nombre=nombre, ubicacion=ubicacion, telefono=telefono)

    # ---- GALPONES ----
    @strawberry.mutation
    def crear_galpon(
        self, granja_id: strawberry.ID, codigo: str, capacidad_aves: int,
    ) -> GalponType:
        return Galpon.objects.create(
            granja_id=granja_id, codigo=codigo, capacidad_aves=capacidad_aves,
        )

    # ---- LOTES ----
    @strawberry.mutation
    def crear_lote(
        self, galpon_id: strawberry.ID, codigo: str, raza: str,
        fecha_ingreso: date, cantidad_aves: int, estado: str = "activo",
    ) -> LoteType:
        return Lote.objects.create(
            galpon_id=galpon_id, codigo=codigo, raza=raza,
            fecha_ingreso=fecha_ingreso, cantidad_aves=cantidad_aves, estado=estado,
        )

    @strawberry.mutation
    def actualizar_lote(
        self, id: strawberry.ID, estado: Optional[str] = None,
        cantidad_aves: Optional[int] = None,
    ) -> Optional[LoteType]:
        lote = Lote.objects.filter(pk=id).first()
        if not lote:
            return None
        if estado is not None:
            lote.estado = estado
        if cantidad_aves is not None:
            lote.cantidad_aves = cantidad_aves
        lote.save()
        return lote

    # ---- PRODUCCIÓN ----
    @strawberry.mutation
    def registrar_produccion(
        self, lote_id: strawberry.ID, fecha: date,
        huevos_primera: int = 0, huevos_segunda: int = 0,
        huevos_tercera: int = 0, huevos_descartados: int = 0,
    ) -> ProduccionType:
        produccion, _ = Produccion.objects.update_or_create(
            lote_id=lote_id, fecha=fecha,
            defaults={
                "huevos_primera": huevos_primera,
                "huevos_segunda": huevos_segunda,
                "huevos_tercera": huevos_tercera,
                "huevos_descartados": huevos_descartados,
            },
        )
        produccion.save()
        return produccion

    # ---- PRODUCTOS ----
    @strawberry.mutation
    def crear_producto(
        self, nombre: str, presentacion: str, calidad: str,
        precio_unitario: Decimal, stock: int = 0, stock_minimo: int = 0,
    ) -> ProductoType:
        return Producto.objects.create(
            nombre=nombre, presentacion=presentacion, calidad=calidad,
            precio_unitario=precio_unitario, stock=stock, stock_minimo=stock_minimo,
        )

    @strawberry.mutation
    def actualizar_producto(
        self, id: strawberry.ID, precio_unitario: Optional[Decimal] = None,
        stock: Optional[int] = None, stock_minimo: Optional[int] = None,
        activo: Optional[bool] = None,
    ) -> Optional[ProductoType]:
        producto = Producto.objects.filter(pk=id).first()
        if not producto:
            return None
        for campo, valor in [
            ("precio_unitario", precio_unitario), ("stock", stock),
            ("stock_minimo", stock_minimo), ("activo", activo),
        ]:
            if valor is not None:
                setattr(producto, campo, valor)
        producto.save()
        return producto

    # ---- INSUMOS ----
    @strawberry.mutation
    def crear_insumo(
        self, nombre: str, tipo: str, presentacion: str = "",
        stock: Decimal = Decimal("0"), stock_minimo: Decimal = Decimal("0"),
        precio_unitario: Decimal = Decimal("0"),
        fecha_vencimiento: Optional[date] = None,
    ) -> InsumoType:
        return Insumo.objects.create(
            nombre=nombre, tipo=tipo, presentacion=presentacion,
            stock=stock, stock_minimo=stock_minimo,
            precio_unitario=precio_unitario, fecha_vencimiento=fecha_vencimiento,
        )

    @strawberry.mutation
    def actualizar_insumo(
        self, id: strawberry.ID, stock: Optional[Decimal] = None,
        stock_minimo: Optional[Decimal] = None,
        precio_unitario: Optional[Decimal] = None,
        fecha_vencimiento: Optional[date] = None,
    ) -> Optional[InsumoType]:
        insumo = Insumo.objects.filter(pk=id).first()
        if not insumo:
            return None
        for campo, valor in [
            ("stock", stock), ("stock_minimo", stock_minimo),
            ("precio_unitario", precio_unitario), ("fecha_vencimiento", fecha_vencimiento),
        ]:
            if valor is not None:
                setattr(insumo, campo, valor)
        insumo.save()
        return insumo

    @strawberry.mutation
    def eliminar_insumo(self, id: strawberry.ID) -> bool:
        eliminado, _ = Insumo.objects.filter(pk=id).delete()
        return eliminado > 0

    # ---- PEDIDOS (con validación de stock) ----
    @strawberry.mutation
    def crear_pedido(
        self, cliente_id: strawberry.ID, fecha_pedido: date,
        detalles: List[DetalleInput],
    ) -> PedidoType:
        if not detalles:
            raise ValueError("El pedido debe tener al menos un producto.")

        with transaction.atomic():
            pedido = Pedido.objects.create(
                cliente_id=cliente_id, fecha_pedido=fecha_pedido, estado="pendiente",
            )
            for d in detalles:
                producto = Producto.objects.select_for_update().get(pk=d.producto_id)
                if producto.stock < d.cantidad:
                    raise ValueError(
                        f"Stock insuficiente para '{producto.nombre}'. "
                        f"Disponible: {producto.stock}, solicitado: {d.cantidad}."
                    )
                DetallePedido.objects.create(
                    pedido=pedido, producto=producto,
                    cantidad=d.cantidad, precio_unitario=producto.precio_unitario,
                )
            pedido.recalcular_total()
        return pedido

    @strawberry.mutation
    def cambiar_estado_pedido(
        self, id: strawberry.ID, estado: str,
    ) -> Optional[PedidoType]:
        pedido = Pedido.objects.filter(pk=id).first()
        if not pedido:
            return None
        estados_validos = {"pendiente", "confirmado", "entregado", "anulado"}
        if estado not in estados_validos:
            raise ValueError(f"Estado inválido: {estado}")
        pedido.estado = estado
        pedido.save()
        return pedido

    # ---- VENTAS (descuenta stock y marca pedido como entregado) ----
    @strawberry.mutation
    def registrar_venta(
        self, pedido_id: strawberry.ID, forma_pago: str = "efectivo",
        fecha: Optional[date] = None,
    ) -> VentaType:
        with transaction.atomic():
            pedido = Pedido.objects.select_for_update().get(pk=pedido_id)
            if pedido.estado == "entregado":
                raise ValueError("Este pedido ya fue entregado y cobrado.")
            if pedido.estado == "anulado":
                raise ValueError("Este pedido está anulado.")

            for d in pedido.detalles.select_related("producto"):
                producto = Producto.objects.select_for_update().get(pk=d.producto_id)
                if producto.stock < d.cantidad:
                    raise ValueError(
                        f"Stock insuficiente para '{producto.nombre}'. "
                        f"Disponible: {producto.stock}, solicitado: {d.cantidad}."
                    )
                producto.stock -= d.cantidad
                producto.save(update_fields=["stock"])

            pedido.estado = "entregado"
            pedido.save(update_fields=["estado"])

            venta = Venta.objects.create(
                pedido=pedido,
                fecha=fecha or timezone.now().date(),
                monto_total=pedido.total,
                forma_pago=forma_pago,
            )
        return venta


# ============================================================
# SCHEMA FINAL
# ============================================================
schema = strawberry.Schema(query=Query, mutation=Mutation)