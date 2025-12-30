from django.contrib import admin
from django.urls import path, include
from api.views import welcome
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/welcome/', welcome),
    path('api/users/', include('users.urls')),
    path('api/games/', include('games.urls')),
    path('api/library/', include('library.urls')),
    path('api/downloads/', include('downloads.urls')),
]

schema_view = get_schema_view(
    openapi.Info(
        title="IndieHub API",
        default_version="v1",
        description="API documentation for IndieHub",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns += [
    path(
        "swagger.json",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "redoc/",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
]
