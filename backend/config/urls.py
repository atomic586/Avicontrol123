"""
<<<<<<< HEAD
URLs de AVICONTROL.
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import GraphQLView
from avicontrol.graphql_api.schema import schema

urlpatterns = [
    path('admin/', admin.site.urls),
    # Envolvemos la vista de GraphQL con csrf_exempt para que el frontend pueda conectarse sin cookies CSRF
    path('graphql/', csrf_exempt(GraphQLView.as_view(schema=schema)), name='graphql'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
=======
Rutas del proyecto AVICONTROL.
Expone el panel /admin y el endpoint GraphQL en /graphql/.
"""

from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import GraphQLView
from avicontrol.graphql.schema import schema


urlpatterns = [
    path("admin/", admin.site.urls),
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=schema))),
]
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
