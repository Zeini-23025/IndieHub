from django.contrib import admin
from django.urls import path
from api.views import welcome

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/welcome/', welcome),
]
