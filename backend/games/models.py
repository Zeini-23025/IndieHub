from django.db import models
from users.models import User
from django.core.validators import FileExtensionValidator


class Category(models.Model):
    """
    Game categories for classification
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Category name'
    )
    description = models.TextField(
        blank=True,
        help_text='Category description'
    )

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Game(models.Model):
    """
    Game model representing submitted games
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    title = models.CharField(
        max_length=255,
        help_text='Game title'
    )
    description = models.TextField(
        help_text='Game description'
    )
    file_path = models.FileField(
        upload_to='games/',
        validators=[FileExtensionValidator(
            allowed_extensions=['zip', 'rar', '7z', 'exe']
        )],
        help_text='Game file (zip, rar, 7z, exe)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text='Game validation status'
    )
    developer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='games',
        limit_choices_to={'role': 'developer'},
        help_text='Game developer'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='games',
        help_text='Game category'
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text='Reason for rejection (if rejected)'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Creation timestamp'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Last update timestamp'
    )


class Screenshot(models.Model):
    """
    Game screenshots/images
    """
    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        related_name='screenshots',
        help_text='Related game'
    )
    image_path = models.ImageField(
        upload_to='screenshots/',
        help_text='Screenshot image'
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Upload timestamp'
    )

    class Meta:
        verbose_name = 'Screenshot'
        verbose_name_plural = 'Screenshots'
        ordering = ['uploaded_at']

    def __str__(self):
        return f"Screenshot for {self.game.title}"
