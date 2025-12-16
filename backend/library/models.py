from django.db import models
from games.models import Game
from users.models import User


class LibraryEntry(models.Model):
    """
    User's personal game library
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='library',
        help_text='User'
    )
    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        related_name='in_libraries',
        help_text='Game'
    )
    added_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Date added to library'
    )

    class Meta:
        verbose_name = 'Library Entry'
        verbose_name_plural = 'Library Entries'
        ordering = ['-added_at']
        unique_together = ['user', 'game']

    def __str__(self):
        return f"{self.user.username}'s library: {self.game.title}"
