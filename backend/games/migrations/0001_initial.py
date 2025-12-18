# Generated manually to satisfy initial migration for `games` app

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, help_text='Category name')),
                ('description', models.TextField(blank=True, help_text='Category description')),
                ('name_ar', models.CharField(max_length=100, unique=True, help_text='Category name in Arabic')),
                ('description_ar', models.TextField(blank=True, help_text='Category description in Arabic')),
            ],
            options={
                'verbose_name': 'Category',
                'verbose_name_plural': 'Categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, help_text='Game title')),
                ('title_ar', models.CharField(max_length=255, help_text='Game title in Arabic')),
                ('description', models.TextField(help_text='Game description')),
                ('description_ar', models.TextField(help_text='Game description in Arabic')),
                ('file_path', models.FileField(upload_to='games/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['zip', 'rar', '7z', 'exe'])], help_text='Game file (zip, rar, 7z, exe)')),
                ('status', models.CharField(default='pending', max_length=20, help_text='Game validation status')),
                ('rejection_reason', models.TextField(blank=True, help_text='Reason for rejection (if rejected)')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Last update timestamp')),
                ('category', models.ForeignKey(help_text='Game category', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='games', to='games.category')),
            ],
            options={
                'verbose_name': 'Game',
                'verbose_name_plural': 'Games',
            },
        ),
        migrations.CreateModel(
            name='Screenshot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image_path', models.ImageField(upload_to='screenshots/', help_text='Screenshot image')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True, help_text='Upload timestamp')),
                ('game', models.ForeignKey(help_text='Related game', on_delete=django.db.models.deletion.CASCADE, related_name='screenshots', to='games.game')),
            ],
            options={
                'verbose_name': 'Screenshot',
                'verbose_name_plural': 'Screenshots',
                'ordering': ['uploaded_at'],
            },
        ),
    ]
