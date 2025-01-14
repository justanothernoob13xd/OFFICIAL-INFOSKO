from celery import shared_task
from .models import RoomSchedule
from django.utils.timezone import localtime

@shared_task
def cleanup_expired_temporary_schedules():
    now_time = localtime().time()
    now_date = localtime().date()
    expired_schedules = RoomSchedule.objects.filter(
        schedule_type="temporary",
        end_time__lt=now_time,
        date__lte=now_date
    )
    deleted_count, _ = expired_schedules.delete()
    return f"Deleted {deleted_count} expired temporary schedules"
