# Generated by Django 5.0.6 on 2024-07-31 09:21

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0008_room_roomschedule'),
    ]

    operations = [
        migrations.AddField(
            model_name='roomschedule',
            name='date',
            field=models.DateField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
