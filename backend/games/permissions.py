"""Compatibility shim: reuse permissions from users app so other apps
can `from .permissions import ...` without duplicating logic.
"""

from users.permissions import IsAdminOrDeveloper, IsOwnerOrAdmin

__all__ = ["IsAdminOrDeveloper", "IsOwnerOrAdmin"]
