from django.db import models

# Model for Faculties

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
    
#Model for Classroom
class Room(models.Model):
    number = models.CharField(max_length=10)
    isOccupied = models.BooleanField(default=False)

class RoomSchedule(models.Model):
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE)
    section = models.CharField(max_length=50)
    time_start = models.TimeField()
    time_end = models.TimeField()
    class_name = models.CharField(max_length=100)
    supervisor = models.CharField(max_length=100)
    day_of_week = models.CharField(max_length=9, choices=[
        ('Sunday', 'Sunday'),
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
    ], default='Sunday') 

    