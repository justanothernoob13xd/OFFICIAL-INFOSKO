# cleanup/management/commands/cleanup_temporary_schedules.py
from django.core.management.base import BaseCommand
from main.models import RoomSchedule

class Command(BaseCommand):
    help = 'Cleanup expired temporary schedules'

    def handle(self, *args, **kwargs):
        expired_schedules = RoomSchedule.objects.filter(schedule_type='temporary').filter(
            end_time__lte=localtime().time(),
            date__lte=localtime().date(),
        )
        count = expired_schedules.count()
        expired_schedules.delete()
        self.stdout.write(f"Deleted {count} expired temporary schedules.")
