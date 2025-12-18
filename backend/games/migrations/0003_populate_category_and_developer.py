from django.db import migrations


def populate_category_and_developer(apps, schema_editor):
    Game = apps.get_model('games', 'Game')
    Category = apps.get_model('games', 'Category')
    User = apps.get_model('users', 'User')

    # Ensure there's an "Uncategorized" category
    uncategorized, _ = Category.objects.get_or_create(
        name='Uncategorized',
        defaults={
            'description': 'Automatically created default category',
            'name_ar': 'غير مصنف',
            'description_ar': 'تصنيف افتراضي تم إنشاؤه تلقائياً',
        }
    )

    # Pick a developer user if available, otherwise fall back to an admin user.
    dev = User.objects.filter(role='developer').first()
    if not dev:
        dev = User.objects.filter(role='admin').first()

    # Assign category and developer where missing
    Game.objects.filter(category__isnull=True).update(category=uncategorized)
    if dev:
        Game.objects.filter(developer__isnull=True).update(developer=dev)


def reverse_populate(apps, schema_editor):
    # no-op: don't revert automatic assignments
    return


class Migration(migrations.Migration):

    dependencies = [
        ('games', '0002_add_developer'),
    ]

    operations = [
        migrations.RunPython(
            populate_category_and_developer,
            reverse_populate,
        ),
    ]
