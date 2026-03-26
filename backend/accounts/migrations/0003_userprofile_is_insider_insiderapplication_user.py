from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_userprofile"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="is_insider",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="insiderapplication",
            name="user",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="insider_application",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
