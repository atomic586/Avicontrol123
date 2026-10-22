"""
Modelos de AVICONTROL - Sistema de Gestión Avícola
Normalizados a 3FN.
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator
from decimal import Decimal


# ============================================
# GESTOR DE USUARIOS PERSONALIZADO
# ============================================
class UsuarioManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('El username es obligatorio')
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'admin')
        extra_fields.setdefault('activo', True)
        return self.create_user(username, email, password, **extra_fields)


# ============================================
# 1. USUARIO
# ============================================
class Usuario(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('admin', 'Administrador'),
        ('encargado_galpon', 'Encargado de Galpón'),
        ('encargado_inventario', 'Encargado de Inventario'),
        ('encargado_ventas', 'Encargado de Ventas'),
    ]

    username    = models.CharField(max_length=50, unique=True)
    email       = models.EmailField(unique=True)
    rol         = models.CharField(max_length=30, choices=ROLES, default='encargado_ventas')
    nombres     = models.CharField(max_length=100, blank=True)
    apellidos   = models.CharField(max_length=100, blank=True)
    telefono    = models.CharField(max_length=20, blank=True)
    activo      = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    creado_en   = models.DateTimeField(auto_now_add=True)

    objects = UsuarioManager()

    USERNAME_FIELD  = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']

    def __str__(self):
        return f'{self.username} ({self.get_rol_display()})'

    @property
    def is_active(self):
        return self.activo


# ============================================
# 2. CLIENTE
# ============================================
class Cliente(models.Model):
    nombres    = models.CharField(max_length=100)
    apellidos  = models.CharField(max_length=100)
    dni        = models.CharField(max_length=20, unique=True, verbose_name='DNI/NIT')
    telefono   = models.CharField(max_length=20)
    email      = models.EmailField(blank=True)
    direccion  = models.CharField(max_length=255, blank=True)
    creado_en  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cliente'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f'{self.nombres} {self.apellidos} ({self.dni})'


# ============================================
# 3. GRANJA
# ============================================
class Granja(models.Model):
    nombre     = models.CharField(max_length=100, unique=True)
    ubicacion  = models.CharField(max_length=255)
    telefono   = models.CharField(max_length=20, blank=True)
    activo     = models.BooleanField(default=True)
    creado_en  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'granja'
        verbose_name = 'Granja'
        verbose_name_plural = 'Granjas'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


# ============================================
# 4. GALPON
# ============================================
class Galpon(models.Model):
    granja          = models.ForeignKey(Granja, on_delete=models.PROTECT, related_name='galpones')
    codigo          = models.CharField(max_length=50)
    capacidad_aves  = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    activo          = models.BooleanField(default=True)
    creado_en       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'galpon'
        unique_together = (('granja', 'codigo'),)   # código único por granja
        verbose_name = 'Galpón'
        verbose_name_plural = 'Galpones'
        ordering = ['granja', 'codigo']

    def __str__(self):
        return f'{self.granja.nombre} - {self.codigo}'


# ============================================
# 5. LOTE
# ============================================
class Lote(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('finalizado', 'Finalizado'),
        ('en_cuarentena', 'En Cuarentena'),
    ]

    galpon          = models.ForeignKey(Galpon, on_delete=models.PROTECT, related_name='lotes')
    codigo          = models.CharField(max_length=50, unique=True)
    raza            = models.CharField(max_length=50)  # Hy-Line Brown, Lohmann Brown, Isa Brown, etc.
    fecha_ingreso   = models.DateField()
    cantidad_aves   = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    estado          = models.CharField(max_length=20, choices=ESTADOS, default='activo')
    creado_en       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lote'
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        ordering = ['-fecha_ingreso']

    def __str__(self):
        return f'{self.codigo} - {self.raza}'
    # ============================================
# 6. PRODUCCION (registro diario por lote)
# ============================================
class Produccion(models.Model):
    lote                = models.ForeignKey(Lote, on_delete=models.PROTECT, related_name='producciones')
    fecha               = models.DateField()
    huevos_primera      = models.PositiveIntegerField(default=0)
    huevos_segunda      = models.PositiveIntegerField(default=0)
    huevos_tercera      = models.PositiveIntegerField(default=0)
    huevos_descartados  = models.PositiveIntegerField(default=0)
    total               = models.PositiveIntegerField(default=0, editable=False)
    creado_en           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'produccion'
        unique_together = (('lote', 'fecha'),)   # un registro por lote y fecha
        verbose_name = 'Producción'
        verbose_name_plural = 'Producciones'
        ordering = ['-fecha']

    def save(self, *args, **kwargs):
        # total se calcula automáticamente (regla de negocio)
        self.total = (
            self.huevos_primera + self.huevos_segunda +
            self.huevos_tercera + self.huevos_descartados
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.lote.codigo} - {self.fecha} - {self.total} huevos'


# ============================================
# 7. PRODUCTO
# ============================================
class Producto(models.Model):
    PRESENTACIONES = [
        ('maple', 'Maple de 30 huevos'),
        ('caja', 'Caja de 360 huevos'),
        ('bandeja', 'Bandeja de 12 huevos'),
        ('unidad', 'Unidad'),
    ]
    CATEGORIAS = [
        ('primera', 'Huevo de Primera'),
        ('segunda', 'Huevo de Segunda'),
        ('tercera', 'Huevo de Tercera'),
    ]

    nombre            = models.CharField(max_length=100)
    presentacion      = models.CharField(max_length=20, choices=PRESENTACIONES)
    categoria         = models.CharField(max_length=20, choices=CATEGORIAS, default='primera')
    precio_unitario   = models.DecimalField(max_digits=10, decimal_places=2,
                                            validators=[MinValueValidator(Decimal('0.01'))])
    stock             = models.PositiveIntegerField(default=0)
    stock_minimo      = models.PositiveIntegerField(default=0)
    activo            = models.BooleanField(default=True)
    creado_en         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'producto'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.get_presentacion_display()})'

    @property
    def bajo_stock(self):
        return self.stock <= self.stock_minimo


# ============================================
# 8. INSUMO
# ============================================
class Insumo(models.Model):
    TIPOS = [
        ('alimento', 'Alimento'),
        ('vacuna', 'Vacuna'),
        ('vitamina', 'Vitamina'),
        ('medicamento', 'Medicamento'),
    ]

    nombre              = models.CharField(max_length=100)
    tipo                = models.CharField(max_length=20, choices=TIPOS)
    presentacion        = models.CharField(max_length=50)  # ej: bulto 40 kg, frasco 500 ml
    stock               = models.PositiveIntegerField(default=0)
    stock_minimo        = models.PositiveIntegerField(default=0)
    precio_unitario     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_vencimiento   = models.DateField(null=True, blank=True)
    creado_en           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'insumo'
        verbose_name = 'Insumo'
        verbose_name_plural = 'Insumos'
        ordering = ['tipo', 'nombre']

    def __str__(self):
        return f'{self.nombre} ({self.get_tipo_display()})'

    @property
    def bajo_stock(self):
        return self.stock <= self.stock_minimo
    # ============================================
# 9. PEDIDO
# ============================================
class Pedido(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]

    cliente       = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='pedidos')
    fecha_pedido  = models.DateTimeField(auto_now_add=True)
    estado        = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    total         = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False)
    creado_en     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pedido'
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha_pedido']

    def __str__(self):
        return f'Pedido #{self.id} - {self.cliente} - {self.get_estado_display()}'

    def recalcular_total(self):
        """Suma los subtotales del detalle."""
        total = sum((d.subtotal for d in self.detalles.all()), Decimal('0'))
        self.total = total
        self.save(update_fields=['total'])
        return total


# ============================================
# 10. DETALLE_PEDIDO
# ============================================
class DetallePedido(models.Model):
    pedido            = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto          = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='detalles_pedido')
    cantidad          = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    precio_unitario   = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal          = models.DecimalField(max_digits=12, decimal_places=2, editable=False)

    class Meta:
        db_table = 'detalle_pedido'
        verbose_name = 'Detalle de Pedido'
        verbose_name_plural = 'Detalles de Pedido'

    def save(self, *args, **kwargs):
        self.subtotal = (self.precio_unitario * self.cantidad).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.pedido_id} - {self.producto.nombre} x {self.cantidad}'


# ============================================
# 11. VENTA
# ============================================
class Venta(models.Model):
    FORMAS_PAGO = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('qr', 'QR'),
        ('credito', 'Crédito'),
    ]

    pedido        = models.OneToOneField(Pedido, on_delete=models.PROTECT, related_name='venta')
    fecha         = models.DateTimeField(auto_now_add=True)
    monto_total   = models.DecimalField(max_digits=12, decimal_places=2)
    forma_pago    = models.CharField(max_length=20, choices=FORMAS_PAGO)
    creado_en     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'venta'
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-fecha']

    def __str__(self):
        return f'Venta #{self.id} - Pedido #{self.pedido_id} - Bs. {self.monto_total}'