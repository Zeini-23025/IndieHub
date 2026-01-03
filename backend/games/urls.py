from .views import (
    CategoryViewSet, CategoryListView,
    GameViewSet, GameListView, ScreenshotViewSet, ScreenshotListView,
    ReviewViewSet, ReviewListView
    )
from rest_framework.routers import DefaultRouter
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'categories-list', CategoryListView, basename='category-list')
router.register(r'games', GameViewSet, basename='game')
router.register(r'games-list', GameListView, basename='game-list')
router.register(r'screenshots', ScreenshotViewSet, basename='screenshot')
router.register(r'screenshots-list', ScreenshotListView, basename='screenshot-list')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'reviews-list', ReviewListView, basename='review-list')
urlpatterns = router.urls
