"""Make Game.categories a ManyToManyField and migrate existing data.

This migration adds a new ManyToManyField `categories` on Game,
copies the existing `category` FK value (if any) into the M2M table,
then removes the old `category` ForeignKey column.

NOTE: Always review and run tests locally after applying migrations.
"""
from django.db import migrations, models


def copy_category_to_m2m(apps, schema_editor):
    Game = apps.get_model('games', 'Game')
    for game in Game.objects.all():
        # if the old FK `category_id` exists, add it to the M2M
        cat_id = getattr(game, 'category_id', None)
        if cat_id:
            game.categories.add(cat_id)


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0004_add_is_base_screenshot'),
    ]

    operations = [
        # Add M2M field
        migrations.AddField(
            model_name='game',
            name='categories',
            field=models.ManyToManyField(
                related_name='games',
                to='games.Category',
                blank=True,
            ),
        ),
        # Copy existing FK values into the new M2M table
        migrations.RunPython(
            copy_category_to_m2m,
            reverse_code=migrations.RunPython.noop,
        ),
        # Remove the old FK
        migrations.RemoveField(
            model_name='game',
            name='category',
        ),
    ]
