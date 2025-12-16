from django.urls import path
from .views import (
    UserRegistrationView,
    UserListCreateView,
    UserRetrieveUpdateDestroyView
)

urlpatterns = [
    # POST to create a user (Registration)
    path('register/', UserRegistrationView.as_view(), name='user-register'),

    # GET (List all users - Admin) and POST (Create user - Admin)
    path('users/', UserListCreateView.as_view(), name='user-list'),

    # GET (Retrieve), PUT/PATCH (Update), DELETE (Destroy) a specific user
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
]
