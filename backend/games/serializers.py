from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Game Category"""
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description',
            'name_ar', 'description_ar'
        ]
        read_only_fields = ['id']
