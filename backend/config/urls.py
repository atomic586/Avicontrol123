"""
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