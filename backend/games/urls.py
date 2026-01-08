from .views import (
    CategoryViewSet, CategoryListView,
    GameViewSet, GameListView,
    ScreenshotViewSet, ScreenshotListView,
    ReviewViewSet, ReviewListView,
    AnalyticsDownloadsView,
    AnalyticsAvgRatingView,
    AnalyticsRatingDistributionView,
    GameHomeSectionsView
)
from rest_framework.routers import DefaultRouter
from django.urls import path
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

urlpatterns += [
    path(
        'analytics/downloads/',
        AnalyticsDownloadsView.as_view(),
        name='analytics-downloads'
        ),
    path(
        'analytics/ratings/average/',
        AnalyticsAvgRatingView.as_view(),
        name='analytics-ratings-average'
        ),
    path(
        'analytics/ratings/distribution/',
        AnalyticsRatingDistributionView.as_view(),
        name='analytics-ratings-distribution'
        ),
    path(
        'home-sections/',
        GameHomeSectionsView.as_view(),
        name='game-home-sections'
        ),
]
