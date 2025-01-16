# Generated by Django 5.1.3 on 2024-12-09 22:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0032_alter_logs_options'),
    ]

    operations = [
        migrations.CreateModel(
            name='TemporaryPersonnel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('contact', models.CharField(max_length=255)),
                ('location', models.CharField(max_length=255)),
                ('employment_type', models.CharField(max_length=255)),
                ('department_position', models.CharField(max_length=255)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
