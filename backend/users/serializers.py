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


    def validate(self, data):
        """
        Validate registration data.
        Restrict 'admin' role creation to existing admin users.
        """
        role = data.get('role')
        request = self.context.get('request')

        if role == 'admin':
            # Check if requesting user is an admin
            if not request or not request.user or not request.user.is_authenticated or request.user.role != 'admin':
                raise serializers.ValidationError({
                    "role": "Only administrators can create admin accounts."
                })
        
        return data


class LoginSerializer(serializers.Serializer):
    """Serializer for user login (validate credentials)"""
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Do not import authenticate here to keep serializer pure;
        #  view will call authenticate
        if not data.get('username') or not data.get('password'):
            raise serializers.ValidationError(
                'Must include "username" and "password".'
            )
        return data
