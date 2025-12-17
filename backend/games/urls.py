from .views import CategoryViewSet, CategoryListView
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'categories-list', CategoryListView, basename='category-list')
urlpatterns = router.urls
