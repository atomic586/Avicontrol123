import decimal
import strawberry
import strawberry_django
from avicontrol import models
from typing import List, Optional
from datetime import date, datetime

# ==========================================
# USUARIO
# ==========================================
@strawberry_django.type(models.Usuario)
class UsuarioType:
    id: strawberry.ID
    username: str
    email: str
    rol: str
    nombres: str
    apellidos: str
    telefono: Optional[str]
    activo: bool
    creado_en: datetime

# ==========================================
# CLIENTE
# ==========================================
@strawberry_django.type(models.Cliente)
class ClienteType:
    id: strawberry.ID
    nombres: str
    apellidos: str
    dni: str
    telefono: str
    email: Optional[str]
    direccion: Optional[str]
    creado_en: datetime

# ==========================================
# GRANJA
# ==========================================
@strawberry_django.type(models.Granja)
class GranjaType:
    id: strawberry.ID
    nombre: str
    ubicacion: str
    telefono: Optional[str]
    activo: bool
    creado_en: datetime

# ==========================================
# GALPON
# ==========================================
@strawberry_django.type(models.Galpon)
class GalponType:
    id: strawberry.ID
    codigo: str
    capacidad_aves: int
    activo: bool
    creado_en: datetime
    granja: GranjaType

# ==========================================
# LOTE
# ==========================================
@strawberry_django.type(models.Lote)
class LoteType:
    id: strawberry.ID
    codigo: str
    raza: str
    fecha_ingreso: date
    cantidad_aves: int
    estado: str
    creado_en: datetime
    galpon: GalponType

# ==========================================
# PRODUCCION
# ==========================================
@strawberry_django.type(models.Produccion)
class ProduccionType:
    id: strawberry.ID
    fecha: date
    huevos_primera: int
    huevos_segunda: int
    huevos_tercera: int
    huevos_descartados: int
    total: int
    creado_en: datetime
    lote: LoteType

# ==========================================
# PRODUCTO
# ==========================================
@strawberry_django.type(models.Producto)
class ProductoType:
    id: strawberry.ID
    nombre: str
    presentacion: str
    precio_unitario: decimal.Decimal  # <-- Decimal (arregla error de Float)
    stock: int
    stock_minimo: int
    activo: bool
    creado_en: datetime

# ==========================================
# INSUMO
# ==========================================
@strawberry_django.type(models.Insumo)
class InsumoType:
    id: strawberry.ID
    nombre: str
    tipo: str
    presentacion: str
    stock: int
    stock_minimo: int
    precio_unitario: decimal.Decimal  # <-- Decimal
    fecha_vencimiento: Optional[date]
    creado_en: datetime

# ==========================================
# DETALLE PEDIDO
# ==========================================
@strawberry_django.type(models.DetallePedido)
class DetallePedidoType:
    id: strawberry.ID
    cantidad: int
    precio_unitario: decimal.Decimal  # <-- Decimal
    subtotal: decimal.Decimal         # <-- Decimal
    producto: ProductoType

# ==========================================
# PEDIDO
# ==========================================
@strawberry_django.type(models.Pedido)
class PedidoType:
    id: strawberry.ID
    fecha_pedido: datetime
    estado: str
    total: decimal.Decimal  # <-- Decimal
    creado_en: datetime
    cliente: ClienteType

@strawberry_django.type(models.DetallePedido)
class DetallePedidoType:
    id: strawberry.ID
    producto: ProductoType
    cantidad: int
    precio_unitario: decimal.Decimal
    subtotal: decimal.Decimal

@strawberry_django.type(models.Pedido)
class PedidoType:
    id: strawberry.ID
    cliente: ClienteType
    fecha_pedido: datetime
    estado: str
    total: decimal.Decimal
    creado_en: datetime
    detalles: List[DetallePedidoType]

# ==========================================
# VENTA
# ==========================================
@strawberry_django.type(models.Venta)
class VentaType:
    id: strawberry.ID
    fecha: datetime
    monto_total: decimal.Decimal  # <-- Decimal
    forma_pago: str
    creado_en: datetime
    pedido: PedidoType

# ==========================================
# INPUTS PARA MUTATIONS
# ==========================================
@strawberry.input
class ClienteInput:
    nombres: str
    apellidos: str
    dni: str
    telefono: str
    email: Optional[str] = None
    direccion: Optional[str] = None

@strawberry.input
class LoteInput:
    galpon_id: strawberry.ID
    codigo: str
    raza: str
    fecha_ingreso: date
    cantidad_aves: int

@strawberry.input
class InsumoInput:
    nombre: str
    tipo: str
    presentacion: str
    stock: int
    stock_minimo: int
    precio_unitario: decimal.Decimal
    fecha_vencimiento: Optional[date] = None

@strawberry.input
class DetallePedidoInput:
    producto_id: strawberry.ID
    cantidad: int

@strawberry.input
class VentaInput:
    pedido_id: strawberry.ID
    forma_pago: str