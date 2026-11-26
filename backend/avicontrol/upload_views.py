import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import uuid


@csrf_exempt
@require_POST
def subir_imagen(request):
    """
    Endpoint para subir una imagen.
    Recibe: multipart/form-data con campos 'archivo' y 'tipo' (logo o hero).
    Devuelve: { "ok": true, "url": "/media/granjas/logos/abc123.jpg" }
    """
    try:
        archivo = request.FILES.get("archivo")
        tipo = request.POST.get("tipo", "logo")

        if not archivo:
            return JsonResponse({"ok": False, "error": "No se recibió ningún archivo."}, status=400)

        if archivo.size > 5 * 1024 * 1024:
            return JsonResponse({"ok": False, "error": "El archivo supera los 5MB."}, status=400)

        extensiones_validas = [".jpg", ".jpeg", ".png", ".webp"]
        ext = os.path.splitext(archivo.name)[1].lower()
        if ext not in extensiones_validas:
            return JsonResponse({"ok": False, "error": f"Formato {ext} no permitido."}, status=400)

        nombre_unico = f"{uuid.uuid4().hex}{ext}"
        carpeta = "granjas/logos" if tipo == "logo" else "granjas/hero"
        ruta_relativa = f"{carpeta}/{nombre_unico}"

        ruta_guardada = default_storage.save(ruta_relativa, ContentFile(archivo.read()))
        url = f"/media/{ruta_guardada}"

        return JsonResponse({"ok": True, "url": url})
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)