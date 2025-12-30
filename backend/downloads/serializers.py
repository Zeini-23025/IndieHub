from rest_framework import serializers
from .models import DownloadHistory


class DownloadHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DownloadHistory
        fields = [
            "id",
            "game",
            "user",
            "timestamp",
            "ip_address",
            "device_info",
        ]
        read_only_fields = [
            "id",
            "user",
            "timestamp",
            "ip_address",
            "device_info",
        ]

    def create(self, validated_data):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            validated_data["user"] = request.user

        return super().create(validated_data)
