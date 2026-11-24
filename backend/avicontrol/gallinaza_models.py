"""Modelos aislados para inventario y venta de gallinaza."""

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from .models import Cliente, Granja, Usuario


class ProductoGallinaza(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="productos_gallinaza")
    nombre = models.CharField(max_length=120)
    unidad_base = models.CharField(max_length=2, default="kg", editable=False)
    precio_bulto = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0"))])
    precio_kg = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0"))])
    precio_tonelada = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0"))])
    stock_actual_kg = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0"))])
    stock_minimo_kg = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0"))])
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "producto_gallinaza"
        ordering = ["nombre"]
        constraints = [models.UniqueConstraint(fields=["granja", "nombre"], name="uq_producto_gallinaza_granja_nombre")]
        indexes = [models.Index(fields=["granja", "activo"], name="idx_prod_gall_granja_activo")]

    @property
    def stock_bajo(self):
        return self.stock_actual_kg < self.stock_minimo_kg

    def __str__(self):
        return self.nombre


class EntradaGallinaza(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="entradas_gallinaza")
    producto = models.ForeignKey(ProductoGallinaza, on_delete=models.PROTECT, related_name="entradas")
    fecha = models.DateField()
    cantidad_kg = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    origen = models.CharField(max_length=160)
    observaciones = models.TextField(blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="entradas_gallinaza")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "entrada_gallinaza"
        ordering = ["-fecha", "-id"]
        indexes = [models.Index(fields=["granja", "fecha"], name="idx_ent_gall_granja_fecha")]


class VentaGallinaza(models.Model):
    METODOS_PAGO = [(v, v.replace("_", " ").title()) for v in ("efectivo", "transferencia", "tarjeta", "credito")]
    ESTADOS = [(v, v.title()) for v in ("pagada", "pendiente", "parcial")]

    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="ventas_gallinaza")
    numero = models.PositiveBigIntegerField()
    fecha = models.DateField()
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name="ventas_gallinaza")
    total = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pagada")
    monto_recibido = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cambio = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="ventas_gallinaza")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "venta_gallinaza"
        ordering = ["-fecha", "-numero"]
        constraints = [models.UniqueConstraint(fields=["granja", "numero"], name="uq_venta_gallinaza_granja_numero")]
        indexes = [models.Index(fields=["granja", "fecha", "estado"], name="idx_vta_gall_granja_fecha_est")]

    @property
    def total_pagado(self):
        return self.pagos.aggregate(total=models.Sum("monto"))["total"] or Decimal("0")

    @property
    def saldo_pendiente(self):
        return max(self.total - self.total_pagado, Decimal("0"))


class DetalleVentaGallinaza(models.Model):
    UNIDADES = [("bulto", "Bulto"), ("kg", "Kilogramo"), ("tonelada", "Tonelada")]
    venta = models.ForeignKey(VentaGallinaza, on_delete=models.CASCADE, related_name="detalles")
    producto = models.ForeignKey(ProductoGallinaza, on_delete=models.PROTECT, related_name="detalles_venta")
    unidad_vendida = models.CharField(max_length=12, choices=UNIDADES)
    cantidad = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    cantidad_kg = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])

    class Meta:
        db_table = "detalle_venta_gallinaza"


class PagoGallinaza(models.Model):
    METODOS_PAGO = VentaGallinaza.METODOS_PAGO
    venta = models.ForeignKey(VentaGallinaza, on_delete=models.CASCADE, related_name="pagos")
    monto = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    fecha = models.DateTimeField()
    metodo = models.CharField(max_length=20, choices=METODOS_PAGO)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="pagos_gallinaza")

    class Meta:
        db_table = "pago_gallinaza"
        ordering = ["fecha", "id"]


class MovimientoGallinaza(models.Model):
    TIPOS = [("entrada", "Entrada"), ("salida", "Salida")]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="movimientos_gallinaza")
    producto = models.ForeignKey(ProductoGallinaza, on_delete=models.PROTECT, related_name="movimientos")
    tipo = models.CharField(max_length=10, choices=TIPOS)
    cantidad_kg = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    referencia = models.CharField(max_length=100, blank=True)
    entrada = models.ForeignKey(EntradaGallinaza, on_delete=models.SET_NULL, null=True, blank=True, related_name="movimientos")
    detalle_venta = models.ForeignKey(DetalleVentaGallinaza, on_delete=models.SET_NULL, null=True, blank=True, related_name="movimientos")
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="movimientos_gallinaza")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "movimiento_gallinaza"
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["granja", "producto", "created_at"], name="idx_mov_gall_prod_fecha")]
