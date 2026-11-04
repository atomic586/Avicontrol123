"""
Autenticación JWT para GraphQL (Strawberry) en AVICONTROL.
Expone helpers para leer el token del header Authorization.
"""

from typing import Optional
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


Usuario = get_user_model()


def generar_tokens(usuario) -> dict:
    """
    Genera un par (access, refresh) para el usuario dado.
    """
    refresh = RefreshToken.for_user(usuario)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def usuario_desde_token(token: str) -> Optional[Usuario]:
    """
    Devuelve el Usuario si el access token es válido; None si no.
    """
    try:
        access = AccessToken(token)
        user_id = access.get("user_id")
        return Usuario.objects.filter(pk=user_id, is_active=True).first()
    except TokenError:
        return None


def usuario_desde_request(request) -> Optional[Usuario]:
    """
    Extrae el usuario a partir del header Authorization: Bearer <token>.
    """
    if request is None:
        return None
    header = request.META.get("HTTP_AUTHORIZATION", "")
    if not header.startswith("Bearer "):
        return None
    token = header.replace("Bearer ", "", 1).strip()
    return usuario_desde_token(token)