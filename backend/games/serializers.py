from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from .models import Category, Game
from users.models import User


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Game Category"""
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description',
            'name_ar', 'description_ar'
        ]
        read_only_fields = ['id']


class GameSerializer(serializers.ModelSerializer):
    """Serializer for Game"""
    # allow admin to set developer (pk). Devs auto-assigned on create
    developer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='developer'),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Game
        fields = [
            'id', 'title', 'description',
            'title_ar', 'description_ar',
            'file_path', 'status', 'developer', 'created_at', 'updated_at'
        ]
    read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Prevent non-admin users from setting status in payload."""
        request = self.context.get('request')
        if request is None:
            return super().validate(attrs)

        is_admin = (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )
        if not is_admin and 'status' in request.data:
            # non-admin trying to set status
            raise PermissionDenied('Only admins may set status.')
        return super().validate(attrs)

    def create(self, validated_data):
        request = self.context.get('request')
        # If developer not provided and request user is a developer, set it.
        if request and request.user.is_authenticated:
            if request.user.role == 'developer':
                validated_data.setdefault('developer', request.user)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        # Prevent non-admin from changing status.
        if request and request.user and request.user.is_authenticated:
            is_admin = request.user.role == 'admin'
        else:
            is_admin = False

        if not is_admin and 'status' in validated_data:
            raise PermissionDenied('Only admin users can change the status.')
        return super().update(instance, validated_data)
