"""
Helpers para verificar si un módulo está activo en la granja del usuario.
Uso típico en queries/mutations:

    from avicontrol.modulos_helpers import requerir_modulo
    requerir_modulo(info, "sanidad")
"""

from typing import Optional
from strawberry.types import Info
from avicontrol.graphql.auth_jwt import usuario_desde_request


def _config_de_granja(granja) -> Optional[object]:
    """Devuelve la ConfiguracionGranja de una granja, o None."""
    if not granja:
        return None
    return getattr(granja, "configuracion_modulos", None)


def tiene_modulo(info: Info, codigo: str) -> bool:
    """True si la granja del usuario autenticado tiene el módulo activo.

    Reglas:
    - Superadmin: siempre True (acceso total al sistema).
    - Usuario sin granja asignada: siempre False.
    - Usuario normal: consulta la ConfiguracionGranja de su granja.
    """
    request = getattr(info.context, "request", None)
    usuario = usuario_desde_request(request) if request else None

    if not usuario:
        return False

    # Superadmin: acceso total a todos los módulos
    if usuario.es_superadmin:
        return True

    if not usuario.granja_id:
        return False

    config = _config_de_granja(usuario.granja)
    return bool(config and config.tiene_modulo(codigo))


def requerir_modulo(info: Info, codigo: str) -> None:
    """Lanza ValueError si el módulo no está activo para la granja del usuario."""
    if not tiene_modulo(info, codigo):
        raise ValueError(
            f"El módulo '{codigo}' no está activo para esta granja. "
            f"Actívalo en Configuración → Módulos."
        )