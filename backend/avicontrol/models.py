"""
Modelos del sistema AVICONTROL (Sistema de Gestión Avícola).
Diseño normalizado hasta Tercera Forma Normal (3FN).
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, RegexValidator


# ============================================================
# 1. USUARIO (roles del sistema)
# ============================================================
class Usuario(AbstractUser):
    """
    Usuario extendido de Django con rol y datos personales.
    Hereda username, email, password, first_name, last_name, is_active, etc.
    """
    ROLES = [
        ("admin", "Administrador"),
        ("encargado_galpon", "Encargado de Galpón"),
        ("encargado_inventario", "Encargado de Inventario"),
        ("encargado_ventas", "Encargado de Ventas"),
    ]

    rol = models.CharField(max_length=30, choices=ROLES, default="encargado_ventas")
    nombres = models.CharField(max_length=100, blank=True)
    apellidos = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(
        max_length=20, blank=True,
        validators=[RegexValidator(r"^[0-9+\-() ]{6,20}$", "Teléfono inválido.")]
    )
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "usuario"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["-creado_en"]

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"


# ============================================================
# 2. CLIENTE (comprador de huevos)
# ============================================================
class Cliente(models.Model):
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    dni = models.CharField(
        max_length=15, unique=True,
        validators=[RegexValidator(r"^[0-9]{6,15}$", "DNI debe contener solo dígitos (6-15).")]
    )
    telefono = models.CharField(
        max_length=20,
        validators=[RegexValidator(r"^[0-9+\-() ]{6,20}$", "Teléfono inválido.")]
    )
    email = models.EmailField(blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cliente"
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["apellidos", "nombres"]

    def __str__(self):
        return f"{self.apellidos}, {self.nombres} (DNI {self.dni})"


# ============================================================
# 3. GRANJA
# ============================================================
class Granja(models.Model):
    nombre = models.CharField(max_length=120, unique=True)
    ubicacion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "granja"
        verbose_name = "Granja"
        verbose_name_plural = "Granjas"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


# ============================================================
# 4. GALPÓN
# ============================================================
class Galpon(models.Model):
    granja = models.ForeignKey(
        Granja, on_delete=models.CASCADE, related_name="galpones"
    )
    codigo = models.CharField(max_length=30)
    capacidad_aves = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "galpon"
        verbose_name = "Galpón"
        verbose_name_plural = "Galpones"
        unique_together = [("granja", "codigo")]
        ordering = ["granja", "codigo"]

    def __str__(self):
        return f"{self.granja.nombre} - {self.codigo}"


# ============================================================
# 5. LOTE
# ============================================================
class Lote(models.Model):
    RAZAS = [
        ("Hy-Line Brown", "Hy-Line Brown"),
        ("Lohmann Brown", "Lohmann Brown"),
        ("Isa Brown", "Isa Brown"),
        ("Babcock Brown", "Babcock Brown"),
        ("Otra", "Otra"),
    ]
    ESTADOS = [
        ("activo", "Activo"),
        ("en_produccion", "En producción"),
        ("finalizado", "Finalizado"),
        ("baja", "Baja"),
    ]

    galpon = models.ForeignKey(
        Galpon, on_delete=models.PROTECT, related_name="lotes"
    )
    codigo = models.CharField(max_length=40, unique=True)
    raza = models.CharField(max_length=40, choices=RAZAS, default="Hy-Line Brown")
    fecha_ingreso = models.DateField()
    cantidad_aves = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lote"
        verbose_name = "Lote"
        verbose_name_plural = "Lotes"
        ordering = ["-fecha_ingreso"]

    def __str__(self):
        return f"{self.codigo} - {self.raza}"


# ============================================================
# 6. PRODUCCIÓN DIARIA
# ============================================================
class Produccion(models.Model):
    lote = models.ForeignKey(
        Lote, on_delete=models.CASCADE, related_name="producciones"
    )
    fecha = models.DateField()
    huevos_primera = models.PositiveIntegerField(default=0)
    huevos_segunda = models.PositiveIntegerField(default=0)
    huevos_tercera = models.PositiveIntegerField(default=0)
    huevos_descartados = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0, editable=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "produccion"
        verbose_name = "Producción"
        verbose_name_plural = "Producciones"
        unique_together = [("lote", "fecha")]
        ordering = ["-fecha"]

    def save(self, *args, **kwargs):
        self.total = (
            self.huevos_primera + self.huevos_segunda
            + self.huevos_tercera + self.huevos_descartados
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.lote.codigo} - {self.fecha} ({self.total} huevos)"


# ============================================================
# 7. PRODUCTO (huevos listos para la venta)
# ============================================================
class Producto(models.Model):
    PRESENTACIONES = [
        ("maple_30", "Maple de 30 huevos"),
        ("caja_360", "Caja de 360 huevos"),
        ("bandeja_12", "Bandeja de 12 huevos"),
        ("otra", "Otra"),
    ]
    CALIDADES = [
        ("primera", "Primera"),
        ("segunda", "Segunda"),
        ("tercera", "Tercera"),
        ("mixta", "Mixta"),
    ]

    nombre = models.CharField(max_length=120)
    presentacion = models.CharField(max_length=20, choices=PRESENTACIONES, default="maple_30")
    calidad = models.CharField(max_length=20, choices=CALIDADES, default="primera")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    stock_minimo = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "producto"
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ["nombre"]

    @property
    def stock_bajo(self):
        return self.stock <= self.stock_minimo

    def __str__(self):
        return f"{self.nombre} ({self.get_presentacion_display()})"


# ============================================================
# 8. INSUMO (alimento, vacunas, vitaminas, medicamentos)
# ============================================================
class Insumo(models.Model):
    TIPOS = [
        ("alimento", "Alimento"),
        ("vacuna", "Vacuna"),
        ("vitamina", "Vitamina"),
        ("medicamento", "Medicamento"),
        ("otro", "Otro"),
    ]

    nombre = models.CharField(max_length=120)
    tipo = models.CharField(max_length=20, choices=TIPOS, default="alimento")
    presentacion = models.CharField(max_length=80, blank=True)
    stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock_minimo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "insumo"
        verbose_name = "Insumo"
        verbose_name_plural = "Insumos"
        ordering = ["nombre"]

    @property
    def stock_bajo(self):
        return self.stock <= self.stock_minimo

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


# ============================================================
# 9. PEDIDO (cabecera del pedido de un cliente)
# ============================================================
class Pedido(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("confirmado", "Confirmado"),
        ("entregado", "Entregado"),
        ("anulado", "Anulado"),
    ]

    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name="pedidos"
    )
    fecha_pedido = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pedido"
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-fecha_pedido"]

    def recalcular_total(self):
        total = sum((d.subtotal for d in self.detalles.all()), start=0)
        self.total = total
        self.save(update_fields=["total"])
        return self.total

    def __str__(self):
        return f"Pedido #{self.pk} - {self.cliente} ({self.get_estado_display()})"


# ============================================================
# 10. DETALLE_PEDIDO (líneas del pedido)
# ============================================================
class DetallePedido(models.Model):
    pedido = models.ForeignKey(
        Pedido, on_delete=models.CASCADE, related_name="detalles"
    )
    producto = models.ForeignKey(
        Producto, on_delete=models.PROTECT, related_name="detalles_pedido"
    )
    cantidad = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    class Meta:
        db_table = "detalle_pedido"
        verbose_name = "Detalle de Pedido"
        verbose_name_plural = "Detalles de Pedido"
        unique_together = [("pedido", "producto")]

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)
        self.pedido.recalcular_total()

    def delete(self, *args, **kwargs):
        pedido = self.pedido
        super().delete(*args, **kwargs)
        pedido.recalcular_total()

    def __str__(self):
        return f"{self.producto} x {self.cantidad}"


# ============================================================
# 11. VENTA (cobro del pedido entregado)
# ============================================================
class Venta(models.Model):
    FORMAS_PAGO = [
        ("efectivo", "Efectivo"),
        ("transferencia", "Transferencia"),
        ("qr", "QR"),
        ("tarjeta", "Tarjeta"),
        ("credito", "Crédito"),
    ]

    pedido = models.OneToOneField(
        Pedido, on_delete=models.PROTECT, related_name="venta"
    )
    fecha = models.DateField()
    monto_total = models.DecimalField(max_digits=12, decimal_places=2)
    forma_pago = models.CharField(max_length=20, choices=FORMAS_PAGO, default="efectivo")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "venta"
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"
        ordering = ["-fecha"]

    def __str__(self):
        return f"Venta #{self.pk} - Pedido #{self.pedido_id} ({self.monto_total} Bs)"