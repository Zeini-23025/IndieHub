from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("games", "0001_initial"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='developer',
            field=models.ForeignKey(
                null=True,
                to='users.user',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='games',
                help_text='Game developer',
            ),
        ),
    ]
