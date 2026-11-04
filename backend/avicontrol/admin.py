"""
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
# ============================================
class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 1
    readonly_fields = ("subtotal",)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("id", "cliente", "fecha_pedido", "estado", "total")
    list_filter = ("estado", "fecha_pedido")
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
    list_display = ("id", "pedido", "fecha", "monto_total", "forma_pago")
    list_filter = ("forma_pago", "fecha")
    search_fields = ("pedido__id", "pedido__cliente__nombres")