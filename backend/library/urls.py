from .views import LibraryEntryViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'entries', LibraryEntryViewSet, basename='libraryentry')

urlpatterns = router.urls
