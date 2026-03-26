from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_userprofile_is_insider_insiderapplication_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="steam_id",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="teammate_games",
            field=models.TextField(blank=True),
        ),
    ]
