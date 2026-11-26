"""
Modelos de AVICONTROL - ERP Avícola Multi-Granja
Diseño 3FN con soporte multi-tenant (granja_id en todas las tablas operativas).
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, RegexValidator
from decimal import Decimal


# ============================================================
# 0. GRANJA (entidad multi-tenant)
# ============================================================
class Granja(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    codigo = models.CharField(
        max_length=20, unique=True,
        validators=[RegexValidator(r"^[A-Z0-9\-]{2,20}$", "Código: mayúsculas, números y guiones (2-20).")]
    )
    ubicacion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "granja"
        verbose_name = "Granja"
        verbose_name_plural = "Granjas"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ============================================================
# 1. ROLES
# ============================================================
class Rol(models.Model):
    SUPERADMIN = "superadmin"
    ADMIN_GRANJA = "admin_granja"
    ENCARGADO_VENTAS = "encargado_ventas"
    ENCARGADO_PRODUCCION = "encargado_produccion"
    ENCARGADO_ALMACEN = "encargado_almacen"

    ROLES = [
        (SUPERADMIN, "Superadministrador"),
        (ADMIN_GRANJA, "Administrador de Granja"),
        (ENCARGADO_VENTAS, "Encargado de Ventas"),
        (ENCARGADO_PRODUCCION, "Encargado de Producción"),
        (ENCARGADO_ALMACEN, "Encargado de Almacén"),
    ]

    codigo = models.CharField(max_length=30, choices=ROLES, unique=True)
    nombre = models.CharField(max_length=60)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "rol"
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["codigo"]

    def __str__(self):
        return self.nombre


# ============================================================
# 2. USUARIO (Staff)
# ============================================================
class Usuario(AbstractUser):
    granja = models.ForeignKey(
        Granja, on_delete=models.PROTECT,
        null=True, blank=True, related_name="usuarios"
    )
    roles = models.ManyToManyField(Rol, blank=True, related_name="usuarios")
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
        return f"{self.username} ({self.get_roles_display()})"

    def get_roles_display(self):
        return ", ".join(r.nombre for r in self.roles.all()) or "Sin rol"

    @property
    def es_superadmin(self):
        return self.roles.filter(codigo=Rol.SUPERADMIN).exists()

    @property
    def es_admin_granja(self):
        return self.roles.filter(codigo=Rol.ADMIN_GRANJA).exists()

    @property
    def rol_principal(self):
        if self.es_superadmin:
            return Rol.SUPERADMIN
        if self.es_admin_granja:
            return Rol.ADMIN_GRANJA
        r = self.roles.first()
        return r.codigo if r else "sin_rol"


# ============================================================
# 3. CLIENTE
# ============================================================
class Cliente(models.Model):
    granja = models.ForeignKey(
        Granja, on_delete=models.CASCADE, related_name="clientes"
    )
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    dni = models.CharField(
        max_length=15,
        validators=[RegexValidator(r"^[0-9]{6,15}$", "DNI debe contener solo dígitos (6-15).")]
    )
    telefono = models.CharField(
        max_length=20,
        validators=[RegexValidator(r"^[0-9+\-() ]{6,20}$", "Teléfono inválido.")]
    )
    email = models.EmailField(blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    puede_loguearse = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cliente"
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["apellidos", "nombres"]
        unique_together = [("granja", "dni")]
        indexes = [models.Index(fields=["granja", "email"])]

    def __str__(self):
        return f"{self.apellidos}, {self.nombres} (DNI {self.dni})"

    @property
    def rol(self):
        return "cliente"


class ClienteActivacion(models.Model):
    """Código temporal para habilitar o recuperar el acceso de un cliente."""

    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="activaciones_login"
    )
    codigo_hash = models.CharField(max_length=255)
    intentos = models.PositiveSmallIntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    expira_en = models.DateTimeField()
    usado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "cliente_activacion"
        ordering = ["-creado_en"]

    def __str__(self):
        return f"Activación de cliente {self.cliente_id}"


# ============================================================
# 4. GALPÓN
# ============================================================
class Galpon(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="galpones")
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
        return f"{self.granja.codigo} - {self.codigo}"

    @property
    def aves_actuales(self):
        from django.db.models import Sum
        total = 0
        for lote in self.lotes.exclude(estado="baja"):
            ingresos = lote.movimientos_aves.filter(
                tipo__in=["ingreso", "traslado_entrada", "ajuste_positivo"]
            ).aggregate(s=Sum("cantidad"))["s"] or 0
            salidas = lote.movimientos_aves.filter(
                tipo__in=["muerte", "venta", "traslado_salida", "descarte", "ajuste_negativo"]
            ).aggregate(s=Sum("cantidad"))["s"] or 0
            total += ingresos - salidas
        return total


# ============================================================
# 5. LOTE
# ============================================================
class Lote(models.Model):
    ESTADOS = [
        ("activo", "Activo"),
        ("en_produccion", "En producción"),
        ("finalizado", "Finalizado"),
        ("baja", "Baja"),
    ]
    ETAPAS = [
        ("cria", "Cría (0-6 semanas)"),
        ("recria", "Recría (6-18 semanas)"),
        ("postura", "Postura (18-80 semanas)"),
        ("descarte", "Descarte (>80 semanas)"),
    ]
    RAZAS = [
        ("Hy-Line Brown", "Hy-Line Brown"),
        ("Lohmann Brown", "Lohmann Brown"),
        ("Isa Brown", "Isa Brown"),
        ("Babcock Brown", "Babcock Brown"),
        ("Otra", "Otra"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="lotes")
    galpon = models.ForeignKey(Galpon, on_delete=models.PROTECT, related_name="lotes")
    codigo = models.CharField(max_length=40)
    raza = models.CharField(max_length=40, choices=RAZAS, default="Hy-Line Brown")
    fecha_ingreso = models.DateField()
    fecha_nacimiento = models.DateField(null=True, blank=True)
    cantidad_aves = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    estado = models.CharField(max_length=20, choices=ESTADOS, default="activo")
    etapa = models.CharField(max_length=20, choices=ETAPAS, default="cria")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lote"
        verbose_name = "Lote"
        verbose_name_plural = "Lotes"
        unique_together = [("granja", "codigo")]
        ordering = ["-fecha_ingreso"]

    def __str__(self):
        return f"{self.codigo} - {self.raza}"

    @property
    def aves_actuales(self):
        from django.db.models import Sum
        ingresos = self.movimientos_aves.filter(
            tipo__in=["ingreso", "traslado_entrada", "ajuste_positivo"]
        ).aggregate(total=Sum("cantidad"))["total"] or 0
        salidas = self.movimientos_aves.filter(
            tipo__in=["muerte", "venta", "traslado_salida", "descarte", "ajuste_negativo"]
        ).aggregate(total=Sum("cantidad"))["total"] or 0
        return ingresos - salidas

    @property
    def porcentaje_mortalidad(self):
        from django.db.models import Sum
        ingresos = self.movimientos_aves.filter(
            tipo__in=["ingreso", "traslado_entrada", "ajuste_positivo"]
        ).aggregate(total=Sum("cantidad"))["total"] or 0
        muertes = self.movimientos_aves.filter(
            tipo="muerte"
        ).aggregate(total=Sum("cantidad"))["total"] or 0
        if ingresos == 0:
            return 0
        return round((muertes / ingresos) * 100, 2)

    @property
    def edad_semanas(self):
        from django.utils import timezone
        if not self.fecha_nacimiento:
            return None
        delta = timezone.now().date() - self.fecha_nacimiento
        return int(delta.days / 7)


# ============================================================
# 5.1 MOVIMIENTO DE AVES
# ============================================================
class MovimientoAve(models.Model):
    TIPOS = [
        ("ingreso", "Ingreso inicial"),
        ("muerte", "Muerte"),
        ("venta", "Venta"),
        ("traslado_salida", "Traslado (sale)"),
        ("traslado_entrada", "Traslado (entra)"),
        ("descarte", "Descarte"),
        ("ajuste_positivo", "Ajuste (suma)"),
        ("ajuste_negativo", "Ajuste (resta)"),
    ]

    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name="movimientos_aves")
    galpon = models.ForeignKey(Galpon, on_delete=models.PROTECT, related_name="movimientos_aves")
    tipo = models.CharField(max_length=20, choices=TIPOS)
    cantidad = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    fecha = models.DateField()
    motivo = models.CharField(max_length=200, blank=True)
    lote_destino = models.ForeignKey(
        Lote, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="traslados_entrantes"
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "movimiento_ave"
        verbose_name = "Movimiento de Ave"
        verbose_name_plural = "Movimientos de Aves"
        ordering = ["-fecha", "-creado_en"]
        indexes = [models.Index(fields=["lote", "-fecha"])]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.cantidad} aves - {self.lote.codigo}"


# ============================================================
# 6. PRODUCCIÓN DIARIA
# ============================================================
class Produccion(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="producciones")
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name="producciones")
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
# 7. PRODUCTO (huevo / abono / otro)
# ============================================================
class Producto(models.Model):
    TIPOS = [
        ("huevo", "Huevo"),
        ("abono", "Abono (gallinaza)"),
        ("otro", "Otro"),
    ]
    PRESENTACIONES = [
        ("maple_30", "Maple de 30 huevos"),
        ("caja_360", "Caja de 360 huevos"),
        ("bandeja_12", "Bandeja de 12 huevos"),
        ("saco_kg", "Saco (kg)"),
        ("tonelada", "Tonelada"),
        ("granel", "A granel"),
        ("otra", "Otra"),
    ]
    CALIDADES = [
        ("primera", "Primera"),
        ("segunda", "Segunda"),
        ("tercera", "Tercera"),
        ("mixta", "Mixta"),
        ("fresco", "Fresco"),
        ("acondicionado", "Acondicionado"),
        ("compostado", "Compostado"),
        ("otra", "Otra"),
    ]
    UNIDADES = [
        ("unidad", "Unidad"),
        ("kg", "Kilogramo"),
        ("tonelada", "Tonelada"),
        ("saco", "Saco"),
        ("maple", "Maple"),
        ("caja", "Caja"),
    ]

    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="productos")
    nombre = models.CharField(max_length=120)
    tipo = models.CharField(max_length=20, choices=TIPOS, default="huevo")
    presentacion = models.CharField(max_length=20, choices=PRESENTACIONES, default="maple_30")
    calidad = models.CharField(max_length=20, choices=CALIDADES, default="primera")
    unidad_medida = models.CharField(max_length=20, choices=UNIDADES, default="unidad")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock_minimo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "producto"
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ["tipo", "nombre"]
        indexes = [models.Index(fields=["granja", "tipo", "activo"])]

    @property
    def stock_bajo(self):
        return self.stock <= self.stock_minimo

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


# ============================================================
# 8. INSUMO
# ============================================================
class Insumo(models.Model):
    TIPOS = [
        ("alimento", "Alimento"),
        ("vacuna", "Vacuna"),
        ("vitamina", "Vitamina"),
        ("medicamento", "Medicamento"),
        ("otro", "Otro"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="insumos")
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
        indexes = [models.Index(fields=["granja", "tipo"])]

    @property
    def stock_bajo(self):
        return self.stock <= self.stock_minimo

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


# ============================================================
# 9. GENERACIÓN DE ABONO
# ============================================================
class GeneracionAbono(models.Model):
    ESTADOS = [
        ("fresco", "Fresco"),
        ("en_tratamiento", "En tratamiento"),
        ("seco", "Seco"),
        ("listo", "Listo para vender"),
        ("descartado", "Descartado"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="generaciones_abono")
    galpon = models.ForeignKey(Galpon, on_delete=models.PROTECT, related_name="generaciones_abono")
    lote = models.ForeignKey(Lote, on_delete=models.PROTECT, null=True, blank=True, related_name="generaciones_abono")
    fecha = models.DateField()
    cantidad_kg = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    estado = models.CharField(max_length=20, choices=ESTADOS, default="fresco")
    responsable = models.CharField(max_length=120, blank=True)
    observaciones = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "generacion_abono"
        verbose_name = "Generación de Abono"
        verbose_name_plural = "Generaciones de Abono"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.galpon.codigo} - {self.fecha} ({self.cantidad_kg} kg)"


# ============================================================
# 10. ALMACÉN Y MOVIMIENTOS DE STOCK
# ============================================================
class Almacen(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="almacenes")
    nombre = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=200, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "almacen"
        verbose_name = "Almacén"
        verbose_name_plural = "Almacenes"
        unique_together = [("granja", "nombre")]

    def __str__(self):
        return f"{self.granja.codigo} - {self.nombre}"


class MovimientoStock(models.Model):
    TIPOS = [
        ("entrada", "Entrada"),
        ("salida", "Salida"),
        ("ajuste", "Ajuste"),
    ]
    MOTIVOS = [
        ("compra", "Compra"),
        ("venta", "Venta"),
        ("produccion", "Producción"),
        ("ajuste_manual", "Ajuste manual"),
        ("devolucion", "Devolución"),
        ("otro", "Otro"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="movimientos_stock")
    almacen = models.ForeignKey(Almacen, on_delete=models.PROTECT, related_name="movimientos")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, null=True, blank=True, related_name="movimientos")
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT, null=True, blank=True, related_name="movimientos")
    tipo = models.CharField(max_length=20, choices=TIPOS)
    motivo = models.CharField(max_length=20, choices=MOTIVOS, default="otro")
    cantidad = models.DecimalField(max_digits=12, decimal_places=2)
    referencia = models.CharField(max_length=100, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "movimiento_stock"
        verbose_name = "Movimiento de Stock"
        verbose_name_plural = "Movimientos de Stock"
        ordering = ["-creado_en"]

    def __str__(self):
        return f"{self.tipo} {self.cantidad} ({self.motivo})"


# ============================================================
# 11. PEDIDO
# ============================================================
class Pedido(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("confirmado", "Confirmado"),
        ("entregado", "Entregado"),
        ("anulado", "Anulado"),
    ]
    ESTADOS_ENTREGA = [
        ("pendiente", "Pendiente"),
        ("preparando", "Preparando"),
        ("en_ruta", "En Ruta"),
        ("entregado", "Entregado"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="pedidos")
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name="pedidos")
    fecha_pedido = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    estado_entrega = models.CharField(max_length=20, choices=ESTADOS_ENTREGA, default="pendiente")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pedido"
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-fecha_pedido"]

    def recalcular_total(self):
        total = sum((d.subtotal for d in self.detalles.all()), Decimal("0"))
        self.total = total
        self.save(update_fields=["total"])
        return self.total

    def __str__(self):
        return f"Pedido #{self.pk} - {self.cliente} ({self.get_estado_display()})"


# ============================================================
# 12. DETALLE_PEDIDO
# ============================================================
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="detalles")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name="detalles_pedido")
    cantidad = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
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
# 13. VENTA
# ============================================================
class Venta(models.Model):
    FORMAS_PAGO = [
        ("efectivo", "Efectivo"),
        ("transferencia", "Transferencia"),
        ("qr", "QR"),
        ("tarjeta", "Tarjeta"),
        ("credito", "Crédito"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="ventas")
    pedido = models.OneToOneField(Pedido, on_delete=models.PROTECT, related_name="venta")
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


# ============================================================
# 14. AUDITORÍA
# ============================================================
class Auditoria(models.Model):
    ACCIONES = [
        ("crear", "Crear"),
        ("editar", "Editar"),
        ("eliminar", "Eliminar"),
        ("login", "Login"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.SET_NULL, null=True, blank=True, related_name="auditoria")
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name="auditoria")
    usuario_texto = models.CharField(max_length=100, blank=True)
    accion = models.CharField(max_length=20, choices=ACCIONES)
    modelo = models.CharField(max_length=60)
    objeto_id = models.CharField(max_length=40, blank=True)
    detalle = models.JSONField(default=dict, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auditoria"
        verbose_name = "Auditoría"
        verbose_name_plural = "Auditorías"
        ordering = ["-creado_en"]
        indexes = [models.Index(fields=["granja", "-creado_en"])]

    def __str__(self):
        return f"{self.creado_en:%Y-%m-%d %H:%M} - {self.usuario_texto} {self.accion} {self.modelo}"


# ============================================================
# 15. CONFIGURACIÓN DE LA TIENDA
# ============================================================
class ConfiguracionTienda(models.Model):
    granja = models.OneToOneField(Granja, on_delete=models.CASCADE, related_name="configuracion")
    hero_titulo = models.CharField(max_length=200, default="Huevos frescos para tu hogar. Maplez para tu negocio.")
    hero_subtitulo = models.TextField(default="Elige la calidad y la cantidad que necesitas.")
    hero_cta_texto = models.CharField(max_length=80, default="Hacer un pedido")
    hero_imagen_url = models.URLField(blank=True, null=True)
    telefono_contacto = models.CharField(max_length=30, blank=True, default="")
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "configuracion_tienda"
        verbose_name = "Configuración de la Tienda"
        verbose_name_plural = "Configuración de la Tienda"

    @classmethod
    def get_solo(cls, granja=None):
        if granja is None:
            granja = Granja.objects.order_by("id").first()
        if granja is None:
            raise ValueError("No hay granjas registradas.")
        config, _ = cls.objects.get_or_create(granja=granja)
        return config

    def __str__(self):
        return f"Configuración: {self.granja.nombre}"


# ============================================================
# 16. PROVEEDOR
# ============================================================
class Proveedor(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="proveedores")
    nombre = models.CharField(max_length=150)
    contacto = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True)
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "proveedor"
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        ordering = ["nombre"]
        unique_together = [("granja", "nombre")]

    def __str__(self):
        return self.nombre


# ============================================================
# 17. COMPRA Y DETALLE_COMPRA
# ============================================================
class Compra(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("recibida", "Recibida"),
        ("anulada", "Anulada"),
    ]
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="compras")
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name="compras")
    fecha = models.DateField()
    numero_factura = models.CharField(max_length=50, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="recibida")
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0, editable=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "compra"
        verbose_name = "Compra"
        verbose_name_plural = "Compras"
        ordering = ["-fecha"]

    def recalcular_total(self):
        total = sum((d.subtotal for d in self.detalles.all()), Decimal("0"))
        self.total = total
        self.save(update_fields=["total"])
        return self.total

    def __str__(self):
        return f"Compra #{self.pk} - {self.proveedor.nombre}"


class DetalleCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name="detalles")
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT, related_name="detalles_compra")
    cantidad = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, editable=False, default=0)

    class Meta:
        db_table = "detalle_compra"
        verbose_name = "Detalle de Compra"
        verbose_name_plural = "Detalles de Compra"
        unique_together = [("compra", "insumo")]

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)
        self.compra.recalcular_total()

    def delete(self, *args, **kwargs):
        compra = self.compra
        super().delete(*args, **kwargs)
        compra.recalcular_total()

    def __str__(self):
        return f"{self.insumo.nombre} x {self.cantidad}"


# ============================================================
# 18. CONSUMO DE INSUMOS (Alimento por lote)
# ============================================================
class ConsumoInsumo(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="consumos_insumos")
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name="consumos")
    insumo = models.ForeignKey(Insumo, on_delete=models.PROTECT, related_name="consumos")
    fecha = models.DateField()
    cantidad = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    observaciones = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "consumo_insumo"
        verbose_name = "Consumo de Insumo"
        verbose_name_plural = "Consumos de Insumos"
        ordering = ["-fecha"]
        unique_together = [("lote", "insumo", "fecha")]
        indexes = [models.Index(fields=["granja", "fecha"])]

    def __str__(self):
        return f"{self.lote.codigo} - {self.insumo.nombre} ({self.cantidad})"


# ============================================================
# 19. MEDICAMENTO EN ALIMENTO (Fórmula / Dosis)
# ============================================================
class MedicamentoEnAlimento(models.Model):
    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="medicamentos_alimento")
    alimento = models.ForeignKey(Insumo, on_delete=models.CASCADE, related_name="medicamentos_contiene")
    medicamento = models.ForeignKey(Insumo, on_delete=models.CASCADE, related_name="medicamentos_en")
    dosis_por_kg = models.DecimalField(max_digits=8, decimal_places=3, help_text="Gramos o ml por kg de alimento")
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    periodo_retiro_dias = models.PositiveIntegerField(default=0, help_text="Días de retiro antes de vender huevos")
    observaciones = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "medicamento_en_alimento"
        verbose_name = "Medicamento en Alimento"
        verbose_name_plural = "Medicamentos en Alimento"
        ordering = ["-fecha_inicio"]

    def __str__(self):
        return f"{self.alimento.nombre} + {self.medicamento.nombre} ({self.dosis_por_kg}/kg)"


# ============================================================
# 20. TARIFAS DE PRODUCTO (Precios por temporada)
# ============================================================
class TarifaProducto(models.Model):
    TIPOS = [
        ("base", "Precio Base"),
        ("temporada", "Temporada"),
        ("promocion", "Promoción"),
    ]

    granja = models.ForeignKey(Granja, on_delete=models.CASCADE, related_name="tarifas")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name="tarifas")
    tipo = models.CharField(max_length=20, choices=TIPOS, default="base")
    nombre_temporada = models.CharField(max_length=100, blank=True, help_text="Ej: Navidad 2026, Semana Santa")
    precio = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True, help_text="Vacío significa que no tiene fecha de fin")
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tarifa_producto"
        verbose_name = "Tarifa de Producto"
        verbose_name_plural = "Tarifas de Productos"
        ordering = ["-fecha_inicio"]
        indexes = [models.Index(fields=["producto", "fecha_inicio"])]

    def __str__(self):
        return f"{self.producto.nombre} — {self.precio} Bs. ({self.nombre_temporada or 'Base'})"

# ============================================================
# 21. MÓDULO COMERCIAL DE GALLINAZA (ABONO)
# ============================================================
from .gallinaza_models import (  # noqa: E402,F401
    ProductoGallinaza,
    EntradaGallinaza,
    VentaGallinaza,
    DetalleVentaGallinaza,
    PagoGallinaza,
    MovimientoGallinaza,
)