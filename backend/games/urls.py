from .views import (
    CategoryViewSet, CategoryListView,
    GameViewSet, GameListView, ScreenshotViewSet
    )
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'categories-list', CategoryListView, basename='category-list')
router.register(r'games', GameViewSet, basename='game')
router.register(r'games-list', GameListView, basename='game-list')
router.register(r'screenshots', ScreenshotViewSet, basename='screenshot')
urlpatterns = router.urls
