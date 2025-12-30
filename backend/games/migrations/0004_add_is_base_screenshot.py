from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ("games", "0003_populate_category_and_developer"),
    ]

    operations = [
        migrations.AddField(
            model_name="screenshot",
            name="is_base",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Marks this screenshot as the base/primary image "
                    "for the game"
                ),
            ),
        ),
        migrations.AddConstraint(
            model_name="screenshot",
            constraint=models.UniqueConstraint(
                fields=["game"],
                condition=Q(is_base=True),
                name="unique_base_screenshot_per_game",
            ),
        ),
    ]
