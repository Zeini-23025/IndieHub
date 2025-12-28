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
        # Admins can access any object
        if request.user and getattr(request.user, 'role', None) == 'admin':
            return True

        # If obj is the user instance, allow owner
        try:
            if obj == request.user:
                return True
        except Exception:
            # defensive: obj comparison might error for non-model objects
            pass
        # If obj has `user`, `developer` or `owner` attr, allow if it matches.
        # LibraryEntry uses `user`. Game may use `developer`; others `owner`.
        owner = getattr(obj, 'user', None)
        if owner is None:
            owner = getattr(obj, 'developer', None)
        if owner is None:
            owner = getattr(obj, 'owner', None)
        if owner is not None:
            return owner == request.user

        return False


class IsAdminOrDeveloper(permissions.BasePermission):
    """Allow access only to users with role admin or developer"""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('admin', 'developer')
        )
