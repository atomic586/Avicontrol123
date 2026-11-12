"""
Panel de administración de AVICONTROL.
Registra los 15 modelos con personalización por granja.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Granja, Rol, Usuario, Cliente, Galpon, Lote, Produccion,
    Producto, Insumo, GeneracionAbono, Almacen, MovimientoStock,
    Pedido, DetallePedido, Venta, Auditoria, ConfiguracionTienda,
)


# ============================================
# Personalización del panel admin
# ============================================
admin.site.site_header = "AVICONTROL - Administración"
admin.site.site_title = "AVICONTROL Admin"
admin.site.index_title = "Panel de Gestión Avícola"


# ============================================
# GRANJA
# ============================================
@admin.register(Granja)
class GranjaAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "ubicacion", "telefono", "activo", "creado_en")
    list_filter = ("activo",)
    search_fields = ("codigo", "nombre", "ubicacion")
    ordering = ("nombre",)


# ============================================
# ROL
# ============================================
@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "activo")
    list_filter = ("activo",)
    search_fields = ("codigo", "nombre")


# ============================================
# USUARIO
# ============================================
@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ("username", "email", "granja", "get_roles", "activo", "is_staff")
    list_filter = ("granja", "roles", "activo", "is_staff", "is_superuser")
    search_fields = ("username", "email", "nombres", "apellidos", "telefono")
    filter_horizontal = ("roles", "groups", "user_permissions")
    fieldsets = UserAdmin.fieldsets + (
        ("Datos AVICONTROL", {
            "fields": ("granja", "roles", "nombres", "apellidos", "telefono", "activo")
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Datos AVICONTROL", {
            "fields": ("granja", "roles", "nombres", "apellidos", "telefono", "activo")
        }),
    )

    def get_roles(self, obj):
        return ", ".join(r.nombre for r in obj.roles.all()) or "—"
    get_roles.short_description = "Roles"


# ============================================
# CLIENTE
# ============================================
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("dni", "apellidos", "nombres", "granja", "telefono", "email", "puede_loguearse", "activo")
    list_filter = ("granja", "activo", "puede_loguearse")
    search_fields = ("dni", "nombres", "apellidos", "telefono", "email")
    ordering = ("apellidos", "nombres")


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
    list_display = ("codigo", "granja", "galpon", "raza", "fecha_ingreso", "cantidad_aves", "estado")
    list_filter = ("granja", "raza", "estado", "galpon")
    search_fields = ("codigo", "raza")


# ============================================
# PRODUCCIÓN
# ============================================
@admin.register(Produccion)
class ProduccionAdmin(admin.ModelAdmin):
    list_display = ("lote", "granja", "fecha", "huevos_primera", "huevos_segunda", "huevos_tercera", "huevos_descartados", "total")
    list_filter = ("granja", "fecha", "lote")
    search_fields = ("lote__codigo",)
    readonly_fields = ("total",)


# ============================================
# PRODUCTO (huevo / abono / otro)
# ============================================
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "presentacion", "calidad", "unidad_medida", "precio_unitario", "stock", "stock_minimo", "activo")
    list_filter = ("granja", "tipo", "presentacion", "calidad", "activo")
    search_fields = ("nombre",)


# ============================================
# INSUMO
# ============================================
@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tipo", "granja", "presentacion", "stock", "stock_minimo", "precio_unitario", "fecha_vencimiento")
    list_filter = ("granja", "tipo")
    search_fields = ("nombre",)


# ============================================
# GENERACIÓN DE ABONO
# ============================================
@admin.register(GeneracionAbono)
class GeneracionAbonoAdmin(admin.ModelAdmin):
    list_display = ("galpon", "granja", "fecha", "cantidad_kg", "estado", "responsable")
    list_filter = ("granja", "estado", "fecha")
    search_fields = ("galpon__codigo", "responsable")


# ============================================
# ALMACÉN
# ============================================
@admin.register(Almacen)
class AlmacenAdmin(admin.ModelAdmin):
    list_display = ("nombre", "granja", "ubicacion", "activo")
    list_filter = ("granja", "activo")
    search_fields = ("nombre",)


# ============================================
# MOVIMIENTO DE STOCK
# ============================================
@admin.register(MovimientoStock)
class MovimientoStockAdmin(admin.ModelAdmin):
    list_display = ("tipo", "motivo", "granja", "almacen", "producto", "insumo", "cantidad", "referencia", "creado_en")
    list_filter = ("granja", "tipo", "motivo", "almacen")
    search_fields = ("referencia", "producto__nombre", "insumo__nombre")
    date_hierarchy = "creado_en"


# ============================================
# PEDIDO
# ============================================
class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 1
    readonly_fields = ("subtotal",)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("id", "granja", "cliente", "fecha_pedido", "estado", "total")
    list_filter = ("granja", "estado", "fecha_pedido")
    search_fields = ("cliente__nombres", "cliente__apellidos", "cliente__dni")
    readonly_fields = ("total",)
    inlines = [DetallePedidoInline]


# ============================================
# DETALLE_PEDIDO
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
    list_display = ("id", "granja", "pedido", "fecha", "monto_total", "forma_pago")
    list_filter = ("granja", "forma_pago", "fecha")
    search_fields = ("pedido__id", "pedido__cliente__nombres")
    date_hierarchy = "fecha"


# ============================================
# AUDITORÍA
# ============================================
@admin.register(Auditoria)
class AuditoriaAdmin(admin.ModelAdmin):
    list_display = ("creado_en", "granja", "usuario_texto", "accion", "modelo", "objeto_id")
    list_filter = ("granja", "accion", "modelo")
    search_fields = ("usuario_texto", "modelo", "objeto_id")
    readonly_fields = ("granja", "usuario", "usuario_texto", "accion", "modelo", "objeto_id", "detalle", "creado_en")
    date_hierarchy = "creado_en"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ============================================
# CONFIGURACIÓN DE LA TIENDA (por granja)
# ============================================
@admin.register(ConfiguracionTienda)
class ConfiguracionTiendaAdmin(admin.ModelAdmin):
    list_display = ("granja", "hero_titulo", "telefono_contacto", "actualizado_en")
    search_fields = ("granja__nombre", "hero_titulo")