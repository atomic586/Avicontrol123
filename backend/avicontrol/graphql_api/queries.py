import strawberry
import strawberry_django
from avicontrol import models
from .types import (
    ClienteType,
    ProductoType,
    InsumoType,
    PedidoType,
    LoteType,
    ProduccionType,
    VentaType,
)

@strawberry.type
class Query:
    @strawberry_django.field
    def clientes(self) -> list[ClienteType]:
        return models.Cliente.objects.all()

    @strawberry_django.field
    def productos(self) -> list[ProductoType]:
        return models.Producto.objects.all()

    @strawberry_django.field
    def insumos(self) -> list[InsumoType]:
        return models.Insumo.objects.all()

    @strawberry_django.field
    def pedidos(self) -> list[PedidoType]:
        return models.Pedido.objects.all()

    @strawberry_django.field
    def lotes(self) -> list[LoteType]:
        return models.Lote.objects.all()

    @strawberry_django.field
    def producciones(self) -> list[ProduccionType]:
        return models.Produccion.objects.all()

    @strawberry_django.field
    def ventas(self) -> list[VentaType]:
        return models.Venta.objects.all()