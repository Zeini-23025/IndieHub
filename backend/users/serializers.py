from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'role', 'first_name', 'last_name', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

    def create(self, validated_data):
        """Create user with hashed password"""
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login (validate credentials)"""
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Do not import authenticate here to keep serializer pure; view will call authenticate
        if not data.get('username') or not data.get('password'):
            raise serializers.ValidationError('Must include "username" and "password".')
        return data
