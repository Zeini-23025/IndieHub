from rest_framework import viewsets, permissions
from users.permissions import IsAdminUser
from .models import DownloadHistory
from .serializers import DownloadHistorySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, Http404
from games.models import Game
from games.serializers import GameSerializer
from django.db.models import Count
import os


class DownloadHistoryViewSet(viewsets.ModelViewSet):
    """
    Anyone can create a download record.
    Only admins can list or view all downloads.
    """
    queryset = DownloadHistory.objects.all()
    serializer_class = DownloadHistorySerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "destroy"]:
            # Use the project's custom IsAdminUser
            return [IsAdminUser()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        request = self.request
        serializer.save(
            ip_address=request.META.get("REMOTE_ADDR"),
            device_info=request.META.get("HTTP_USER_AGENT", "")
        )


class DownloadGameView(APIView):
    """Stream a game's file to authenticated users and log the download."""
    permission_classes = [IsAuthenticated]

    def get(self, request, game_id):
        # fetch game or 404
        try:
            game = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            raise Http404

        # allow download only for approved games or owners/admins
        user = request.user
        if not (
            game.status == 'approved'
            or getattr(user, 'role', None) == 'admin'
            or user == game.developer
        ):
            return Response(
                {'detail': 'Not allowed to download this game.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ensure file exists
        file_field = game.file_path
        file_path = getattr(file_field, 'path', None)
        if not file_path or not os.path.exists(file_path):
            raise Http404

        # Log download
        DownloadHistory.objects.create(
            game=game,
            user=(user if user.is_authenticated else None),
            ip_address=request.META.get('REMOTE_ADDR'),
            device_info=request.META.get('HTTP_USER_AGENT', ''),
        )

    # Stream file response (dev).
    # In production use X-Accel-Redirect or presigned URLs.
        response = FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename=os.path.basename(file_path),
        )
        return response


class PopularGamesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint to list games sorted by popularity (download count).
    Accessible by everyone.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = GameSerializer

    def get_queryset(self):
        return Game.objects.filter(status='approved').annotate(
            download_count=Count('downloads')
        ).order_by('-download_count')
