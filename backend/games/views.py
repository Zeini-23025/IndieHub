from rest_framework import status, viewsets
from rest_framework.response import Response
from .models import Category
from .serializers import CategorySerializer
from users.permissions import IsAdminUser


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
