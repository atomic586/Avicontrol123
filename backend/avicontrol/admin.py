"""
<<<<<<< HEAD
Configuración del panel de administración de AVICONTROL.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Usuario, Cliente, Granja, Galpon, Lote,
    Produccion, Producto, Insumo,
    Pedido, DetallePedido, Venta,
)

# ============================================
# 1. USUARIO
# ============================================
@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'rol', 'nombres', 'apellidos', 'activo', 'is_staff')
    list_filter = ('rol', 'activo', 'is_staff')
    search_fields = ('username', 'email', 'nombres', 'apellidos', 'telefono')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Datos personales', {'fields': ('nombres', 'apellidos', 'email', 'telefono')}),
        ('Rol y permisos', {'fields': ('rol', 'activo', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login', 'creado_en')}),
    )
    readonly_fields = ('creado_en', 'last_login')
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'nombres', 'apellidos', 'telefono',
                       'rol', 'password1', 'password2', 'activo', 'is_staff'),
        }),
    )

# ============================================
# 2. CLIENTE
# ============================================
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombres', 'apellidos', 'dni', 'telefono', 'email')
    search_fields = ('nombres', 'apellidos', 'dni', 'telefono')
    ordering = ('apellidos', 'nombres')

# ============================================
# 3. GRANJA
# ============================================
@admin.register(Granja)
class GranjaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ubicacion', 'telefono', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre', 'ubicacion')

# ============================================
# 4. GALPON
# ============================================
@admin.register(Galpon)
class GalponAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'granja', 'capacidad_aves', 'activo')
    list_filter = ('activo', 'granja')
    search_fields = ('codigo', 'granja__nombre')

# ============================================
# 5. LOTE
# ============================================
@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'raza', 'galpon', 'fecha_ingreso', 'cantidad_aves', 'estado')
    list_filter = ('estado', 'raza', 'galpon__granja')
    search_fields = ('codigo', 'raza')
    date_hierarchy = 'fecha_ingreso'

# ============================================
# 6. PRODUCCION
# ============================================
@admin.register(Produccion)
class ProduccionAdmin(admin.ModelAdmin):
    list_display = ('lote', 'fecha', 'huevos_primera', 'huevos_segunda',
                    'huevos_tercera', 'huevos_descartados', 'total')
    list_filter = ('fecha', 'lote')
    search_fields = ('lote__codigo',)
    date_hierarchy = 'fecha'
    readonly_fields = ('total',)

# ============================================
# 7. PRODUCTO
# ============================================
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'presentacion', 'categoria', 'precio_unitario',
                    'stock', 'stock_minimo', 'activo')
    list_filter = ('presentacion', 'categoria', 'activo')
    search_fields = ('nombre',)
    list_editable = ('stock', 'precio_unitario', 'activo')

# ============================================
# 8. INSUMO
# ============================================
@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'presentacion', 'stock',
                    'stock_minimo', 'precio_unitario', 'fecha_vencimiento')
    list_filter = ('tipo',)
    search_fields = ('nombre',)
    date_hierarchy = 'fecha_vencimiento'
    list_editable = ('stock', 'precio_unitario')

# ============================================
# 9. PEDIDO
=======
Registro de modelos AVICONTROL en el panel de administración.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Usuario, Cliente, Granja, Galpon, Lote,
    Produccion, Producto, Insumo, Pedido, DetallePedido, Venta,
)


# ============================================
# Personalización del panel admin
# ============================================
admin.site.site_header = "AVICONTROL - Administración"
admin.site.site_title = "AVICONTROL Admin"
admin.site.index_title = "Panel de Gestión Avícola"


# ============================================
# USUARIO
# ============================================
@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ("username", "email", "rol", "nombres", "apellidos", "activo", "is_staff")
    list_filter = ("rol", "activo", "is_staff", "is_superuser")
    search_fields = ("username", "email", "nombres", "apellidos", "telefono")
    fieldsets = UserAdmin.fieldsets + (
        ("Datos AVICONTROL", {"fields": ("rol", "nombres", "apellidos", "telefono", "activo")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Datos AVICONTROL", {"fields": ("rol", "nombres", "apellidos", "telefono", "activo")}),
    )


# ============================================
# CLIENTE
# ============================================
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("dni", "apellidos", "nombres", "telefono", "email", "creado_en")
    search_fields = ("dni", "nombres", "apellidos", "telefono", "email")
    ordering = ("apellidos", "nombres")


# ============================================
# GRANJA
# ============================================
@admin.register(Granja)
class GranjaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "ubicacion", "telefono", "activo", "creado_en")
    list_filter = ("activo",)
    search_fields = ("nombre", "ubicacion")


# ============================================
# GALPÓN
# ============================================
@admin.register(Galpon)
class GalponAdmin(admin.ModelAdmin):
    list_display = ("codigo", "granja", "capacidad_aves", "activo")
    list_filter = ("granja", "activo")
    search_fields = ("codigo", "granja__nombre")


# ============================================
# LOTE
# ============================================
@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ("codigo", "galpon", "raza", "fecha_ingreso", "cantidad_aves", "estado")
    list_filter = ("raza", "estado", "galpon__granja")
    search_fields = ("codigo", "raza")


# ============================================
# PRODUCCIÓN
# ============================================
@admin.register(Produccion)
class ProduccionAdmin(admin.ModelAdmin):
    list_display = (
        "lote", "fecha", "huevos_primera", "huevos_segunda",
        "huevos_tercera", "huevos_descartados", "total",
    )
    list_filter = ("fecha", "lote__galpon__granja")
    search_fields = ("lote__codigo",)
    readonly_fields = ("total",)


# ============================================
# PRODUCTO
# ============================================
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        "nombre", "presentacion", "calidad", "precio_unitario",
        "stock", "stock_minimo", "activo",
    )
    list_filter = ("presentacion", "calidad", "activo")
    search_fields = ("nombre",)


# ============================================
# INSUMO
# ============================================
@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = (
        "nombre", "tipo", "presentacion", "stock", "stock_minimo",
        "precio_unitario", "fecha_vencimiento",
    )
    list_filter = ("tipo",)
    search_fields = ("nombre",)


# ============================================
# PEDIDO
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
# ============================================
class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 1
<<<<<<< HEAD
    readonly_fields = ('subtotal',)

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'fecha_pedido', 'estado', 'total')
    list_filter = ('estado', 'fecha_pedido')
    search_fields = ('cliente__nombres', 'cliente__apellidos', 'cliente__dni')
    date_hierarchy = 'fecha_pedido'
    readonly_fields = ('total',)
    inlines = [DetallePedidoInline]

# ============================================
# 10. DETALLE_PEDIDO
# ============================================
@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'pedido', 'producto', 'cantidad', 'precio_unitario', 'subtotal')
    list_filter = ('producto',)
    search_fields = ('pedido__id', 'producto__nombre')
    readonly_fields = ('subtotal',)

# ============================================
# 11. VENTA
# ============================================
@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ('id', 'pedido', 'fecha', 'monto_total', 'forma_pago')
    list_filter = ('forma_pago', 'fecha')
    search_fields = ('pedido__cliente__nombres', 'pedido__cliente__apellidos')
    date_hierarchy = 'fecha'
=======
    readonly_fields = ("subtotal",)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("id", "cliente", "fecha_pedido", "estado", "total")
    list_filter = ("estado", "fecha_pedido")
    search_fields = ("cliente__nombres", "cliente__apellidos", "cliente__dni")
    readonly_fields = ("total",)
    inlines = [DetallePedidoInline]


# ============================================
# DETALLE_PEDIDO (accesible desde Pedido, pero lo registramos también)
# ============================================
@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = ("pedido", "producto", "cantidad", "precio_unitario", "subtotal")
    search_fields = ("pedido__id", "producto__nombre")
    readonly_fields = ("subtotal",)


# ============================================
# VENTA
# ============================================
@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ("id", "pedido", "fecha", "monto_total", "forma_pago")
    list_filter = ("forma_pago", "fecha")
    search_fields = ("pedido__id", "pedido__cliente__nombres")
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
