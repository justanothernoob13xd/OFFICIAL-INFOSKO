# Generated by Django 5.1.2 on 2024-11-22 07:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0024_alter_personnel_image'),
    ]

    operations = [
        migrations.AlterField(
            model_name='personnel',
            name='image',
            field=models.ImageField(blank=True, default='PUP.LOGO.png', null=True, upload_to='personnel_images/'),
        ),
    ]
