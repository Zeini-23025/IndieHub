from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import DownloadHistoryViewSet, DownloadGameView, PopularGamesViewSet

router = DefaultRouter()
router.register(r"downloads", DownloadHistoryViewSet, basename="downloads")
router.register(r"popular-games", PopularGamesViewSet, basename="popular-games")

urlpatterns = [
	path(
		'games/<int:game_id>/download/',
		DownloadGameView.as_view(),
		name='game-download',
	),
]

# append router URLs (list/retrieve/create for DownloadHistory)
urlpatterns += router.urls
