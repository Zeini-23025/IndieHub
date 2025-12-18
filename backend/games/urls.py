from .views import CategoryViewSet, CategoryListView, GameViewSet, GameListView
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'categories-list', CategoryListView, basename='category-list')
router.register(r'games', GameViewSet, basename='game')
router.register(r'games-list', GameListView, basename='game-list')
urlpatterns = router.urls
