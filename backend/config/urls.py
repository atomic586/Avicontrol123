"""
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