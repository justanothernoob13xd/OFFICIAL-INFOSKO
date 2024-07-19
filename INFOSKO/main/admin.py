from django.contrib import admin
from .models import Personnel, Room, RoomSchedule



# Register your models here.
admin.site.register(Personnel)
admin.site.register(Room)
admin.site.register(RoomSchedule)