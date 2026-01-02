from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Category, Game, Screenshot, Review
from .serializers import (
    CategorySerializer, GameSerializer, ScreenshotSerializer, ReviewSerializer
    )
from users.permissions import IsAdminUser, IsAdminOrDeveloper, IsOwnerOrAdmin


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
        # Same filtering rules as the main GameViewSet
        user = self.request.user
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
        ):
            return Game.objects.all().order_by('-created_at')
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'developer'
        ):
            return (
                Game.objects.filter(Q(status='approved') | Q(developer=user))
                .order_by('-created_at')
            )
        return Game.objects.filter(status='approved').order_by('-created_at')


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
