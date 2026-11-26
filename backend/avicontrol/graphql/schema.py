"""
Schema GraphQL de AVICONTROL.
Define Query (lecturas) y Mutation (escrituras) para todas las tablas.
"""

import re
import strawberry
import strawberry_django
from typing import Optional, List
from datetime import date, datetime, timedelta
from decimal import Decimal
import secrets
from django.db import transaction
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from strawberry.types import Info

from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from avicontrol.models import (
    Usuario, Cliente, ClienteActivacion, Granja, Galpon, Lote,
    Produccion, Producto, Insumo, Pedido, DetallePedido, Venta,
    GeneracionAbono, ConfiguracionTienda,
    Proveedor, Compra, DetalleCompra, Almacen, MovimientoStock,
    Rol, Auditoria, MovimientoAve,
    ConsumoInsumo, MedicamentoEnAlimento, TarifaProducto,
)
from avicontrol.gallinaza_models import (
    ProductoGallinaza, EntradaGallinaza, VentaGallinaza,
    DetalleVentaGallinaza, PagoGallinaza, MovimientoGallinaza,
)
from avicontrol.gallinaza_services import registrar_entrada, registrar_venta, registrar_pago
from .types import (
    UsuarioType, ClienteType, GranjaType, GalponType, LoteType,
    ProduccionType, ProductoType, InsumoType, PedidoType,
    DetallePedidoType, VentaType, GeneracionAbonoType,
    ClienteBasicoType, ProductoBasicoType,
    DetallePedidoCompletoType, PedidoCompletoType, VentaCompletaType,
    ConfiguracionTiendaType, RolType,
    ProveedorType, CompraCompletaType, DetalleCompraType,
    MovimientoAveType, ConsumoInsumoType, MedicamentoEnAlimentoType,
    TarifaProductoType,
    ProductoGallinazaType, EntradaGallinazaType, VentaGallinazaType,
    DetalleVentaGallinazaType, PagoGallinazaType, MovimientoGallinazaType,
)
from .auth_jwt import generar_tokens, usuario_desde_request


# ============================================================
# TIPOS AUXILIARES
# ============================================================
@strawberry.input
class DetalleInput:
    producto_id: strawberry.ID
    cantidad: int


@strawberry.input
class LineaAbonoPedidoInput:
    producto_id: strawberry.ID
    unidad_vendida: str
    cantidad: Decimal

@strawberry.input
class DetalleCompraInput:
    insumo_id: strawberry.ID
    cantidad: Decimal
    precio_unitario: Decimal


@strawberry.type
class LoginPayload:
    access: str
    refresh: str
    usuario: UsuarioType


@strawberry.type
class LoginClientePayload:
    access: str
    refresh: str
    cliente: ClienteType


@strawberry.type
class PedidoClientePayload:
    pedido_huevos: Optional[PedidoCompletoType]
    pedido_abono: Optional[VentaGallinazaType]
    total: Decimal


# ============================================================
# HELPERS
# ============================================================
def _granja_por_defecto(info: Optional[Info] = None) -> Granja:
    request = getattr(info.context, "request", None) if info else None
    usuario = usuario_desde_request(request) if request else None
    if usuario and usuario.granja_id:
        return usuario.granja
    granja = Granja.objects.order_by("id").first()
    if granja is None:
        raise ValueError("No hay ninguna granja configurada.")
    return granja


def _granja_de_galpon(galpon_id) -> tuple:
    galpon = Galpon.objects.select_related("granja").filter(pk=galpon_id).first()
    if not galpon:
        raise ValueError("Galpón no encontrado.")
    return galpon.granja, galpon


def _tokens_cliente(cliente) -> dict:
    refresh = RefreshToken()
    refresh["cliente_id"] = cliente.id
    refresh["tipo"] = "cliente"
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _token_de_request(request) -> str:
    if request is None:
        return ""
    propio = request.META.get("HTTP_X_CLIENTE_TOKEN", "")
    if propio.startswith("Bearer "):
        return propio.replace("Bearer ", "", 1).strip()
    general = request.META.get("HTTP_AUTHORIZATION", "")
    if general.startswith("Bearer "):
        return general.replace("Bearer ", "", 1).strip()
    return ""


def _cliente_desde_request(request) -> Optional[Cliente]:
    try:
        access = AccessToken(_token_de_request(request))
    except TokenError:
        return None
    cliente_id = access.get("cliente_id")
    if not cliente_id:
        return None
    return Cliente.objects.filter(
        pk=cliente_id, activo=True, puede_loguearse=True
    ).first()


def requerir_superadmin(info: Info) -> Usuario:
    user = usuario_desde_request(info.context.request)
    if not user or not user.es_superadmin:
        raise ValueError("Solo el superadministrador puede realizar esta acción.")
    return user


def requerir_rol(info: Info, roles_permitidos: list) -> Usuario:
    user = usuario_desde_request(info.context.request)
    if not user:
        raise ValueError("No autenticado.")
    roles_usuario = [r.codigo for r in user.roles.all()]
    if not any(rol in roles_usuario for rol in roles_permitidos):
        raise ValueError(
            f"No tienes permiso para esta acción. "
            f"Roles permitidos: {', '.join(roles_permitidos)}."
        )
    return user


@strawberry.type
class EstadisticasGranjaType:
    total_galpones: int
    total_lotes: int
    total_usuarios: int
    total_clientes: int
    produccion_mes_huevos: int
    ingresos_mes: Decimal


def _digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


@strawberry.type
class DashboardType:
    total_clientes: int
    pedidos_hoy: int
    pedidos_semana: int
    pedidos_mes: int
    ingresos_totales: Decimal
    producto_mas_vendido: str
    producto_mas_vendido_cantidad: int
    abono_generado_mes_kg: Decimal
    abono_vendido_mes_kg: Decimal
    insumos_stock_bajo: List[InsumoType]
    insumos_por_vencer: List[InsumoType]


