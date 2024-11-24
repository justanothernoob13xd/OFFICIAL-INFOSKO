from django.db import models
# Model for Faculties

class Personnel(models.Model):
    SELECT = 'select'  # Placeholder value
    FULL_TIME = 'full-time'
    PART_TIME = 'part-time'
    KEY_PERSON = 'key-person'

    EMPLOYMENT_TYPE_CHOICES = [
        (SELECT, 'Select'),
        (FULL_TIME, 'Full-Time'),
        (PART_TIME, 'Part-Time'),
        (KEY_PERSON, 'Key Person'),
    ]

    name = models.CharField(max_length=100, unique=True)  # Ensures unique names
    contact = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    image = models.ImageField(upload_to='personnel_images/', null=True, blank=True, default='defaultpic.jpg')  # Default image
    department_position = models.CharField(max_length=255, blank=True, null=True)
    employment_type = models.CharField(max_length=50, choices=EMPLOYMENT_TYPE_CHOICES, default=SELECT)  # Default to SELECT
    created_at = models.DateTimeField(auto_now_add=True)  # For automated logs
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Ensure data consistency."""
        if self.employment_type == self.KEY_PERSON and not self.department_position:
            raise ValidationError('Key Person must have a department position.')

    def display_position(self):
        """Display department position only for key persons."""
        return self.department_position if self.employment_type == self.KEY_PERSON else ''

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
    occupied = models.BooleanField(default=False)

    def __str__(self):
        return f'Room {self.number}'

#Model for room Schedule
class RoomSchedule(models.Model):
    room_id = models.ForeignKey(Room, on_delete=models.CASCADE)
    section = models.CharField(max_length=50)
    date = models.DateField()  # Add date field
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

    def __str__(self):
        return f'{self.room_id}'
