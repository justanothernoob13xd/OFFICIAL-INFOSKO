# Generated by Django 5.1.3 on 2025-01-03 02:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0046_roomschedule_schedule_type'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='room',
            name='last_checked',
        ),
        migrations.AlterField(
            model_name='room',
            name='number',
            field=models.CharField(max_length=100),
        ),
    ]
