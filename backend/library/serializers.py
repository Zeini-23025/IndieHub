from rest_framework import serializers
from .models import LibraryEntry
from games.models import Game
from games.serializers import GameSerializer


class LibraryEntrySerializer(serializers.ModelSerializer):
    """Serializer for Library Entry.

    - `user` is set automatically from the request via HiddenField.
    - `game` accepts a PK for approved games on write and is represented
      as nested `GameSerializer` on read.
    """
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    game = serializers.PrimaryKeyRelatedField(
        queryset=Game.objects.filter(status='approved')
    )

    class Meta:
        model = LibraryEntry
        fields = ['id', 'user', 'game', 'added_at']
        read_only_fields = ['id', 'added_at']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['game'] = GameSerializer(instance.game, context=self.context).data
        return rep
