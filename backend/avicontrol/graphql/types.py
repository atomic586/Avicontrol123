"""
Tipos GraphQL de Strawberry para el sistema AVICONTROL.
Cada tipo mapea a un modelo Django (3FN).
"""

import strawberry
import strawberry_django
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

from avicontrol.models import (
    Usuario, Cliente, Granja, Galpon, Lote,
    Produccion, Producto, Insumo, Pedido, DetallePedido, Venta,
)


# ============================================
# USUARIO
# ============================================
@strawberry_django.type(Usuario)
class UsuarioType:
    id: strawberry.ID
    username: str
    email: str
    rol: str
    nombres: str
    apellidos: str
    telefono: str
    activo: bool
    creado_en: datetime


# ============================================
# CLIENTE
# ============================================
@strawberry_django.type(Cliente)
class ClienteType:
    id: strawberry.ID
    nombres: str
    apellidos: str
    dni: str
    telefono: str
    email: Optional[str]
    direccion: str
    creado_en: datetime


# ============================================
# GRANJA
# ============================================
@strawberry_django.type(Granja)
class GranjaType:
    id: strawberry.ID
    nombre: str
    ubicacion: str
    telefono: str
    activo: bool
    creado_en: datetime


# ============================================
# GALPÓN
# ============================================
@strawberry_django.type(Galpon)
class GalponType:
    id: strawberry.ID
    granja_id: strawberry.ID
    codigo: str
    capacidad_aves: int
    activo: bool
    creado_en: datetime


# ============================================
# LOTE
# ============================================
@strawberry_django.type(Lote)
class LoteType:
    id: strawberry.ID
    galpon_id: strawberry.ID
    codigo: str
    raza: str
    fecha_ingreso: date
    cantidad_aves: int
    estado: str
    creado_en: datetime


# ============================================
# PRODUCCIÓN
# ============================================
@strawberry_django.type(Produccion)
class ProduccionType:
    id: strawberry.ID
    lote_id: strawberry.ID
    fecha: date
    huevos_primera: int
    huevos_segunda: int
    huevos_tercera: int
    huevos_descartados: int
    total: int
    creado_en: datetime


# ============================================
# PRODUCTO
# ============================================
@strawberry_django.type(Producto)
class ProductoType:
    id: strawberry.ID
    nombre: str
    presentacion: str
    calidad: str
    precio_unitario: Decimal
    stock: int
    stock_minimo: int
    activo: bool
    creado_en: datetime


# ============================================
# INSUMO
# ============================================
@strawberry_django.type(Insumo)
class InsumoType:
    id: strawberry.ID
    nombre: str
    tipo: str
    presentacion: str
    stock: Decimal
    stock_minimo: Decimal
    precio_unitario: Decimal
    fecha_vencimiento: Optional[date]
    creado_en: datetime


# ============================================
# DETALLE_PEDIDO
# ============================================
@strawberry_django.type(DetallePedido)
class DetallePedidoType:
    id: strawberry.ID
    pedido_id: strawberry.ID
    producto_id: strawberry.ID
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal


# ============================================
# PEDIDO
# ============================================
@strawberry_django.type(Pedido)
class PedidoType:
    id: strawberry.ID
    cliente_id: strawberry.ID
    fecha_pedido: date
    estado: str
    total: Decimal
    creado_en: datetime


# ============================================
# VENTA
# ============================================
@strawberry_django.type(Venta)
class VentaType:
    id: strawberry.ID
    pedido_id: strawberry.ID
    fecha: date
    monto_total: Decimal
    forma_pago: str
    creado_en: datetime


# ============================================================
# TIPOS EXTENDIDOS PARA PEDIDOS Y VENTAS (con cliente y detalles)
# ============================================================
@strawberry_django.type(Cliente)
class ClienteBasicoType:
    id: strawberry.ID
    nombres: str
    apellidos: str
    dni: str
    telefono: str


@strawberry_django.type(Producto)
class ProductoBasicoType:
    id: strawberry.ID
    nombre: str
    presentacion: str
    calidad: str
    precio_unitario: Decimal


@strawberry_django.type(DetallePedido)
class DetallePedidoCompletoType:
    id: strawberry.ID
    producto: ProductoBasicoType
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal


@strawberry_django.type(Pedido)
class PedidoCompletoType:
    id: strawberry.ID
    cliente: ClienteBasicoType
    fecha_pedido: date
    estado: str
    total: Decimal
    creado_en: datetime


@strawberry_django.type(Venta)
class VentaCompletaType:
    id: strawberry.ID
    pedido: PedidoCompletoType
    fecha: date
    monto_total: Decimal
    forma_pago: str
    creado_en: datetime