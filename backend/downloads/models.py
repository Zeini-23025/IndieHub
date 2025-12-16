from django.db import models
from games.models import Game
from users.models import User


class DownloadHistory(models.Model):
    """
    Track game downloads
    """
    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        related_name='downloads',
        help_text='Downloaded game'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='download_history',
        help_text='User who downloaded (optional)'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='Download timestamp'
    )
    device_info = models.CharField(
        max_length=255,
        blank=True,
        help_text='Device information'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of downloader'
    )

    class Meta:
        verbose_name = 'Download History'
        verbose_name_plural = 'Download Histories'
        ordering = ['-timestamp']

    def __str__(self):
        user_info = self.user.username if self.user else 'Anonymous'
        return f"{self.game.title} downloaded by {user_info}"
