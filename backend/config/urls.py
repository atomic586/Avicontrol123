"""
Rutas del proyecto AVICONTROL.
Expone el panel /admin, el endpoint GraphQL en /graphql/
y el endpoint de subida de imágenes en /api/upload/.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from strawberry.django.views import GraphQLView
from avicontrol.graphql.schema import schema
from avicontrol.upload_views import subir_imagen


urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "graphql/",
        csrf_exempt(
            GraphQLView.as_view(schema=schema, multipart_uploads_enabled=True)
        ),
    ),
    path("api/upload/", subir_imagen, name="subir_imagen"),
]

# --- Servir archivos media en desarrollo ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)