# Generated by Django 5.1.3 on 2025-01-12 18:16

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0057_semester'),
    ]

    operations = [
        migrations.RenameField(
            model_name='semester',
            old_name='name',
            new_name='semester_name',
        ),
    ]
