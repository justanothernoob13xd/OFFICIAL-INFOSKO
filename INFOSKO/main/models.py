from django.db import models

# Create your models here.

class Personnel(models.Model):
    name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    contact = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    image = models.ImageField(upload_to='personnel_images/', null=True, blank=True)
    

    def __str__(self):
        return self.name
    
class Item(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.name