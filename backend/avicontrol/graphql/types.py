"""
Tipos GraphQL de Strawberry para AVICONTROL.
Cada tipo mapea a un modelo Django (multi-granja).
"""

import strawberry
import strawberry_django
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

from avicontrol.models import (
    Granja, Rol, Usuario, Cliente, Galpon, Lote, Produccion,
    Producto, Insumo, GeneracionAbono, Almacen, MovimientoStock,
    Pedido, DetallePedido, Venta, Auditoria, ConfiguracionTienda,
)


# ============================================================
# GRANJA
# ============================================================
@strawberry_django.type(Granja)
class GranjaType:
    id: strawberry.ID
    nombre: str
    codigo: str
    ubicacion: str
    telefono: str
    email: str
    activo: bool
    creado_en: datetime


# ============================================================
# ROL
# ============================================================
@strawberry_django.type(Rol)
class RolType:
    id: strawberry.ID
    codigo: str
    nombre: str
    descripcion: str
    activo: bool


# ============================================================
# USUARIO
# ============================================================
@strawberry_django.type(Usuario)
class UsuarioType:
    id: strawberry.ID
    username: str
    email: str
    nombres: str
    apellidos: str
    telefono: str
    activo: bool
    is_active: bool
    is_staff: bool
    granja_id: Optional[strawberry.ID]
    creado_en: datetime

    @strawberry.field
    def roles(self) -> List[RolType]:
        return list(self.roles.all())


# ============================================================
# CLIENTE
# ============================================================
@strawberry_django.type(Cliente)
class ClienteType:
    id: strawberry.ID
    granja_id: strawberry.ID
    nombres: str
    apellidos: str
    dni: str
    telefono: str
    email: Optional[str]
    direccion: str
    puede_loguearse: bool
    activo: bool
    creado_en: datetime


@strawberry_django.type(Cliente)
class ClienteBasicoType:
    id: strawberry.ID
    nombres: str
    apellidos: str
    dni: str
    telefono: str
    email: Optional[str]


# ============================================================
# GALPÓN
# ============================================================
@strawberry_django.type(Galpon)
class GalponType:
    id: strawberry.ID
    granja_id: strawberry.ID
    codigo: str
    capacidad_aves: int
    activo: bool
    creado_en: datetime

    @strawberry.field
    def granja(self) -> GranjaType:
        return self.granja


# ============================================================
# LOTE
# ============================================================
@strawberry_django.type(Lote)
class LoteType:
    id: strawberry.ID
    granja_id: strawberry.ID
    galpon_id: strawberry.ID
    codigo: str
    raza: str
    fecha_ingreso: date
    cantidad_aves: int
    estado: str
    creado_en: datetime

    @strawberry.field
    def galpon(self) -> GalponType:
        return self.galpon


# ============================================================
# PRODUCCIÓN
# ============================================================
@strawberry_django.type(Produccion)
class ProduccionType:
    id: strawberry.ID
    granja_id: strawberry.ID
    lote_id: strawberry.ID
    fecha: date
    huevos_primera: int
    huevos_segunda: int
    huevos_tercera: int
    huevos_descartados: int
    total: int
    creado_en: datetime


# ============================================================
# PRODUCTO (huevo / abono / otro)
# ============================================================
@strawberry_django.type(Producto)
class ProductoType:
    id: strawberry.ID
    granja_id: strawberry.ID
    nombre: str
    tipo: str
    presentacion: str
    calidad: str
    unidad_medida: str
    precio_unitario: Decimal
    stock: Decimal
    stock_minimo: Decimal
    activo: bool
    creado_en: datetime


@strawberry_django.type(Producto)
class ProductoBasicoType:
    id: strawberry.ID
    nombre: str
    tipo: str
    presentacion: str
    calidad: str
    unidad_medida: str
    precio_unitario: Decimal


# ============================================================
# INSUMO
# ============================================================
@strawberry_django.type(Insumo)
class InsumoType:
    id: strawberry.ID
    granja_id: strawberry.ID
    nombre: str
    tipo: str
    presentacion: str
    stock: Decimal
    stock_minimo: Decimal
    precio_unitario: Decimal
    fecha_vencimiento: Optional[date]
    creado_en: datetime


