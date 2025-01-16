from django.db.models import Q
from django.utils.timezone import localtime

# Function to clean up expired temporary schedules
def cleanup_expired_temporary_schedules():
    try:
        # Get the current time and day
        now_time = localtime().time()
        now_day = localtime().strftime('%A')  # Get the current day as a string (e.g., 'Monday')

        # Find expired temporary schedules for the current day and past times
        expired_schedules = RoomSchedule.objects.filter(
            schedule_type="temporary",
            day=now_day,
            end_time__lte=now_time  # End time is in the past
        )

        # Count and delete the expired schedules
        deleted_count, _ = expired_schedules.delete()

        # Log the result
        logger.info(f"Cleaned up {deleted_count} expired temporary schedules.")
    except Exception as e:
        logger.exception(f"Error while cleaning up expired temporary schedules: {e}")
