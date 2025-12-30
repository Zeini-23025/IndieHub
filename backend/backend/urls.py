from django.contrib import admin
from django.urls import path, include
from api.views import welcome

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/welcome/', welcome),
    path('api/users/', include('users.urls')),
    path('api/games/', include('games.urls')),
    path('api/library/', include('library.urls')),
    path('api/downloads/', include('downloads.urls')),
]
