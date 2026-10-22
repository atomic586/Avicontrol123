import strawberry
from typing import Optional
from avicontrol import models
from .types import ClienteType, ProductoType, InsumoType
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

@strawberry.type
class AuthPayload:
    token: str
    username: str
    rol: str

@strawberry.type
class Mutation:
    # --- AUTENTICACIÓN ---
    @strawberry.mutation
    def login(self, username: str, password: str) -> AuthPayload:
        user = authenticate(username=username, password=password)
        if not user:
            raise Exception("Credenciales inválidas")
        if not user.activo:
            raise Exception("Usuario inactivo")
            
        refresh = RefreshToken.for_user(user)
        return AuthPayload(
            token=str(refresh.access_token),
            username=user.username,
            rol=user.rol
        )

    # --- CLIENTES ---
    @strawberry.mutation
    def crear_cliente(self, nombres: str, apellidos: str, dni: str, telefono: str, email: str = "", direccion: str = "") -> ClienteType:
        cliente = models.Cliente.objects.create(
            nombres=nombres, apellidos=apellidos, dni=dni, 
            telefono=telefono, email=email, direccion=direccion
        )
        return cliente

    # --- PRODUCTOS ---
    @strawberry.mutation
    def crear_producto(self, nombre: str, presentacion: str, precio_unitario: float, stock: int) -> ProductoType:
        producto = models.Producto.objects.create(
            nombre=nombre, presentacion=presentacion, 
            precio_unitario=precio_unitario, stock=stock
        )
        return producto

    # --- INSUMOS ---
    @strawberry.mutation
    def crear_insumo(self, nombre: str, tipo: str, presentacion: str, stock: int, precio_unitario: float) -> InsumoType:
        insumo = models.Insumo.objects.create(
            nombre=nombre, tipo=tipo, presentacion=presentacion,
            stock=stock, precio_unitario=precio_unitario
        )
        return insumo