# ============================================================
# QUERY
# ============================================================
@strawberry.type
class Query:

    # ---- ROLES ----
    @strawberry.field
    def roles(self, info: Info) -> List[RolType]:
        user = usuario_desde_request(info.context.request)
        if not user:
            raise ValueError("No autenticado.")
        return list(Rol.objects.filter(activo=True))

    # ---- USUARIOS ----
    @strawberry.field
    def usuarios(self, info: Info) -> List[UsuarioType]:
        user = usuario_desde_request(info.context.request)
        if not user:
            raise ValueError("No autenticado.")
        if user.es_superadmin:
            return list(Usuario.objects.all())
        if user.es_admin_granja and user.granja_id:
            return list(Usuario.objects.filter(granja_id=user.granja_id))
        raise ValueError("No tienes permiso para ver usuarios.")

    @strawberry.field
    def usuario(self, info: Info, id: strawberry.ID) -> Optional[UsuarioType]:
        user = usuario_desde_request(info.context.request)
        if not user:
            raise ValueError("No autenticado.")
        if user.es_superadmin:
            return Usuario.objects.filter(pk=id).first()
        if user.es_admin_granja and user.granja_id:
            return Usuario.objects.filter(pk=id, granja_id=user.granja_id).first()
        raise ValueError("No tienes permiso para ver usuarios.")

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

    @strawberry.field
    def granja_actual(self, info: Info) -> GranjaType:
        return _granja_por_defecto(info)

    @strawberry.field
    def granja(self, info: Info, id: strawberry.ID) -> Optional[GranjaType]:
        requerir_superadmin(info)
        return Granja.objects.filter(pk=id).first()

    @strawberry.field
    def estadisticas_granja(self, info: Info, id: strawberry.ID) -> EstadisticasGranjaType:
        requerir_superadmin(info)
        granja = Granja.objects.filter(pk=id).first()
        if not granja:
            raise ValueError("Granja no encontrada.")
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)

        return EstadisticasGranjaType(
            total_galpones=Galpon.objects.filter(granja=granja, activo=True).count(),
            total_lotes=Lote.objects.filter(granja=granja).exclude(estado="baja").count(),
            total_usuarios=Usuario.objects.filter(granja=granja).count(),
            total_clientes=Cliente.objects.filter(granja=granja).count(),
            produccion_mes_huevos=Produccion.objects.filter(
                granja=granja, fecha__gte=inicio_mes, fecha__lte=hoy
            ).aggregate(t=Sum("total"))["t"] or 0,
            ingresos_mes=Venta.objects.filter(
                granja=granja, fecha__gte=inicio_mes, fecha__lte=hoy
            ).aggregate(t=Sum("monto_total"))["t"] or Decimal("0"),
        )

    @strawberry.field
    def galpones_granja(self, info: Info, id: strawberry.ID) -> List[GalponType]:
        requerir_superadmin(info)
        return list(Galpon.objects.filter(granja_id=id))

    @strawberry.field
    def usuarios_granja(self, info: Info, id: strawberry.ID) -> List[UsuarioType]:
        requerir_superadmin(info)
        return list(Usuario.objects.filter(granja_id=id))

    # ---- GALPONES ----
    @strawberry.field
    def galpones(self, granja_id: Optional[strawberry.ID] = None) -> List[GalponType]:
        qs = Galpon.objects.all()
        if granja_id:
            qs = qs.filter(granja_id=granja_id)
        return list(qs)

    @strawberry.field
    def galpon(self, id: strawberry.ID) -> Optional[GalponType]:
        return Galpon.objects.filter(pk=id).first()

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

    @strawberry.field
    def movimientos_aves_lote(self, info: Info, lote_id: strawberry.ID) -> List[MovimientoAveType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        return list(
            MovimientoAve.objects.filter(lote_id=lote_id).order_by("-fecha", "-id")
        )

    @strawberry.field
    def lotes_con_aves(self, info: Info) -> List[LoteType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        granja = _granja_por_defecto(info)
        return list(
            Lote.objects.filter(granja=granja).exclude(estado="baja").select_related("galpon")
        )

    # ---- CONSUMOS DE INSUMOS (ALIMENTO) ----
    @strawberry.field
    def consumos_lote(self, info: Info, lote_id: strawberry.ID) -> List[ConsumoInsumoType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"])
        return list(ConsumoInsumo.objects.filter(lote_id=lote_id).order_by("-fecha"))

    @strawberry.field
    def consumos_granja(self, info: Info, lote_id: Optional[strawberry.ID] = None) -> List[ConsumoInsumoType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        qs = ConsumoInsumo.objects.filter(granja=granja)
        if lote_id:
            qs = qs.filter(lote_id=lote_id)
        return list(qs.order_by("-fecha"))

    # ---- MEDICAMENTOS EN ALIMENTO ----
    @strawberry.field
    def medicamentos_alimento(self, info: Info, alimento_id: Optional[strawberry.ID] = None) -> List[MedicamentoEnAlimentoType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        qs = MedicamentoEnAlimento.objects.filter(granja=granja)
        if alimento_id:
            qs = qs.filter(alimento_id=alimento_id)
        return list(qs.order_by("-fecha_inicio"))

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

    # ---- TARIFAS ----
    @strawberry.field
    def tarifas_producto(self, info: Info, producto_id: strawberry.ID) -> List[TarifaProductoType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        return list(TarifaProducto.objects.filter(producto_id=producto_id).order_by("-fecha_inicio"))

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

    # ---- GENERACIONES DE ABONO ----
    @strawberry.field
    def generaciones_abono(self, estado: Optional[str] = None) -> List[GeneracionAbonoType]:
        qs = GeneracionAbono.objects.all()
        if estado:
            qs = qs.filter(estado=estado)
        return list(qs)

    # ---- PROVEEDORES Y COMPRAS ----
    @strawberry.field
    def proveedores(self, info: Info) -> List[ProveedorType]:
        granja = _granja_por_defecto(info)
        return list(Proveedor.objects.filter(granja=granja))

    @strawberry.field
    def compras(self, info: Info) -> List[CompraCompletaType]:
        granja = _granja_por_defecto(info)
        return list(Compra.objects.filter(granja=granja).prefetch_related("detalles__insumo"))

    # ---- PEDIDOS ----
    @strawberry.field
    def pedidos(
        self,
        estado: Optional[str] = None,
        fecha: Optional[date] = None,
        cliente_id: Optional[strawberry.ID] = None,
    ) -> List[PedidoCompletoType]:
        qs = Pedido.objects.select_related("cliente").prefetch_related("detalles__producto")
        if estado:
            qs = qs.filter(estado=estado)
        if fecha:
            qs = qs.filter(fecha_pedido=fecha)
        if cliente_id:
            qs = qs.filter(cliente_id=cliente_id)
        return list(qs)

    @strawberry.field
    def pedido(self, id: strawberry.ID) -> Optional[PedidoCompletoType]:
        return (
            Pedido.objects.select_related("cliente")
            .prefetch_related("detalles__producto")
            .filter(pk=id)
            .first()
        )

    @strawberry.field
    def detalles_pedido(self, pedido_id: strawberry.ID) -> List[DetallePedidoCompletoType]:
        return list(DetallePedido.objects.select_related("producto").filter(pedido_id=pedido_id))

    # ---- VENTAS ----
    @strawberry.field
    def ventas(self, cliente_id: Optional[strawberry.ID] = None) -> List[VentaCompletaType]:
        qs = Venta.objects.select_related("pedido__cliente")
        if cliente_id:
            qs = qs.filter(pedido__cliente_id=cliente_id)
        return list(qs)

    # ---- HISTORIAL DE COMPRAS POR CLIENTE ----
    @strawberry.field
    def historial_cliente(self, cliente_id: strawberry.ID) -> List[PedidoCompletoType]:
        return list(
            Pedido.objects.filter(cliente_id=cliente_id)
            .select_related("cliente")
            .prefetch_related("detalles__producto")
            .order_by("-fecha_pedido")
        )

    @strawberry.field
    def mis_pedidos(self, info: Info) -> List[PedidoCompletoType]:
        cliente = _cliente_desde_request(info.context.request)
        if not cliente:
            raise ValueError("Sesión de cliente no válida o expirada.")
        return list(
            Pedido.objects.filter(cliente=cliente)
            .select_related("cliente")
            .prefetch_related("detalles__producto")
            .order_by("-fecha_pedido", "-id")
        )

    @strawberry.field
    def mis_ventas_abono(self, info: Info) -> List[VentaGallinazaType]:
        cliente = _cliente_desde_request(info.context.request)
        if not cliente:
            raise ValueError("Sesión de cliente no válida o expirada.")
        return list(
            VentaGallinaza.objects.filter(cliente=cliente)
            .select_related("cliente")
            .prefetch_related("detalles__producto", "pagos")
            .order_by("-fecha", "-id")
        )

    # ---- DASHBOARD ----
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

        abono_generado_mes_kg = (
            GeneracionAbono.objects.filter(fecha__gte=inicio_mes, fecha__lte=hoy)
            .aggregate(total=Sum("cantidad_kg"))["total"]
            or Decimal("0")
        )
        abono_vendido_mes_kg = Decimal("0")
        detalles_abono = (
            DetallePedido.objects.filter(
                pedido__venta__fecha__gte=inicio_mes,
                pedido__venta__fecha__lte=hoy,
                producto__tipo="abono",
            )
            .select_related("producto")
        )
        for detalle in detalles_abono:
            unidad = detalle.producto.unidad_medida
            if unidad == "kg":
                kg_por_unidad = Decimal("1")
            elif unidad == "tonelada":
                kg_por_unidad = Decimal("1000")
            elif unidad == "saco":
                peso = re.search(
                    r"(\d+(?:[.,]\d+)?)\s*kg\b",
                    detalle.producto.nombre,
                    re.IGNORECASE,
                )
                if not peso:
                    continue
                kg_por_unidad = Decimal(peso.group(1).replace(",", "."))
            else:
                continue
            abono_vendido_mes_kg += detalle.cantidad * kg_por_unidad

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
            abono_generado_mes_kg=abono_generado_mes_kg,
            abono_vendido_mes_kg=abono_vendido_mes_kg,
            insumos_stock_bajo=insumos_bajos_list,
            insumos_por_vencer=proximos_vencer,
        )

    # ---- CONFIGURACIÓN DE LA TIENDA ----
    @strawberry.field
    def configuracion_tienda(self) -> ConfiguracionTiendaType:
        return ConfiguracionTienda.get_solo()

    # ============================================================
    # MÓDULO DE GALLINAZA (ABONO)
    # ============================================================
    @strawberry.field
    def productos_gallinaza(
        self, info: Info, solo_activos: bool = False,
        granja_id: Optional[strawberry.ID] = None,
    ) -> List[ProductoGallinazaType]:
        granja = Granja.objects.filter(pk=granja_id, activo=True).first() if granja_id else _granja_por_defecto(info)
        if not granja:
            return []
        qs = ProductoGallinaza.objects.filter(granja=granja)
        if solo_activos:
            qs = qs.filter(activo=True)
        return list(qs)

    @strawberry.field
    def entradas_gallinaza(
        self, info: Info, producto_id: Optional[strawberry.ID] = None,
        fecha_desde: Optional[date] = None, fecha_hasta: Optional[date] = None,
    ) -> List[EntradaGallinazaType]:
        granja = _granja_por_defecto(info)
        qs = EntradaGallinaza.objects.filter(producto__granja=granja)
        if producto_id:
            qs = qs.filter(producto_id=producto_id)
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)
        return list(qs.order_by("-fecha"))

    @strawberry.field
    def ventas_gallinaza(
        self, info: Info, fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
    ) -> List[VentaGallinazaType]:
        granja = _granja_por_defecto(info)
        qs = VentaGallinaza.objects.filter(granja=granja).select_related("cliente").prefetch_related("detalles__producto", "pagos")
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)
        return list(qs.order_by("-fecha"))

    @strawberry.field
    def movimientos_gallinaza(self, info: Info, producto_id: Optional[strawberry.ID] = None) -> List[MovimientoGallinazaType]:
        granja = _granja_por_defecto(info)
        qs = MovimientoGallinaza.objects.filter(producto__granja=granja)
        if producto_id:
            qs = qs.filter(producto_id=producto_id)
        return list(qs.order_by("-created_at"))


# ============================================================
# MUTATIONS
# ============================================================
@strawberry.type
class Mutation:

    @strawberry.mutation
    def crear_pedido_cliente(
        self, info: Info,
        granja_id: Optional[strawberry.ID] = None,
        huevos: Optional[List[DetalleInput]] = None,
        abono: Optional[List[LineaAbonoPedidoInput]] = None,
        nombres: Optional[str] = None,
        apellidos: Optional[str] = None,
        dni: Optional[str] = None,
        telefono: Optional[str] = None,
        email: Optional[str] = None,
        direccion: Optional[str] = None,
    ) -> PedidoClientePayload:
        """Registra el carrito público en los flujos actuales de huevos y abono."""
        huevos = huevos or []
        abono = abono or []
        if not huevos and not abono:
            raise ValueError("Agrega al menos un producto al pedido.")

        cliente = _cliente_desde_request(info.context.request)
        if cliente:
            granja = cliente.granja
            if granja_id and str(granja.pk) != str(granja_id):
                raise ValueError("Solo puedes pedir productos de tu granja.")
        else:
            if not granja_id or not all([nombres, apellidos, dni, telefono]):
                raise ValueError("Inicia sesión o completa tus datos de contacto.")
            granja = Granja.objects.filter(pk=granja_id, activo=True).first()
            if not granja:
                raise ValueError("La granja seleccionada no está disponible.")
            cliente = Cliente.objects.filter(granja=granja, dni=dni.strip()).first()
            if cliente and (cliente.telefono != telefono.strip() or not cliente.activo):
                raise ValueError("Revisa tus datos de contacto o inicia sesión en tu cuenta.")
            if not cliente:
                cliente = Cliente.objects.create(
                    granja=granja, nombres=nombres.strip(), apellidos=apellidos.strip(),
                    dni=dni.strip(), telefono=telefono.strip(),
                    email=(email or "").strip() or None,
                    direccion=(direccion or "").strip(), activo=True,
                )

        if not granja.activo:
            raise ValueError("Esta granja no está recibiendo pedidos por el momento.")

        fecha_pedido = timezone.localdate()
        pedido = None
        venta_abono = None
        total = Decimal("0")
        with transaction.atomic():
            if huevos:
                pedido = Pedido.objects.create(
                    granja=granja, cliente=cliente, fecha_pedido=fecha_pedido,
                    estado="pendiente",
                )
                for linea in huevos:
                    producto = Producto.objects.select_for_update().filter(
                        pk=linea.producto_id, granja=granja, activo=True, tipo="huevo",
                    ).first()
                    if not producto:
                        raise ValueError("Uno de los productos de huevo ya no está disponible.")
                    cantidad = Decimal(linea.cantidad)
                    if cantidad <= 0 or producto.stock < cantidad:
                        raise ValueError(f"Stock insuficiente para '{producto.nombre}'.")
                    tarifa = TarifaProducto.objects.filter(
                        producto=producto, activo=True, fecha_inicio__lte=fecha_pedido,
                    ).filter(
                        Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=fecha_pedido)
                    ).order_by("-fecha_inicio").first()
                    DetallePedido.objects.create(
                        pedido=pedido, producto=producto, cantidad=cantidad,
                        precio_unitario=tarifa.precio if tarifa else producto.precio_unitario,
                    )
                pedido.recalcular_total()
                total += pedido.total

            if abono:
                lineas_abono = [{
                    "producto_id": linea.producto_id,
                    "unidad_vendida": linea.unidad_vendida,
                    "cantidad": linea.cantidad,
                } for linea in abono]
                venta_abono = registrar_venta(
                    granja=granja, fecha=fecha_pedido, lineas=lineas_abono,
                    metodo_pago="credito", cliente_id=cliente.pk,
                    monto_recibido=Decimal("0"), usuario=None,
                )
                total += venta_abono.total

        if pedido:
            pedido = Pedido.objects.select_related("cliente").prefetch_related("detalles__producto").get(pk=pedido.pk)
        if venta_abono:
            venta_abono = VentaGallinaza.objects.select_related("cliente").prefetch_related("detalles__producto", "pagos").get(pk=venta_abono.pk)
        return PedidoClientePayload(pedido_huevos=pedido, pedido_abono=venta_abono, total=total)

    # ---- AUTENTICACIÓN ----
    @strawberry.mutation
    def login(self, username: str, password: str) -> LoginPayload:
        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)
        if user is None or not user.is_active:
            raise ValueError("Credenciales inválidas o usuario inactivo.")
        if not user.activo:
            raise ValueError("Tu usuario está desactivado. Contacta al administrador.")
        if user.granja_id and user.granja and not user.granja.activo:
            raise ValueError(
                "La granja asociada a tu usuario está suspendida. "
                "Contacta al administrador del sistema."
            )
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
            if user.granja_id and user.granja and not user.granja.activo:
                raise ValueError(
                    "La granja asociada a tu usuario está suspendida."
                )
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

    # ---- USUARIO (SOLO SUPERADMIN) ----
    @strawberry.mutation
    def crear_usuario(
        self, info: Info,
        username: str, email: str, password: str,
        rol_codigo: str, granja_id: strawberry.ID,
        nombres: str = "", apellidos: str = "", telefono: str = "",
    ) -> UsuarioType:
        user = requerir_superadmin(info)
        if len(password) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        granja = Granja.objects.filter(pk=granja_id).first()
        if not granja:
            raise ValueError("Granja no encontrada.")
        rol = Rol.objects.filter(codigo=rol_codigo, activo=True).first()
        if not rol:
            raise ValueError(f"Rol '{rol_codigo}' no existe.")
        if rol.codigo == Rol.SUPERADMIN:
            raise ValueError("No puedes crear otro superadministrador desde aquí.")
        if Usuario.objects.filter(username=username).exists():
            raise ValueError("El username ya existe.")
        if email and Usuario.objects.filter(email=email).exists():
            raise ValueError("El email ya está registrado.")
        nuevo = Usuario(
            username=username, email=email, granja=granja,
            nombres=nombres, apellidos=apellidos, telefono=telefono,
            activo=True, is_active=True,
        )
        nuevo.set_password(password)
        nuevo.save()
        nuevo.roles.add(rol)
        Auditoria.objects.create(
            granja=granja, usuario=user, usuario_texto=user.username,
            accion="crear", modelo="Usuario", objeto_id=str(nuevo.id),
            detalle={"username": username, "rol": rol_codigo},
        )
        return nuevo

    @strawberry.mutation
    def actualizar_usuario(
        self, info: Info, id: strawberry.ID,
        nombres: Optional[str] = None, apellidos: Optional[str] = None,
        telefono: Optional[str] = None, email: Optional[str] = None,
        activo: Optional[bool] = None, rol_codigo: Optional[str] = None,
    ) -> Optional[UsuarioType]:
        user = requerir_superadmin(info)
        objetivo = Usuario.objects.filter(pk=id).first()
        if not objetivo:
            return None
        for campo, valor in [
            ("nombres", nombres), ("apellidos", apellidos),
            ("telefono", telefono), ("email", email), ("activo", activo),
        ]:
            if valor is not None:
                setattr(objetivo, campo, valor)
        if rol_codigo:
            rol = Rol.objects.filter(codigo=rol_codigo).first()
            if rol and rol.codigo != Rol.SUPERADMIN:
                objetivo.roles.set([rol])
        objetivo.save()
        return objetivo

    @strawberry.mutation
    def eliminar_usuario(self, info: Info, id: strawberry.ID) -> bool:
        user = requerir_superadmin(info)
        objetivo = Usuario.objects.filter(pk=id).first()
        if not objetivo:
            return False
        if objetivo.pk == user.pk:
            raise ValueError("No puedes eliminar tu propia cuenta.")
        objetivo.delete()
        return True

    # ---- AUTENTICACIÓN DE CLIENTES ----
    @strawberry.mutation
    def login_cliente(self, email: str, password: str) -> LoginClientePayload:
        clientes = Cliente.objects.filter(
            email__iexact=email.strip(), activo=True, puede_loguearse=True
        ).select_related("granja").order_by("id")
        cliente = next(
            (c for c in clientes if c.password_hash and check_password(password, c.password_hash)),
            None,
        )
        if not cliente:
            raise ValueError("Correo o contraseña inválidos.")
        if cliente.granja and not cliente.granja.activo:
            raise ValueError(
                "El portal de esta granja está temporalmente suspendido. "
                "Intenta más tarde."
            )
        tokens = _tokens_cliente(cliente)
        return LoginClientePayload(
            access=tokens["access"], refresh=tokens["refresh"], cliente=cliente
        )

    @strawberry.mutation
    def solicitar_activacion_cliente(
        self, granja_id: strawberry.ID, email: str, dni: str, telefono: str,
    ) -> bool:
        """Envía un código temporal al email ya guardado en el perfil del cliente."""
        email_limpio = email.strip()
        clientes = Cliente.objects.filter(
            granja_id=granja_id, email__iexact=email_limpio, dni=dni.strip(), activo=True,
        )
        cliente = next(
            (c for c in clientes if _digitos(c.telefono) == _digitos(telefono)),
            None,
        )
        if not cliente:
            # Respuesta uniforme: no revelar si el correo pertenece a una cuenta.
            return True

        ahora = timezone.now()
        activacion_reciente = ClienteActivacion.objects.filter(
            cliente=cliente, usado_en__isnull=True,
            creado_en__gte=ahora - timedelta(seconds=60),
        ).exists()
        if activacion_reciente:
            return True

        ClienteActivacion.objects.filter(cliente=cliente).delete()
        codigo = f"{secrets.randbelow(1_000_000):06d}"
        activacion = ClienteActivacion.objects.create(
            cliente=cliente,
            codigo_hash=make_password(codigo),
            expira_en=ahora + timedelta(minutes=10),
        )
        try:
            enviados = send_mail(
                subject="Código para activar tu cuenta de AVICONTROL",
                message=(
                    f"Tu código de activación es: {codigo}\n\n"
                    "Vence en 10 minutos. Si no solicitaste este código, ignora este mensaje."
                ),
                from_email=None,
                recipient_list=[cliente.email],
                fail_silently=False,
            )
            if not enviados:
                raise RuntimeError("El correo no fue aceptado por el backend de email.")
        except Exception as exc:
            activacion.delete()
            raise ValueError("No se pudo enviar el código. Inténtalo más tarde.") from exc
        return True

    @strawberry.mutation
    def confirmar_activacion_cliente(
        self, email: str, codigo: str, password: str,
    ) -> LoginClientePayload:
        if len(password) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        email_limpio = email.strip()
        ahora = timezone.now()
        payload = None
        with transaction.atomic():
            activaciones = ClienteActivacion.objects.filter(
                cliente__email__iexact=email_limpio, cliente__activo=True,
                usado_en__isnull=True, expira_en__gt=ahora, intentos__lt=5,
            ).select_for_update().select_related("cliente")
            candidatos = list(activaciones[:10])
            activacion = next(
                (a for a in candidatos if check_password(codigo.strip(), a.codigo_hash)),
                None,
            )
            if not activacion:
                if candidatos:
                    intentos = candidatos[0]
                    intentos.intentos += 1
                    if intentos.intentos >= 5:
                        intentos.usado_en = ahora
                    intentos.save(update_fields=["intentos", "usado_en"])
            else:
                cliente = activacion.cliente
                cliente.password_hash = make_password(password)
                cliente.puede_loguearse = True
                cliente.save(update_fields=["password_hash", "puede_loguearse"])
                activacion.usado_en = ahora
                activacion.save(update_fields=["usado_en"])
                tokens = _tokens_cliente(cliente)
                payload = LoginClientePayload(
                    access=tokens["access"], refresh=tokens["refresh"], cliente=cliente
                )
        if payload is None:
            raise ValueError("El código es inválido o expiró.")
        return payload

    @strawberry.mutation
    def registro_cliente(
        self, granja_id: strawberry.ID, nombres: str, apellidos: str,
        dni: str, telefono: str, email: str, password: str,
    ) -> LoginClientePayload:
        if len(password) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        if not Granja.objects.filter(pk=granja_id).exists():
            raise ValueError("Granja no encontrada.")
        email = email.strip().lower()
        dni = dni.strip()
        if Cliente.objects.filter(email__iexact=email).exists():
            raise ValueError(
                "Ese correo ya está asociado a un cliente. Usa «Activar cuenta» para crear tu acceso."
            )
        if Cliente.objects.filter(granja_id=granja_id, dni=dni).exists():
            raise ValueError(
                "Ya existe un cliente con ese DNI. Si es tu perfil, activa la cuenta existente."
            )
        cliente = Cliente.objects.create(
            granja_id=granja_id, nombres=nombres, apellidos=apellidos,
            dni=dni, telefono=telefono, email=email, direccion="",
            password_hash=make_password(password), puede_loguearse=True,
            activo=True,
        )
        tokens = _tokens_cliente(cliente)
        return LoginClientePayload(
            access=tokens["access"], refresh=tokens["refresh"], cliente=cliente
        )

    # ---- CLIENTES ----
    @strawberry.mutation
    def crear_cliente(
        self, info: Info, nombres: str, apellidos: str, dni: str, telefono: str,
        email: Optional[str] = None, direccion: str = "",
    ) -> ClienteType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        granja = _granja_por_defecto(info)
        if Cliente.objects.filter(granja=granja, dni=dni).exists():
            raise ValueError("Ya existe un cliente con ese DNI en esta granja.")
        return Cliente.objects.create(
            granja=granja, nombres=nombres, apellidos=apellidos, dni=dni,
            telefono=telefono, email=email, direccion=direccion,
        )

    @strawberry.mutation
    def actualizar_cliente(
        self, info: Info, id: strawberry.ID, nombres: Optional[str] = None,
        apellidos: Optional[str] = None, telefono: Optional[str] = None,
        email: Optional[str] = None, direccion: Optional[str] = None,
    ) -> Optional[ClienteType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
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
    def eliminar_cliente(self, info: Info, id: strawberry.ID) -> bool:
        requerir_rol(info, ["superadmin", "admin_granja"])
        eliminado, _ = Cliente.objects.filter(pk=id).delete()
        return eliminado > 0

    # ---- GRANJAS ----
    @strawberry.mutation
    def crear_granja(
        self, info: Info, nombre: str, codigo: str, ubicacion: str,
        telefono: str = "", email: str = "",
        razon_social: Optional[str] = None, nit: Optional[str] = None,
        propietario: Optional[str] = None,
        logo_url: Optional[str] = None, imagen_hero_url: Optional[str] = None,
    ) -> GranjaType:
        requerir_superadmin(info)
        if Granja.objects.filter(nombre=nombre).exists():
            raise ValueError("Ya existe una granja con ese nombre.")
        if Granja.objects.filter(codigo=codigo).exists():
            raise ValueError("Ya existe una granja con ese código.")
        return Granja.objects.create(
            nombre=nombre, codigo=codigo, ubicacion=ubicacion,
            telefono=telefono, email=email,
            razon_social=razon_social, nit=nit, propietario=propietario,
            logo_url=logo_url, imagen_hero_url=imagen_hero_url,
        )

    @strawberry.mutation
    def actualizar_granja(
        self, info: Info, id: strawberry.ID, nombre: Optional[str] = None,
        ubicacion: Optional[str] = None, telefono: Optional[str] = None,
        email: Optional[str] = None, activo: Optional[bool] = None,
        razon_social: Optional[str] = None, nit: Optional[str] = None,
        propietario: Optional[str] = None,
        logo_url: Optional[str] = None, imagen_hero_url: Optional[str] = None,
    ) -> Optional[GranjaType]:
        requerir_superadmin(info)
        granja = Granja.objects.filter(pk=id).first()
        if not granja:
            return None
        if nombre and Granja.objects.filter(nombre=nombre).exclude(pk=granja.pk).exists():
            raise ValueError("Ya existe una granja con ese nombre.")
        for campo, valor in [
            ("nombre", nombre), ("ubicacion", ubicacion),
            ("telefono", telefono), ("email", email), ("activo", activo),
            ("razon_social", razon_social), ("nit", nit), ("propietario", propietario),
            ("logo_url", logo_url), ("imagen_hero_url", imagen_hero_url),
        ]:
            if valor is not None:
                setattr(granja, campo, valor)
        granja.save()
        return granja

    @strawberry.mutation
    def cambiar_estado_granja(
        self, info: Info, id: strawberry.ID, activo: bool,
    ) -> Optional[GranjaType]:
        user = requerir_superadmin(info)
        granja = Granja.objects.filter(pk=id).first()
        if not granja:
            return None
        if granja.activo == activo:
            return granja
        granja.activo = activo
        granja.save(update_fields=["activo"])
        Auditoria.objects.create(
            granja=granja,
            usuario=user,
            usuario_texto=user.username,
            accion="editar",
            modelo="Granja",
            objeto_id=str(granja.id),
            detalle={"activo": activo},
        )
        return granja

    # ---- GALPONES ----
    @strawberry.mutation
    def crear_galpon(
        self, info: Info, granja_id: strawberry.ID, codigo: str, capacidad_aves: int,
    ) -> GalponType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        
        granja = Granja.objects.filter(pk=granja_id).first()
        if not granja:
            raise ValueError("La granja no existe.")
        if capacidad_aves <= 0:
            raise ValueError("La capacidad del galpón debe ser mayor a cero.")
        if Galpon.objects.filter(granja=granja, codigo=codigo).exists():
            raise ValueError(f"Ya existe un galpón con el código '{codigo}' en esta granja.")

        return Galpon.objects.create(
            granja=granja, codigo=codigo, capacidad_aves=capacidad_aves,
        )

    # ---- LOTES ----
    @strawberry.mutation
    def crear_lote(
        self, info: Info, galpon_id: strawberry.ID, codigo: str, raza: str,
        fecha_ingreso: date, cantidad_aves: int, estado: str = "activo",
        etapa: str = "cria", fecha_nacimiento: Optional[date] = None,
    ) -> LoteType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        granja, galpon = _granja_de_galpon(galpon_id)
        
        etapas_validas = {e[0] for e in Lote.ETAPAS}
        if etapa not in etapas_validas:
            raise ValueError(f"Etapa inválida: {etapa}")
        if cantidad_aves <= 0:
            raise ValueError("La cantidad inicial de aves debe ser mayor a cero.")
        if cantidad_aves > galpon.capacidad_aves:
            raise ValueError(
                f"La cantidad ({cantidad_aves}) supera la capacidad del galpón '{galpon.codigo}' "
                f"que es de {galpon.capacidad_aves} aves."
            )
        if Lote.objects.filter(granja=granja, codigo=codigo).exists():
            raise ValueError(f"Ya existe un lote con el código '{codigo}' en esta granja.")

        with transaction.atomic():
            lote = Lote.objects.create(
                granja=granja, galpon=galpon, codigo=codigo, raza=raza,
                fecha_ingreso=fecha_ingreso, fecha_nacimiento=fecha_nacimiento,
                cantidad_aves=cantidad_aves, estado=estado, etapa=etapa,
            )
            MovimientoAve.objects.create(
                lote=lote, galpon=galpon, tipo="ingreso",
                cantidad=cantidad_aves, fecha=fecha_ingreso,
                motivo="Ingreso inicial al lote",
            )
        return lote

    @strawberry.mutation
    def registrar_movimiento_ave(
        self, info: Info, lote_id: strawberry.ID, tipo: str,
        cantidad: int, fecha: date, motivo: str = "",
        lote_destino_id: Optional[strawberry.ID] = None,
    ) -> MovimientoAveType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        lote = Lote.objects.filter(pk=lote_id).first()
        if not lote:
            raise ValueError("Lote no encontrado.")

        tipos_validos = {t[0] for t in MovimientoAve.TIPOS}
        if tipo not in tipos_validos:
            raise ValueError(f"Tipo inválido: {tipo}")

        if cantidad <= 0:
            raise ValueError("La cantidad debe ser mayor a 0.")

        if tipo in ["muerte", "venta", "traslado_salida", "descarte"]:
            if cantidad > lote.aves_actuales:
                raise ValueError(
                    f"No puedes sacar {cantidad} aves del lote '{lote.codigo}'. "
                    f"Solo hay {lote.aves_actuales} disponibles."
                )

        destino = None
        if tipo == "traslado_salida":
            if not lote_destino_id:
                raise ValueError("Debes indicar el lote destino para un traslado.")
            destino = Lote.objects.filter(pk=lote_destino_id).first()
            if not destino:
                raise ValueError("Lote destino no encontrado.")
            if destino.pk == lote.pk:
                raise ValueError("El lote destino no puede ser el mismo lote.")

        with transaction.atomic():
            mov = MovimientoAve.objects.create(
                lote=lote, galpon=lote.galpon, tipo=tipo,
                cantidad=cantidad, fecha=fecha, motivo=motivo,
                lote_destino=destino,
            )
            if tipo == "traslado_salida" and destino:
                MovimientoAve.objects.create(
                    lote=destino, galpon=destino.galpon,
                    tipo="traslado_entrada", cantidad=cantidad,
                    fecha=fecha, motivo=f"Traslado desde {lote.codigo}",
                    lote_destino=lote,
                )
        return mov

    @strawberry.mutation
    def ajustar_aves(
        self, info: Info, lote_id: strawberry.ID, cantidad: int,
        fecha: date, motivo: str,
    ) -> MovimientoAveType:
        requerir_rol(info, ["superadmin", "admin_granja"])
        lote = Lote.objects.filter(pk=lote_id).first()
        if not lote:
            raise ValueError("Lote no encontrado.")
        if cantidad == 0:
            raise ValueError("La cantidad debe ser distinta de 0.")
        if cantidad < 0 and abs(cantidad) > lote.aves_actuales:
            raise ValueError(f"No puedes restar {abs(cantidad)} aves. Solo hay {lote.aves_actuales}.")

        tipo = "ajuste_positivo" if cantidad > 0 else "ajuste_negativo"

        return MovimientoAve.objects.create(
            lote=lote, galpon=lote.galpon,
            tipo=tipo, cantidad=abs(cantidad), fecha=fecha,
            motivo=motivo,
        )

    @strawberry.mutation
    def avanzar_etapa_lote(
        self, info: Info, lote_id: strawberry.ID,
    ) -> LoteType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        lote = Lote.objects.filter(pk=lote_id).first()
        if not lote:
            raise ValueError("Lote no encontrado.")
        orden = ["cria", "recria", "postura", "descarte"]
        try:
            idx = orden.index(lote.etapa)
        except ValueError:
            raise ValueError(f"Etapa actual desconocida: {lote.etapa}")
        if idx >= len(orden) - 1:
            raise ValueError("El lote ya está en la última etapa (descarte).")
        lote.etapa = orden[idx + 1]
        if lote.etapa == "postura" and lote.estado == "activo":
            lote.estado = "en_produccion"
        lote.save(update_fields=["etapa", "estado"])
        return lote

    @strawberry.mutation
    def actualizar_lote(
        self, info: Info, id: strawberry.ID, estado: Optional[str] = None,
        cantidad_aves: Optional[int] = None,
    ) -> Optional[LoteType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        lote = Lote.objects.filter(pk=id).first()
        if not lote:
            return None
        if estado is not None:
            lote.estado = estado
        if cantidad_aves is not None:
            lote.cantidad_aves = cantidad_aves
        lote.save()
        return lote

    # ---- CONSUMOS DE INSUMOS ----
    @strawberry.mutation
    def registrar_consumo(
        self, info: Info, lote_id: strawberry.ID, insumo_id: strawberry.ID,
        fecha: date, cantidad: Decimal, observaciones: str = "",
    ) -> ConsumoInsumoType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        lote = Lote.objects.filter(pk=lote_id, granja=granja).first()
        if not lote:
            raise ValueError("Lote no encontrado.")
        insumo = Insumo.objects.filter(pk=insumo_id, granja=granja).first()
        if not insumo:
            raise ValueError("Insumo no encontrado.")
        if insumo.tipo != "alimento":
            raise ValueError("Solo puedes registrar consumo de insumos de tipo 'alimento'.")
        
        with transaction.atomic():
            consumo = ConsumoInsumo.objects.select_for_update().filter(
                lote=lote, insumo=insumo, fecha=fecha
            ).first()
            
            if consumo:
                diferencia = cantidad - consumo.cantidad
                if diferencia > 0 and insumo.stock < diferencia:
                    raise ValueError(f"Stock insuficiente de '{insumo.nombre}'. Disponible: {insumo.stock}")
                consumo.cantidad = cantidad
                consumo.observaciones = observaciones
                consumo.save(update_fields=["cantidad", "observaciones"])
                if diferencia != 0:
                    Insumo.objects.filter(pk=insumo.pk).update(stock=F("stock") - diferencia)
            else:
                if insumo.stock < cantidad:
                    raise ValueError(f"Stock insuficiente de '{insumo.nombre}'. Disponible: {insumo.stock}")
                consumo = ConsumoInsumo.objects.create(
                    granja=granja, lote=lote, insumo=insumo, fecha=fecha,
                    cantidad=cantidad, observaciones=observaciones,
                )
                Insumo.objects.filter(pk=insumo.pk).update(stock=F("stock") - cantidad)
        
        return consumo

    @strawberry.mutation
    def eliminar_consumo(self, info: Info, id: strawberry.ID) -> bool:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"])
        with transaction.atomic():
            consumo = ConsumoInsumo.objects.select_for_update().filter(pk=id).first()
            if not consumo:
                return False
            Insumo.objects.filter(pk=consumo.insumo_id).update(stock=F("stock") + consumo.cantidad)
            consumo.delete()
        return True

    # ---- MEDICAMENTOS EN ALIMENTO ----
    @strawberry.mutation
    def crear_medicamento_alimento(
        self, info: Info, alimento_id: strawberry.ID, medicamento_id: strawberry.ID,
        dosis_por_kg: Decimal, fecha_inicio: date, periodo_retiro_dias: int = 0,
        fecha_fin: Optional[date] = None, observaciones: str = "",
    ) -> MedicamentoEnAlimentoType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        alimento = Insumo.objects.filter(pk=alimento_id, granja=granja, tipo="alimento").first()
        if not alimento:
            raise ValueError("Alimento no encontrado o no es de tipo alimento.")
        medicamento = Insumo.objects.filter(pk=medicamento_id, granja=granja, tipo="medicamento").first()
        if not medicamento:
            raise ValueError("Medicamento no encontrado o no es de tipo medicamento.")
        
        return MedicamentoEnAlimento.objects.create(
            granja=granja, alimento=alimento, medicamento=medicamento,
            dosis_por_kg=dosis_por_kg, fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin, periodo_retiro_dias=periodo_retiro_dias,
            observaciones=observaciones,
        )

    @strawberry.mutation
    def eliminar_medicamento_alimento(self, info: Info, id: strawberry.ID) -> bool:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        eliminado, _ = MedicamentoEnAlimento.objects.filter(pk=id).delete()
        return eliminado > 0

    # ---- PRODUCCIÓN ----
    @strawberry.mutation
    def registrar_produccion(
        self, info: Info, lote_id: strawberry.ID, fecha: date,
        huevos_primera: int = 0, huevos_segunda: int = 0,
        huevos_tercera: int = 0, huevos_descartados: int = 0,
    ) -> ProduccionType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        lote = Lote.objects.filter(pk=lote_id).first()
        if not lote:
            raise ValueError("Lote no encontrado.")

        with transaction.atomic():
            produccion, created = Produccion.objects.update_or_create(
                lote=lote, fecha=fecha,
                defaults={
                    "granja": lote.granja,
                    "huevos_primera": huevos_primera,
                    "huevos_segunda": huevos_segunda,
                    "huevos_tercera": huevos_tercera,
                    "huevos_descartados": huevos_descartados,
                },
            )
            
            if created:
                def sumar_stock(calidad, cantidad_huevos):
                    if cantidad_huevos <= 0:
                        return
                    productos = Producto.objects.filter(
                        granja=lote.granja, 
                        tipo="huevo", 
                        calidad=calidad,
                        activo=True
                    )
                    for prod in productos:
                        if prod.presentacion == "maple_30":
                            unidades = cantidad_huevos / 30
                        elif prod.presentacion == "caja_360":
                            unidades = cantidad_huevos / 360
                        elif prod.presentacion == "bandeja_12":
                            unidades = cantidad_huevos / 12
                        else:
                            unidades = cantidad_huevos
                        
                        prod.stock += Decimal(str(unidades))
                        prod.save(update_fields=["stock"])

                sumar_stock("primera", huevos_primera)
                sumar_stock("segunda", huevos_segunda)
                sumar_stock("tercera", huevos_tercera)

        return produccion

    # ---- PRODUCTOS ----
    @strawberry.mutation
    def crear_producto(
        self, info: Info, nombre: str, presentacion: str, calidad: str,
        precio_unitario: Decimal, stock: int = 0, stock_minimo: int = 0,
        tipo: str = "huevo", unidad_medida: str = "unidad",
    ) -> ProductoType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        return Producto.objects.create(
            granja=granja, nombre=nombre, tipo=tipo,
            presentacion=presentacion, calidad=calidad,
            unidad_medida=unidad_medida,
            precio_unitario=precio_unitario, stock=stock, stock_minimo=stock_minimo,
        )

    @strawberry.mutation
    def actualizar_producto(
        self, info: Info, id: strawberry.ID, precio_unitario: Optional[Decimal] = None,
        stock: Optional[int] = None, stock_minimo: Optional[int] = None,
        activo: Optional[bool] = None,
    ) -> Optional[ProductoType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
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

    # ---- TARIFAS ----
    @strawberry.mutation
    def crear_tarifa_producto(
        self, info: Info, producto_id: strawberry.ID, precio: Decimal,
        fecha_inicio: date, fecha_fin: Optional[date] = None,
        tipo: str = "temporada", nombre_temporada: str = "",
    ) -> TarifaProductoType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        producto = Producto.objects.filter(pk=producto_id).first()
        if not producto:
            raise ValueError("Producto no encontrado.")
        
        return TarifaProducto.objects.create(
            granja=producto.granja, producto=producto,
            precio=precio, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin,
            tipo=tipo, nombre_temporada=nombre_temporada,
        )

    @strawberry.mutation
    def eliminar_tarifa_producto(self, info: Info, id: strawberry.ID) -> bool:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        eliminado, _ = TarifaProducto.objects.filter(pk=id).delete()
        return eliminado > 0

    # ---- INSUMOS ----
    @strawberry.mutation
    def crear_insumo(
        self, info: Info, nombre: str, tipo: str, presentacion: str = "",
        stock: Decimal = Decimal("0"), stock_minimo: Decimal = Decimal("0"),
        precio_unitario: Decimal = Decimal("0"),
        fecha_vencimiento: Optional[date] = None,
    ) -> InsumoType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        return Insumo.objects.create(
            granja=granja, nombre=nombre, tipo=tipo, presentacion=presentacion,
            stock=stock, stock_minimo=stock_minimo,
            precio_unitario=precio_unitario, fecha_vencimiento=fecha_vencimiento,
        )

    @strawberry.mutation
    def actualizar_insumo(
        self, info: Info, id: strawberry.ID,
        nombre: Optional[str] = None, tipo: Optional[str] = None,
        presentacion: Optional[str] = None, stock: Optional[Decimal] = None,
        stock_minimo: Optional[Decimal] = None,
        precio_unitario: Optional[Decimal] = None,
        fecha_vencimiento: Optional[date] = None,
    ) -> Optional[InsumoType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        insumo = Insumo.objects.filter(pk=id).first()
        if not insumo:
            return None
        for campo, valor in [
            ("nombre", nombre), ("tipo", tipo), ("presentacion", presentacion),
            ("stock", stock), ("stock_minimo", stock_minimo),
            ("precio_unitario", precio_unitario), ("fecha_vencimiento", fecha_vencimiento),
        ]:
            if valor is not None:
                setattr(insumo, campo, valor)
        insumo.save()
        return insumo

    @strawberry.mutation
    def eliminar_insumo(self, info: Info, id: strawberry.ID) -> bool:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        eliminado, _ = Insumo.objects.filter(pk=id).delete()
        return eliminado > 0

    # ---- PROVEEDORES Y COMPRAS ----
    @strawberry.mutation
    def crear_proveedor(
        self, info: Info, nombre: str, telefono: str = "", email: Optional[str] = None
    ) -> ProveedorType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        if Proveedor.objects.filter(granja=granja, nombre=nombre).exists():
            raise ValueError("Ya existe un proveedor con ese nombre.")
        return Proveedor.objects.create(
            granja=granja, nombre=nombre, telefono=telefono, email=email
        )

    @strawberry.mutation
    def registrar_compra(
        self, info: Info, proveedor_id: strawberry.ID, fecha: date,
        detalles: List[DetalleCompraInput], numero_factura: str = ""
    ) -> CompraCompletaType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        proveedor = Proveedor.objects.filter(pk=proveedor_id, granja=granja).first()
        if not proveedor:
            raise ValueError("Proveedor no encontrado en esta granja.")

        with transaction.atomic():
            compra = Compra.objects.create(
                granja=granja, proveedor=proveedor,
                fecha=fecha, numero_factura=numero_factura, estado="recibida"
            )
            almacen = Almacen.objects.filter(granja=granja).first()
            for d in detalles:
                insumo = Insumo.objects.filter(pk=d.insumo_id, granja=granja).first()
                if not insumo:
                    raise ValueError(f"Insumo con ID {d.insumo_id} no encontrado.")
                DetalleCompra.objects.create(
                    compra=compra, insumo=insumo,
                    cantidad=d.cantidad, precio_unitario=d.precio_unitario
                )
                insumo.stock += d.cantidad
                insumo.save()
                if almacen:
                    MovimientoStock.objects.create(
                        granja=granja, almacen=almacen, insumo=insumo,
                        tipo="entrada", motivo="compra", cantidad=d.cantidad,
                        referencia=f"Compra #{compra.id}"
                    )
            compra.recalcular_total()

        return Compra.objects.prefetch_related("detalles__insumo").get(pk=compra.pk)

    # ---- PEDIDOS ----
    @strawberry.mutation
    def crear_pedido(
        self, info: Info, cliente_id: strawberry.ID, fecha_pedido: date,
        detalles: List[DetalleInput],
    ) -> PedidoCompletoType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        if not detalles:
            raise ValueError("El pedido debe tener al menos un producto.")

        cliente = Cliente.objects.filter(pk=cliente_id).first()
        if not cliente:
            raise ValueError("Cliente no encontrado.")

        with transaction.atomic():
            pedido = Pedido.objects.create(
                granja=cliente.granja, cliente=cliente,
                fecha_pedido=fecha_pedido, estado="pendiente",
            )
            for d in detalles:
                producto = Producto.objects.select_for_update().get(pk=d.producto_id)
                if producto.stock < d.cantidad:
                    raise ValueError(
                        f"Stock insuficiente para '{producto.nombre}'. "
                        f"Disponible: {producto.stock}, solicitado: {d.cantidad}."
                    )
                
                precio_final = producto.precio_unitario
                tarifa = TarifaProducto.objects.filter(
                    producto=producto,
                    activo=True,
                    fecha_inicio__lte=fecha_pedido,
                ).filter(
                    Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=fecha_pedido)
                ).order_by("-fecha_inicio").first()
                
                if tarifa:
                    precio_final = tarifa.precio

                DetallePedido.objects.create(
                    pedido=pedido, producto=producto,
                    cantidad=d.cantidad, precio_unitario=precio_final,
                )
            pedido.recalcular_total()
        return (
            Pedido.objects.select_related("cliente")
            .prefetch_related("detalles__producto")
            .get(pk=pedido.pk)
        )

    @strawberry.mutation
    def cambiar_estado_pedido(
        self, info: Info, id: strawberry.ID, estado: str,
    ) -> Optional[PedidoCompletoType]:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        pedido = Pedido.objects.filter(pk=id).first()
        if not pedido:
            return None
        estados_validos = {"pendiente", "confirmado", "entregado", "anulado"}
        if estado not in estados_validos:
            raise ValueError(f"Estado inválido: {estado}")
        pedido.estado = estado
        pedido.save()
        return (
            Pedido.objects.select_related("cliente")
            .prefetch_related("detalles__producto")
            .get(pk=pedido.pk)
        )

    # ---- VENTAS ----
    @strawberry.mutation
    def registrar_venta(
        self, info: Info, pedido_id: strawberry.ID, forma_pago: str = "efectivo",
        fecha: Optional[date] = None,
    ) -> VentaCompletaType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        with transaction.atomic():
            pedido = Pedido.objects.select_for_update().get(pk=pedido_id)
            if pedido.estado == "entregado":
                raise ValueError("Este pedido ya fue entregado y cobrado.")
            if pedido.estado == "anulado":
                raise ValueError("Este pedido está anulado.")

            detalles = pedido.detalles.select_related("producto")
            tiene_huevos = any(d.producto.tipo == "huevo" for d in detalles)
            
            if tiene_huevos:
                hoy = fecha or timezone.now().date()
                hace_30_dias = hoy - timezone.timedelta(days=30)
                
                consumos_recientes = ConsumoInsumo.objects.filter(
                    granja=pedido.granja,
                    fecha__gte=hace_30_dias,
                ).select_related("insumo", "lote")
                
                for consumo in consumos_recientes:
                    meds = MedicamentoEnAlimento.objects.filter(
                        alimento=consumo.insumo,
                        fecha_inicio__lte=hoy
                    ).filter(
                        Q(fecha_fin__isnull=True) | Q(fecha_fin__gte=consumo.fecha)
                    ).select_related("medicamento")
                    
                    for med in meds:
                        if med.periodo_retiro_dias > 0:
                            fecha_limite = consumo.fecha + timezone.timedelta(days=med.periodo_retiro_dias)
                            if hoy <= fecha_limite:
                                dias_restantes = (fecha_limite - hoy).days
                                raise ValueError(
                                    f"BLOQUEO SANITARIO: El lote '{consumo.lote.codigo}' consumió alimento "
                                    f"con el medicamento '{med.medicamento.nombre}'. "
                                    f"Faltan {dias_restantes} días para que termine el período de retiro. "
                                    f"No puedes vender huevos de este lote hasta el {fecha_limite.strftime('%d/%m/%Y')}."
                                )

            for d in detalles:
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
                granja=pedido.granja,
                pedido=pedido,
                fecha=fecha or timezone.now().date(),
                monto_total=pedido.total,
                forma_pago=forma_pago,
            )
        return (
            Venta.objects.select_related("pedido__cliente")
            .prefetch_related("pedido__detalles__producto")
            .get(pk=venta.pk)
        )

    # ---- ABONO ----
    @strawberry.mutation
    def registrar_generacion_abono(
        self, info: Info, galpon_id: strawberry.ID, fecha: date,
        cantidad_kg: Decimal, estado: str = "fresco",
        lote_id: Optional[strawberry.ID] = None,
        responsable: str = "", observaciones: str = "",
    ) -> GeneracionAbonoType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_produccion"])
        granja, galpon = _granja_de_galpon(galpon_id)
        lote = None
        if lote_id:
            lote = Lote.objects.filter(pk=lote_id, granja=granja).first()
            if not lote:
                raise ValueError("Lote no encontrado en esta granja.")
        return GeneracionAbono.objects.create(
            granja=granja, galpon=galpon, lote=lote, fecha=fecha,
            cantidad_kg=cantidad_kg, estado=estado,
            responsable=responsable, observaciones=observaciones,
        )

    # ---- ACTUALIZAR CONFIGURACIÓN DE LA TIENDA ----
    @strawberry.mutation
    def actualizar_configuracion_tienda(
        self, info: Info,
        hero_titulo: Optional[str] = None,
        hero_subtitulo: Optional[str] = None,
        hero_cta_texto: Optional[str] = None,
        hero_imagen_url: Optional[str] = None,
        nombre_granja: Optional[str] = None,
        telefono_contacto: Optional[str] = None,
    ) -> ConfiguracionTiendaType:
        requerir_rol(info, ["superadmin", "admin_granja"])
        config = ConfiguracionTienda.get_solo()
        if nombre_granja is not None and nombre_granja != config.granja.nombre:
            if Granja.objects.filter(nombre=nombre_granja).exclude(
                pk=config.granja_id
            ).exists():
                raise ValueError("Ya existe una granja con ese nombre.")
            config.granja.nombre = nombre_granja
            config.granja.save(update_fields=["nombre"])
        for campo, valor in [
            ("hero_titulo", hero_titulo),
            ("hero_subtitulo", hero_subtitulo),
            ("hero_cta_texto", hero_cta_texto),
            ("hero_imagen_url", hero_imagen_url),
            ("telefono_contacto", telefono_contacto),
        ]:
            if valor is not None:
                setattr(config, campo, valor)
        config.save()
        return config

    # ============================================================
    # MÓDULO DE GALLINAZA (ABONO)
    # ============================================================
    @strawberry.mutation
    def guardar_producto_gallinaza(
        self, info: Info, id: Optional[strawberry.ID] = None,
        nombre: str = "", unidad_base: str = "kg",
        tipo: str = "listo",
        precio_bulto: Decimal = Decimal("0"), precio_kg: Decimal = Decimal("0"),
        precio_tonelada: Decimal = Decimal("0"),
        stock_minimo_kg: Decimal = Decimal("0"), activo: bool = True,
    ) -> ProductoGallinazaType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        granja = _granja_por_defecto(info)
        if id:
            producto = ProductoGallinaza.objects.filter(pk=id).first()
            if not producto:
                raise ValueError("Producto de gallinaza no encontrado.")
            producto.nombre = nombre
            producto.unidad_base = unidad_base
            producto.tipo = tipo
            producto.precio_bulto = precio_bulto
            producto.precio_kg = precio_kg
            producto.precio_tonelada = precio_tonelada
            producto.stock_minimo_kg = stock_minimo_kg
            producto.activo = activo
            producto.save()
            return producto
        return ProductoGallinaza.objects.create(
            granja=granja, nombre=nombre, unidad_base=unidad_base, tipo=tipo,
            precio_bulto=precio_bulto, precio_kg=precio_kg,
            precio_tonelada=precio_tonelada,
            stock_minimo_kg=stock_minimo_kg, activo=activo,
        )

    @strawberry.mutation
    def registrar_entrada_gallinaza(
        self, info: Info, producto_id: strawberry.ID, fecha: date,
        cantidad_kg: Decimal, origen: str = "", observaciones: str = "",
    ) -> EntradaGallinazaType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_almacen"])
        user = usuario_desde_request(info.context.request)
        granja = _granja_por_defecto(info)
        entrada = registrar_entrada(
            granja=granja, producto_id=producto_id, fecha=fecha, cantidad_kg=cantidad_kg,
            origen=origen, observaciones=observaciones, usuario=user,
        )
        return entrada

    @strawberry.mutation
    def registrar_venta_gallinaza(
        self, info: Info, fecha: date,
        detalles: List[LineaAbonoPedidoInput],
        cliente_id: Optional[strawberry.ID] = None,
        metodo_pago: str = "efectivo",
        monto_recibido: Decimal = Decimal("0"),
    ) -> VentaGallinazaType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        user = usuario_desde_request(info.context.request)
        granja = _granja_por_defecto(info)
        lineas = [
            {"producto_id": d.producto_id, "unidad_vendida": d.unidad_vendida, "cantidad": d.cantidad}
            for d in detalles
        ]
        venta = registrar_venta(
            granja=granja, fecha=fecha, lineas=lineas, cliente_id=cliente_id,
            metodo_pago=metodo_pago, monto_recibido=monto_recibido,
            usuario=user,
        )
        return venta

    @strawberry.mutation
    def registrar_pago_gallinaza(
        self, info: Info, venta_id: strawberry.ID,
        monto: Decimal, metodo: str = "efectivo",
    ) -> PagoGallinazaType:
        requerir_rol(info, ["superadmin", "admin_granja", "encargado_ventas"])
        user = usuario_desde_request(info.context.request)
        pago = registrar_pago(
            granja=_granja_por_defecto(info), venta_id=venta_id,
            monto=monto, metodo=metodo, usuario=user,
        )
        return pago


# ============================================================
# SCHEMA FINAL
# ============================================================
schema = strawberry.Schema(query=Query, mutation=Mutation)