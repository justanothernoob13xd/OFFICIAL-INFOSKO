from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone  
from django.utils.timezone import now
from .models import Personnel, Logs, RoomSchedule, RoomScheduleLogs

#Classroom Signals
# Signal for logging schedule creation or updates
@receiver(post_save, sender=RoomSchedule)
def log_room_schedule_save(sender, instance, created, **kwargs):
    action = "Created" if created else "Updated"
    RoomScheduleLogs.objects.create(
        action=f"{action} schedule",
        room_name=instance.room.number,
        schedule_type=instance.schedule_type,
        timestamp=now()
    )

# Signal for logging schedule deletion
@receiver(post_delete, sender=RoomSchedule)
def log_room_schedule_delete(sender, instance, **kwargs):
    RoomScheduleLogs.objects.create(
        action="Deleted schedule",
        room_name=instance.room.number,
        schedule_type=instance.schedule_type,
        timestamp=now()
    )

#Personnel signals
@receiver(post_save, sender=Personnel)
def log_personnel_save(sender, instance, created, **kwargs):
    if created:
       Logs.objects.create(
    action="Added",
    personnel_name=instance.name,
    timestamp=timezone.now(),
)
    else:
       Logs.objects.create(
    action="Added",
    personnel_name=instance.name,
    timestamp=timezone.now(),
)

@receiver(post_delete, sender=Personnel)
def log_personnel_delete(sender, instance, **kwargs):
    Logs.objects.create(
        action="Deleted",
        personnel_name=instance.name,  # Use the correct field from your Logs model
        timestamp=timezone.now()  # Add a timestamp explicitly if needed
    )
