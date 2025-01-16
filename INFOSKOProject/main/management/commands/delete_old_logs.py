from django.core.management.base import BaseCommand
from main.models import Logs
from datetime import timedelta
from django.utils.timezone import now

class Command(BaseCommand):
    help = "Delete logs older than 30 days"

    def handle(self, *args, **options):
        cutoff_date = now() - timedelta(days=30)
        deleted_count, _ = Logs.objects.filter(timestamp__lt=cutoff_date).delete()
        self.stdout.write(f"Deleted {deleted_count} old logs.")
