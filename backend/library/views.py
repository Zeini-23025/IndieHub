from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import IntegrityError
from .models import LibraryEntry
from .serializers import LibraryEntrySerializer
from users.permissions import IsOwnerOrAdmin


class LibraryEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for user's library entries.
    - list: authenticated user's entries (admin sees all)
    - create: add an approved game to the authenticated user's
      library (requires login)
    - retrieve/destroy: owner or admin only
    """
    queryset = LibraryEntry.objects.all()
    serializer_class = LibraryEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # list/create require auth; retrieve/destroy require owner/admin
        if self.action in ['list', 'create']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if (
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'admin'
        ):
            return LibraryEntry.objects.all()
        if user and user.is_authenticated:
            return LibraryEntry.objects.filter(user=user)
        return LibraryEntry.objects.none()

    def create(self, request, *args, **kwargs):
        # serializer's HiddenField will set `user` from request
        context = {'request': request}
        serializer = self.get_serializer(data=request.data, context=context)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {'detail': 'This game is already in your library.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_create(self, serializer):
        serializer.save()
