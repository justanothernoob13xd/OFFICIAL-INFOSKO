from celery import shared_task
from .models import RoomSchedule, Room
from django.utils.timezone import localtime, now
from datetime import datetime

@shared_task
def cleanup_expired_temporary_schedules():
    """
    Clean up expired temporary schedules based on the current day and time.
    """
    now_time = localtime().time()
    current_day = localtime().strftime('%A')  # Get the current day as a string (e.g., "Monday")

    # Fetch temporary schedules that have expired
    expired_schedules = RoomSchedule.objects.filter(
        schedule_type="temporary",
        day=current_day,  # Match schedules for the current day
        end_time__lt=now_time  # End time is in the past
    )
    
    # Count and delete the expired schedules
    deleted_count, _ = expired_schedules.delete()
    return f"Deleted {deleted_count} expired temporary schedules."

@shared_task
def mark_unoccupied():
    timeout = now() - datetime.timedelta(minutes=5)
    rooms_to_update = Room.objects.filter(occupied=True, last_motion__lt=timeout)
    rooms_to_update.update(occupied=False)
