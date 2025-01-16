from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone  
from .models import Personnel, Logs

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
