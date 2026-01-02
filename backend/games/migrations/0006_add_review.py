from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0005_category_m2m'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Review',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(help_text='Rating score (1-5)')),
                ('comment', models.TextField(blank=True, help_text='Review comment')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Last update timestamp')),
                ('game', models.ForeignKey(help_text='Reviewed game', on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='games.game')),
                ('user', models.ForeignKey(help_text='Reviewing user', on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Review',
                'verbose_name_plural': 'Reviews',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='review',
            constraint=models.UniqueConstraint(fields=['game', 'user'], name='unique_review_per_user_per_game'),
        ),
    ]