# ============================================================
# GENERACIÓN DE ABONO
# ============================================================
@strawberry_django.type(GeneracionAbono)
class GeneracionAbonoType:
    id: strawberry.ID
    granja_id: strawberry.ID
    galpon_id: strawberry.ID
    lote_id: Optional[strawberry.ID]
    fecha: date
    cantidad_kg: Decimal
    estado: str
    responsable: str
    observaciones: str
    creado_en: datetime


# ============================================================
# ALMACÉN Y MOVIMIENTOS
# ============================================================
@strawberry_django.type(Almacen)
class AlmacenType:
    id: strawberry.ID
    granja_id: strawberry.ID
    nombre: str
    ubicacion: str
    activo: bool


@strawberry_django.type(MovimientoStock)
class MovimientoStockType:
    id: strawberry.ID
    granja_id: strawberry.ID
    almacen_id: strawberry.ID
    producto_id: Optional[strawberry.ID]
    insumo_id: Optional[strawberry.ID]
    tipo: str
    motivo: str
    cantidad: Decimal
    referencia: str
    creado_en: datetime


# ============================================================
# PEDIDO
# ============================================================
@strawberry_django.type(Pedido)
class PedidoType:
    id: strawberry.ID
    granja_id: strawberry.ID
    cliente_id: strawberry.ID
    fecha_pedido: date
    estado: str
    total: Decimal
    creado_en: datetime


@strawberry_django.type(Pedido)
class PedidoCompletoType:
    id: strawberry.ID
    granja_id: strawberry.ID
    estado: str
    total: Decimal
    fecha_pedido: date
    creado_en: datetime

    @strawberry.field
    def cliente(self) -> ClienteBasicoType:
        return self.cliente

    @strawberry.field
    def detalles_pedido(
        self, pedido_id: Optional[strawberry.ID] = None
    ) -> List["DetallePedidoCompletoType"]:
        return list(self.detalles.select_related("producto").all())


# ============================================================
# DETALLE_PEDIDO
# ============================================================
@strawberry_django.type(DetallePedido)
class DetallePedidoType:
    id: strawberry.ID
    pedido_id: strawberry.ID
    producto_id: strawberry.ID
    cantidad: Decimal
    precio_unitario: Decimal
    subtotal: Decimal


@strawberry_django.type(DetallePedido)
class DetallePedidoCompletoType:
    id: strawberry.ID
    cantidad: Decimal
    precio_unitario: Decimal
    subtotal: Decimal

    @strawberry.field
    def producto(self) -> ProductoBasicoType:
        return self.producto


# ============================================================
# VENTA
# ============================================================
@strawberry_django.type(Venta)
class VentaType:
    id: strawberry.ID
    granja_id: strawberry.ID
    pedido_id: strawberry.ID
    fecha: date
    monto_total: Decimal
    forma_pago: str
    creado_en: datetime


@strawberry_django.type(Venta)
class VentaCompletaType:
    id: strawberry.ID
    granja_id: strawberry.ID
    fecha: date
    monto_total: Decimal
    forma_pago: str
    creado_en: datetime

    @strawberry.field
    def pedido(self) -> PedidoCompletoType:
        return self.pedido


# ============================================================
# AUDITORÍA
# ============================================================
@strawberry_django.type(Auditoria)
class AuditoriaType:
    id: strawberry.ID
    granja_id: Optional[strawberry.ID]
    usuario_id: Optional[strawberry.ID]
    usuario_texto: str
    accion: str
    modelo: str
    objeto_id: str
    detalle: strawberry.scalars.JSON
    creado_en: datetime


# ============================================================
# CONFIGURACIÓN DE LA TIENDA
# ============================================================
@strawberry_django.type(ConfiguracionTienda)
class ConfiguracionTiendaType:
    id: strawberry.ID
    granja_id: strawberry.ID
    hero_titulo: str
    hero_subtitulo: str
    hero_cta_texto: str
    hero_imagen_url: Optional[str]
    telefono_contacto: str
    actualizado_en: datetime

    @strawberry.field
    def nombre_granja(self) -> str:
        return self.granja.nombre
