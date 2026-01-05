from rest_framework import generics, permissions, status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, LoginSerializer
from .permissions import IsAdminUser, IsOwnerOrAdmin
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import authenticate


# --- Registration View ---


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Handles POST requests to create a new user.
    Uses UserSerializer.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # Allow anyone to register
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'registration'

    def create(self, request, *args, **kwargs):
        """
        Custom create method to handle successful response
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # The .create() method in UserSerializer handles password hashing
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)

        # Optionally, remove the sensitive 'password' field from the response
        response_data = serializer.data.copy()
        if 'password' in response_data:
            del response_data['password']

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

# --- User Management Views (Admin-Only and Detail) ---


class UserListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating users (Management).
    - GET: List all users (Admin only).
    - POST: Create a new user (
    Admin only, or could be registration if you use this instead
    ).
    """
    queryset = User.objects.all().order_by('date_joined')
    serializer_class = UserSerializer
    # Only Admin users can access this list
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]


class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a user by ID.
    - GET: Retrieve a user (Admin or the user themselves).
    - PUT/PATCH: Update a user (Admin or the user themselves).
    - DELETE: Delete a user (Admin only).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # Use IsOwnerOrAdmin for object-level permissions
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    # Need to modify queryset or lookup field for IsOwnerOrAdmin
    # We will assume the URL lookup field is 'pk' (the user's ID)

    def get_object(self):
        """
        Overrides get_object so that obj.developer == request.user
        works correctly.
        Since the object is a User instance, adapt IsOwnerOrAdmin's
        logic to check the User instance itself, not a 'developer'
        field.
        """
        obj = super().get_object()

        # Adapt IsOwnerOrAdmin logic for the User object itself
        # Change: 'obj.developer == request.user' to 'obj == self.request.user'
        if self.request.user.role == 'admin':
            return obj

        if obj != self.request.user:
            self.permission_denied(
                self.request,
                message='You do not have permission to access this user.'
            )

        return obj

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view
        requires.
        Special case: DELETE is typically Admin-only.
        """
        if self.request.method == 'DELETE':
            # Only Admin can delete users
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        else:
            # Owner or Admin can Retrieve/Update
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

        return [permission() for permission in permission_classes]


class LoginView(APIView):
    """
    API endpoint for user login.
    Returns auth token + user data.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get or create token
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"detail": "Logged out successfully."})
