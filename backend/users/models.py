from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model with role-based access control
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('developer', 'Developer'),
        ('user', 'User'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        help_text='User role in the system'
    )
    profile_image = models.ImageField(
        upload_to='profile_images/',
        null=True,
        blank=True,
        help_text='User profile image'
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.role})"
