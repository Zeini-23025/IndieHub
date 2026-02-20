from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from .models import Category, Game, Screenshot, Review
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
    # Read nested categories, write via category_ids (list of PKs)
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Category.objects.all(),
        write_only=True,
        source='categories',
        required=False,
    )

    base_screenshot = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, required=False)
    download_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Game
        fields = [
            'id', 'title', 'description',
            'title_ar', 'description_ar',
            'file_path', 'status', 'developer',
            'categories', 'category_ids',
            'base_screenshot', 'average_rating', 'download_count',
            'created_at', 'updated_at'
        ]
    read_only_fields = [
        'id', 'status', 'created_at', 'updated_at',
        'base_screenshot', 'average_rating', 'download_count'
    ]

    def get_base_screenshot(self, obj):
        """Returns the URL of the base screenshot."""
        base = obj.screenshots.filter(is_base=True).first()
        if base:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(base.image_path.url)
            return base.image_path.url
        return None

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


class ScreenshotSerializer(serializers.ModelSerializer):
    """Serializer for Game Screenshot"""
    class Meta:
        model = Screenshot
        fields = ['id', 'game', 'image_path', 'is_base', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Game Review"""
    # Expose the review author as a read-only nested object (id + username)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_username = serializers.SerializerMethodField(read_only=True)
    user_profile_image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'game', 'user', 'user_username', 'user_profile_image',
            'rating', 'comment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_user_username(self, obj):
        try:
            return obj.user.username
        except Exception:
            return None

    def get_user_profile_image(self, obj):
        try:
            if obj.user.profile_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.user.profile_image.url)
                return obj.user.profile_image.url
            return None
        except Exception:
            return None

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                'Rating must be between 1 and 5.'
            )
        return value

    def validate(self, attrs):
        """Enforce one review per user per game at validation time."""
        request = self.context.get('request')
        # Only check on create
        if request and request.method in ('POST',):
            user = request.user
            game = attrs.get('game')
            if user and user.is_authenticated and game is not None:
                exists = Review.objects.filter(game=game, user=user).exists()
                if exists:
                    raise serializers.ValidationError(
                        'You have already reviewed this game.'
                    )
        return super().validate(attrs)

    def create(self, validated_data):
        # Set the review user from the request
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)
