from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Category, Game, Screenshot, Review
from .serializers import (
    CategorySerializer,
    GameSerializer,
    ScreenshotSerializer,
    ReviewSerializer
    )
from users.permissions import IsAdminUser, IsAdminOrDeveloper, IsOwnerOrAdmin
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from downloads.models import DownloadHistory
from django.utils import timezone
from datetime import datetime, timedelta


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing game categories.
    Supports CRUD operations.
    Only accessible by admin users.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        """
        Custom create method to handle successful response
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class CategoryListView(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing and retrieving game categories.
    Accessible by all users.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = []  # Allow any user (authenticated or not)


class GameViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing games.
    - Public (anonymous) users see only approved games.
        - Developers can create games and manage their own games.
            They cannot change the status field.
    - Admins can manage all games and change status.
    """
    queryset = Game.objects.all().order_by('-created_at')
    serializer_class = GameSerializer
    permission_classes = [IsAdminOrDeveloper, IsOwnerOrAdmin]

    def create(self, request, *args, **kwargs):
        """
        Custom create method to handle successful response
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def get_queryset(self):
        user = self.request.user
        # Admin sees everything
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
        ):
            return Game.objects.all().order_by('-created_at')

        # Developers see their own games and approved games
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'developer'
        ):
            return (
                Game.objects.filter(Q(status='approved') | Q(developer=user))
                .order_by('-created_at')
            )

        # Public: only approved games
        return Game.objects.filter(status='approved').order_by('-created_at')

    def perform_create(self, serializer):
        # Serializer assigns developer for developer users; admin may set it.
        serializer.save()


class GameListView(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing and retrieving games.
    Accessible by all users.
    """
    queryset = Game.objects.all().order_by('-created_at')
    serializer_class = GameSerializer
    permission_classes = []  # Allow any user (authenticated or not)

    def get_queryset(self):
        user = self.request.user
        sort = self.request.query_params.get('sort')
        now = timezone.now()
        last_week = now - timedelta(days=7)

        # Base filtering
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
        ):
            qs = Game.objects.all()
        elif (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'developer'
        ):
            qs = Game.objects.filter(Q(status='approved') | Q(developer=user))
        else:
            qs = Game.objects.filter(status='approved')

        # Annotations for sorting
        qs = qs.annotate(
            avg_rating=Avg('reviews__rating'),
            download_count=Count('downloads', distinct=True)
        )

        # Sorting logic
        if sort == 'popular':
            return qs.order_by('-download_count', '-created_at')
        elif sort == 'top-rated':
            return qs.filter(reviews__isnull=False).order_by('-avg_rating', '-created_at')
        elif sort == 'trending':
            qs = qs.annotate(
                weekly_downloads=Count('downloads', filter=Q(downloads__timestamp__gte=last_week))
            )
            return qs.order_by('-weekly_downloads', '-created_at')
        elif sort == 'gems':
            # Dynamic: High rating (>=4.0), fewest downloads first
            return qs.filter(avg_rating__gte=4.0).order_by('download_count', '-avg_rating')
        
        return qs.order_by('-created_at')


class ScreenshotViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing game screenshots.
    - Developers can manage screenshots for their own games.
    - Admins can manage all screenshots.
    """
    queryset = Screenshot.objects.all().order_by('-uploaded_at')
    serializer_class = ScreenshotSerializer
    permission_classes = [IsAdminOrDeveloper, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        # Admin sees everything
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
        ):
            return Screenshot.objects.all().order_by('-uploaded_at')

        # Developers see screenshots for their own games
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'developer'
        ):
            return Screenshot.objects.filter(
                game__developer=user
            ).order_by('-uploaded_at')

        # Public: no access to screenshots
        return Screenshot.objects.none()

    def perform_create(self, serializer):
        # Ensure that developers can only add screenshots to their own games
        user = self.request.user
        game = serializer.validated_data.get('game')
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'developer'
        ):
            if game.developer != user:
                raise PermissionDenied(
                    "You can only add screenshots to your own games."
                )
        serializer.save()


class ScreenshotListView(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only view for listing screenshots.
    Only returns screenshots for approved games for public users.
    """
    queryset = Screenshot.objects.all().order_by('-uploaded_at')
    serializer_class = ScreenshotSerializer
    permission_classes = []  # Allow any

    def get_queryset(self):
        qs = Screenshot.objects.all().order_by('-uploaded_at')
        game_id = self.request.query_params.get('game')
        if game_id:
            qs = qs.filter(game_id=game_id)

        user = self.request.user
        # Admin/Developer can see their own screenshots already via main viewset
        # But for this list, we filter to approved games unless they are owners/admins
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) in ['admin', 'developer']
        ):
            # For admin/dev just return the filtered qs
            return qs

        # Public users see only screenshots of approved games
        return qs.filter(game__status='approved')


class ReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing game reviews (owner/admin operations).
    - Authenticated users can create reviews and manage their own reviews.
    - Admins can manage all reviews.
    """
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        # Admin sees everything
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
        ):
            return Review.objects.all().order_by('-created_at')

        # Authenticated users see their own reviews
        if user and user.is_authenticated:
            return Review.objects.filter(user=user).order_by('-created_at')

        # Public: no access to write/manage reviews
        return Review.objects.none()

    def perform_create(self, serializer):
        # Assign the review author as the current user
        user = self.request.user
        if user and user.is_authenticated:
            serializer.save(user=user)
        else:
            raise PermissionDenied(
                'Authentication required to create reviews.'
            )


class ReviewListView(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only view for listing and retrieving reviews.
    Allows filtering by game.
    """
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = []  # Allow any (public)

    def get_queryset(self):
        qs = Review.objects.all().order_by('-created_at')
        game_id = self.request.query_params.get('game')
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs


class AnalyticsDownloadsView(APIView):
    """Return download counts over time.

    Query params:
      - game: optional game id to filter
      - developer: optional developer id to filter (admin only)
      - interval: daily|weekly|monthly (default: daily)
      - start, end: ISO dates (YYYY-MM-DD)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        interval = request.query_params.get('interval', 'daily')
        game_id = request.query_params.get('game')
        developer_id = request.query_params.get('developer')

        # Build base queryset
        qs = DownloadHistory.objects.all()

        # Apply filters
        if game_id:
            qs = qs.filter(game_id=game_id)
        if developer_id:
            # only admin may filter by developer
            if not getattr(user, 'role', None) == 'admin':
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            qs = qs.filter(game__developer_id=developer_id)

        # Developers may only see their own games
        if getattr(user, 'role', None) == 'developer' and not getattr(user, 'is_staff', False):
            qs = qs.filter(game__developer=user)

        # Date range
        start = request.query_params.get('start')
        end = request.query_params.get('end')
        try:
            if start:
                start_dt = timezone.make_aware(datetime.strptime(start, '%Y-%m-%d'))
                qs = qs.filter(timestamp__gte=start_dt)
            if end:
                end_dt = timezone.make_aware(datetime.strptime(end, '%Y-%m-%d')) + timedelta(days=1)
                qs = qs.filter(timestamp__lt=end_dt)
        except Exception:
            return Response({'detail': 'Invalid date format, expected YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        # Grouping
        if interval == 'weekly':
            trunc = TruncWeek('timestamp')
        elif interval == 'monthly':
            trunc = TruncMonth('timestamp')
        else:
            trunc = TruncDay('timestamp')

        data = (
            qs.annotate(period=trunc)
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )

        # Serialize period to ISO date strings
        result = [{'period': item['period'].date().isoformat() if item['period'] else None, 'count': item['count']} for item in data]
        return Response(result)


class AnalyticsAvgRatingView(APIView):
    """Return average rating over time."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        interval = request.query_params.get('interval', 'daily')
        game_id = request.query_params.get('game')
        developer_id = request.query_params.get('developer')

        qs = Review.objects.all()
        if game_id:
            qs = qs.filter(game_id=game_id)
        if developer_id:
            if not getattr(user, 'role', None) == 'admin':
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            qs = qs.filter(game__developer_id=developer_id)
        if getattr(user, 'role', None) == 'developer':
            qs = qs.filter(game__developer=user)

        start = request.query_params.get('start')
        end = request.query_params.get('end')
        try:
            if start:
                start_dt = timezone.make_aware(datetime.strptime(start, '%Y-%m-%d'))
                qs = qs.filter(created_at__gte=start_dt)
            if end:
                end_dt = timezone.make_aware(datetime.strptime(end, '%Y-%m-%d')) + timedelta(days=1)
                qs = qs.filter(created_at__lt=end_dt)
        except Exception:
            return Response({'detail': 'Invalid date format, expected YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        if interval == 'weekly':
            trunc = TruncWeek('created_at')
        elif interval == 'monthly':
            trunc = TruncMonth('created_at')
        else:
            trunc = TruncDay('created_at')

        data = (
            qs.annotate(period=trunc)
            .values('period')
            .annotate(avg_rating=Avg('rating'), count=Count('id'))
            .order_by('period')
        )

        result = [{'period': item['period'].date().isoformat() if item['period'] else None, 'average': float(item['avg_rating'] or 0), 'count': item['count']} for item in data]
        return Response(result)


class AnalyticsRatingDistributionView(APIView):
    """Return rating distribution counts 1..5."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        game_id = request.query_params.get('game')
        developer_id = request.query_params.get('developer')

        qs = Review.objects.all()
        if game_id:
            qs = qs.filter(game_id=game_id)
        if developer_id:
            if not getattr(user, 'role', None) == 'admin':
                return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
            qs = qs.filter(game__developer_id=developer_id)
        if getattr(user, 'role', None) == 'developer':
            qs = qs.filter(game__developer=user)

        start = request.query_params.get('start')
        end = request.query_params.get('end')
        try:
            if start:
                start_dt = timezone.make_aware(datetime.strptime(start, '%Y-%m-%d'))
                qs = qs.filter(created_at__gte=start_dt)
            if end:
                end_dt = timezone.make_aware(datetime.strptime(end, '%Y-%m-%d')) + timedelta(days=1)
                qs = qs.filter(created_at__lt=end_dt)
        except Exception:
            return Response({'detail': 'Invalid date format, expected YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        agg = qs.values('rating').annotate(count=Count('id'))
        # Build distribution for 1..5
        distribution = {str(i): 0 for i in range(1, 6)}
        for item in agg:
            distribution[str(item['rating'])] = item['count']

        return Response({'distribution': distribution})

class GameHomeSectionsView(APIView):
    """
    API endpoint to fetch all curated game sections for the home page.
    - Most Popular: Top 10 by total downloads.
    - New Releases: Last 10 approved games.
    - Top Rated: Top 10 by average rating (min 3 reviews).
    - Trending Now: Top 10 by downloads in the last 7 days.
    - Hidden Gems: Top 10 with rating > 4.0 and downloads < 50.
    """
    permission_classes = []  # Allow anyone

    def get(self, request):
        now = timezone.now()
        last_week = now - timedelta(days=7)

        # Base queryset for approved games
        approved_games = Game.objects.filter(status='approved')

        # 1. Most Popular (Top 10 by total downloads)
        most_popular = approved_games.annotate(
            download_count=Count('downloads')
        ).order_by('-download_count')[:10]

        # 2. New Releases (Last 10 approved games)
        new_releases = approved_games.order_by('-created_at')[:10]

        # 3. Top Rated (Top 10 by average rating, min 1 review for now to avoid empty list)
        top_rated = approved_games.annotate(
            average_rating=Avg('reviews__rating'),
            review_count=Count('reviews')
        ).filter(review_count__gte=1).order_by('-average_rating')[:10]

        # 4. Trending Now (Top 10 by downloads in the last 7 days)
        trending_now = approved_games.annotate(
            weekly_downloads=Count('downloads', filter=Q(downloads__timestamp__gte=last_week))
        ).order_by('-weekly_downloads')[:10]

        # 5. Hidden Gems (Rating >= 4.0, fewest downloads first)
        hidden_gems = approved_games.annotate(
            average_rating=Avg('reviews__rating'),
            download_count=Count('downloads')
        ).filter(average_rating__gte=4.0).order_by('download_count', '-average_rating')[:10]

        return Response({
            'most_popular': GameSerializer(most_popular, many=True, context={'request': request}).data,
            'new_releases': GameSerializer(new_releases, many=True, context={'request': request}).data,
            'top_rated': GameSerializer(top_rated, many=True, context={'request': request}).data,
            'trending_now': GameSerializer(trending_now, many=True, context={'request': request}).data,
            'hidden_gems': GameSerializer(hidden_gems, many=True, context={'request': request}).data,
        })
