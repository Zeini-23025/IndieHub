from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Check if user is admin"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsDeveloperUser(permissions.BasePermission):
    """Check if user is developer"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'developer'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Check if user is owner or admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj == request.user
