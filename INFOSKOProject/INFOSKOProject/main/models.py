from django.db import models
from django.core.exceptions import ValidationError
from django.utils.timezone import now, localtime
from datetime import timedelta
from django.core.management.base import BaseCommand

# Model for Classroom
class Room(models.Model):
    number = models.CharField(max_length=100, unique= True)
    occupied = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        # Check if "Room" is already part of the number
        if not self.number.startswith("Room "):
            self.number = f"Room {self.number}"
        super().save(*args, **kwargs)

    def clean(self):
        # Custom validation to handle duplicates
        if Room.objects.filter(number=self.number).exists():
            raise ValidationError(f"The room '{self.number}' already exists.")

    def __str__(self):
        return self.number
    
class RoomSchedule(models.Model):
    SCHEDULE_TYPES = [
        ('regular', 'Regular'),
        ('temporary', 'Temporary'),
    ]

    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    schedule_type = models.CharField(
        max_length=10,
        choices=SCHEDULE_TYPES,
        default='regular',
    )
    day = models.CharField(max_length=10, choices=[
    ('Monday', 'Monday'),
    ('Tuesday', 'Tuesday'),
    ('Wednesday', 'Wednesday'),
    ('Thursday', 'Thursday'),
    ('Friday', 'Friday'),
    ('Saturday', 'Saturday'),
    ('Sunday', 'Sunday'),
], default='Monday')

    start_time = models.TimeField()
    end_time = models.TimeField()
    professor_name = models.CharField(max_length=100, blank=True, null=True)
    subject_name = models.CharField(max_length=100, blank=True, null=True)
    section_name = models.CharField(max_length=100, blank=True, null=True)
    overridden = models.BooleanField(default=False)  # Indicates if this schedule is overridden by a temporary schedule

    def clean(self):
        overlapping_schedules = RoomSchedule.objects.filter(
            room=self.room,
            day=self.day,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time,
        ).exclude(pk=self.pk)

        if self.schedule_type == 'temporary':
            # Allow temporary schedules to overlap but mark regular schedules as overridden
            for schedule in overlapping_schedules:
                if schedule.schedule_type == 'regular':
                    schedule.overridden = True
                    schedule.save()
        elif self.schedule_type == 'regular':
            # Prevent regular schedules from overlapping with other regular schedules
            if overlapping_schedules.filter(schedule_type='regular').exists():
                raise ValidationError("Regular schedules cannot overlap with another regular schedule.")

    def __str__(self):
        return f"{self.schedule_type.capitalize()} Schedule for Room {self.room.number} on {self.day}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['room', 'day', 'start_time', 'end_time', 'schedule_type'],
                name='unique_schedule_per_day_type'
            )
        ]

class Command(BaseCommand):
    help = "Clean up expired temporary schedules"

    def handle(self, *args, **kwargs):
        now = localtime()
        current_day = now.strftime('%A')  # Get the current day (e.g., 'Monday')
        current_time = now.time()         # Get the current time

        # Find expired temporary schedules based on day and time
        expired_schedules = RoomSchedule.objects.filter(
            schedule_type='temporary',
            day=current_day,  # Filter schedules for the current day
            end_time__lte=current_time  # End time is less than or equal to the current time
        )

        # Delete expired schedules and log the result
        deleted_count, _ = expired_schedules.delete()
        self.stdout.write(f"Deleted {deleted_count} expired temporary schedules.")

class Semester(models.Model):
    name = models.CharField(max_length=100, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()

    def clean(self):
        # Check for overlapping semesters
        overlapping_semesters = Semester.objects.filter(
            start_date__lt=self.end_date,  # Starts before this semester ends
            end_date__gt=self.start_date  # Ends after this semester starts
        ).exclude(id=self.id)  # Exclude the current semester being edited
        if overlapping_semesters.exists():
            raise ValidationError("Semester dates cannot overlap with another semester.")

    def __str__(self):
        return f"{self.name} ({self.start_date} to {self.end_date})"
    
#Logs for Classroom and Schedule
class RoomScheduleLogs(models.Model):
    action = models.CharField(max_length=50)  # e.g., "Added Temporary Schedule", "Deleted Regular Schedule"
    room_name = models.CharField(max_length=255)  # Room involved
    schedule_type = models.CharField(max_length=10, choices=[('regular', 'Regular'), ('temporary', 'Temporary')])
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Room Schedule Logs"

    @staticmethod
    def delete_old_logs(days=30):
        cutoff_date = now() - timedelta(days=days)
        deleted_count, _ = RoomScheduleLogs.objects.filter(timestamp__lt=cutoff_date).delete()
        print(f"Deleted {deleted_count} old log(s) older than {days} days.")

    def __str__(self):
        return f"{self.action} - {self.room_name} ({self.schedule_type}) - {self.timestamp}"
class ArchivedRoomScheduleLogs(models.Model):
    action = models.CharField(max_length=50)
    room_name = models.CharField(max_length=255)
    schedule_type = models.CharField(max_length=10, choices=[('regular', 'Regular'), ('temporary', 'Temporary')])
    timestamp = models.DateTimeField()  # Original log timestamp
    archived_on = models.DateTimeField(auto_now_add=True)  # When it was archived

    def __str__(self):
        return f"Archived: {self.action} - {self.room_name} ({self.schedule_type}) - {self.archived_on}"

# Model for Faculties
class Personnel(models.Model):
    SELECT = 'select'  # Placeholder value
    FULL_TIME = 'full-time'
    PART_TIME = 'part-time'
    KEY_PERSON = 'key-person'

    EMPLOYMENT_TYPE_CHOICES = [
        (SELECT, 'Select'),
        (FULL_TIME, 'full-time'),
        (PART_TIME, 'part-time'),
        (KEY_PERSON, 'key-person'),
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
        if self.employment_type != self.KEY_PERSON and self.department_position:
            raise ValidationError('Only Key Person can have a department position.')

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

# Model for Automated Logs Personnel
class Logs(models.Model):
    action = models.CharField(max_length=50)
    personnel_name = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Personnel logs"

@staticmethod
def delete_old_logs(days=30):
        cutoff_date = now() - timedelta(days=days)
        deleted_count, _ = Logs.objects.filter(timestamp__lt=cutoff_date).delete()
        print(f"Deleted {deleted_count} old log(s) older than {days} days.")
      

def __str__(self):
    return f"{self.action} - {self.personnel_name} - {self.timestamp}"


# Model for Archived Logs
class ArchivedLogs(models.Model):
    action = models.CharField(max_length=50)
    personnel_name = models.CharField(max_length=255)
    timestamp = models.DateTimeField()  # Original log timestamp
    archived_on = models.DateTimeField(auto_now_add=True)  # When it was archived

    def __str__(self):
        return f"Archived: {self.action} - {self.personnel_name} - {self.archived_on}"
