"""
Catálogo central de módulos activables de AVICONTROL.
El backend es la fuente de verdad; el frontend tiene un espejo en config/modulos.js.
"""

MODULOS_DISPONIBLES = {
    "sanidad": {
        "nombre": "Sanidad + Bioseguridad",
        "descripcion": "Vacunas, tratamientos, limpieza, control de roedores.",
        "obligatorio": True,   # forzado por superadmin (SENASAG)
        "default": True,
    },
    "aves": {
        "nombre": "Aves + Trazabilidad",
        "descripcion": "Peso, incubación, venta de aves, costo por lote.",
        "obligatorio": False,
        "default": True,
    },
    "abono": {
        "nombre": "Abono (Gallinaza)",
        "descripcion": "Gestión de gallinaza.",
        "obligatorio": False,
        "default": True,
    },
    "reportes_avanzados": {
        "nombre": "Reportes Avanzados",
        "descripcion": "Filtros, exportación PDF/Excel, KPIs.",
        "obligatorio": False,
        "default": True,
    },
    "notificaciones": {
        "nombre": "Notificaciones",
        "descripcion": "Email/WhatsApp automáticos.",
        "obligatorio": False,
        "default": True,
    },
    "precios_dinamicos": {
        "nombre": "Precios Dinámicos",
        "descripcion": "Tarifas por cliente, temporada, volumen.",
        "obligatorio": False,
        "default": False,
    },
    "portal_publico": {
        "nombre": "Portal Público",
        "descripcion": "Tienda en línea para clientes.",
        "obligatorio": False,
        "default": False,
    },
    "fabricacion_alimento": {
        "nombre": "Fabricación de Alimento",
        "descripcion": "Fórmulas y materias primas.",
        "obligatorio": False,
        "default": False,
    },
    "faenado": {
        "nombre": "Faenado",
        "descripcion": "Registro de faena y peso de canal.",
        "obligatorio": False,
        "default": False,
    },
    "pos": {
        "nombre": "Tienda Física (POS)",
        "descripcion": "Punto de venta rápido.",
        "obligatorio": False,
        "default": False,
    },
    "reparto": {
        "nombre": "Reparto a Domicilio",
        "descripcion": "Rutas y seguimiento de entregas.",
        "obligatorio": False,
        "default": False,
    },
    "pwa_offline": {
        "nombre": "PWA Offline",
        "descripcion": "App instalable que funciona sin internet.",
        "obligatorio": False,
        "default": False,
    },
}

MODULOS_SIEMPRE_ACTIVOS = {"granjas", "comercializacion", "administracion"}

MODULOS_DEFAULT = [
    codigo for codigo, meta in MODULOS_DISPONIBLES.items() if meta["default"]
]

MODULOS_OBLIGATORIOS = {
    codigo for codigo, meta in MODULOS_DISPONIBLES.items() if meta["obligatorio"]
}


def normalizar_modulos(codigos):
    """Valida, deduplica y fuerza los módulos obligatorios."""
    if codigos is None:
        return list(MODULOS_DEFAULT)
    codigos = [c for c in codigos if c in MODULOS_DISPONIBLES]
    for obligatorio in MODULOS_OBLIGATORIOS:
        if obligatorio not in codigos:
            codigos.append(obligatorio)
    # orden estable según catálogo
    return [c for c in MODULOS_DISPONIBLES if c in codigos]