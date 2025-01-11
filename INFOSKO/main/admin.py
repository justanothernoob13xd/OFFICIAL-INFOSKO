from django.contrib import admin
from django.urls import path
from django.shortcuts import render, redirect
from django.http import HttpResponseRedirect
from django.contrib import messages
from django.db import IntegrityError
from django.db import IntegrityError, transaction
import csv
from .forms import UploadCSVForm
from .models import Personnel, Room, RoomSchedule, Logs
from django.core.exceptions import ValidationError
from django.utils.timezone import localtime
from datetime import datetime
import logging

# Logger for debugging
logger = logging.getLogger(__name__)

# Helper Function: Cleanup Expired Temporary Schedules
def cleanup_expired_temporary_schedules():
    now = datetime.now()
    expired_schedules = RoomSchedule.objects.filter(
        schedule_type="Temporary",
        end_time__lt=now.time(),
        date__lt=now.date()
    )
    expired_schedules.delete()

# Admin Action: Cleanup Expired Temporary Schedules
@admin.action(description="Cleanup expired temporary schedules")
def cleanup_expired_schedules_action(modeladmin, request, queryset):
    cleanup_expired_temporary_schedules()
    messages.success(request, "Expired temporary schedules cleaned up successfully!")

# RoomSchedule Admin
class RoomScheduleAdmin(admin.ModelAdmin):
    list_display = ("room", "formatted_date", "formatted_time")
    actions = [cleanup_expired_schedules_action]

    @admin.display(description="Date")
    def formatted_date(self, obj):
        return obj.date.strftime("%b %d, %Y")

    @admin.display(description="Time")
    def formatted_time(self, obj):
        return f"{obj.start_time.strftime('%I:%M %p')} - {obj.end_time.strftime('%I:%M %p')}"
    

class RoomAdmin(admin.ModelAdmin):
    list_display = ('number', 'occupied')

    def save_model(self, request, obj, form, change):
        try:
            with transaction.atomic():
                obj.full_clean()  # Validate the model instance
                super().save_model(request, obj, form, change)
        except ValidationError as e:
            self.message_user(request, f"Validation Error: {e.message}", level=messages.ERROR)
        except IntegrityError:
            self.message_user(
                request,
                f"Error: A room with the number '{obj.number}' already exists.",
                level=messages.ERROR
            )
            
# Personnel Admin
class PersonnelAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact', 'location', 'employment_type', 'department_position')
    fields = ('name', 'contact', 'location', 'employment_type', 'department_position', 'image')
    change_list_template = "admin/personnel_changelist.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('upload-csv/', self.admin_site.admin_view(self.upload_csv), name="upload_csv"),
            path('preview-csv/', self.admin_site.admin_view(self.preview_csv), name="preview_csv"),
        ]
        return custom_urls + urls

    def upload_csv(self, request):
        if request.method == "POST":
            form = UploadCSVForm(request.POST, request.FILES)
            if form.is_valid():
                csv_file = form.cleaned_data['csv_file']
                if not csv_file.name.endswith('.csv'):
                    self.message_user(request, "Please upload a valid CSV file.", level='error')
                    return HttpResponseRedirect(request.path)

                csv_data = csv_file.read().decode('utf-8').splitlines()
                csv_reader = csv.DictReader(csv_data)
                rows = list(csv_reader)

                if not rows:
                    self.message_user(request, "The uploaded CSV file is empty.", level='error')
                    return HttpResponseRedirect(request.path)

                request.session['csv_preview_data'] = rows
                logger.info("Preview data saved in session")
                return redirect("admin:preview_csv")
            else:
                self.message_user(request, "Error in form submission.", level='error')

        form = UploadCSVForm()
        return render(request, "admin/personnel_upload_csv.html", {'form': form})

    def preview_csv(self, request):
        csv_data = request.session.get('csv_preview_data')
        if not csv_data:
            self.message_user(request, "No CSV data to preview.", level='error')
            return redirect("admin:upload_csv")

        if request.method == "POST":
            try:
                for row in csv_data:
                    Personnel.objects.update_or_create(
                        name=row.get('name'),
                        defaults={
                            'contact': row.get('contact') or "Default Contact",
                            'location': row.get('location') or "Default Location",
                            'employment_type': row.get('employment_type') or "Unknown",
                            'department_position': row.get('department_position') or "Unspecified",
                            'image': row.get('image') if row.get('image') else None,
                        }
                    )
                del request.session['csv_preview_data']
                messages.success(request, "All personnel data imported successfully!")
                return redirect("admin:main_personnel_changelist")
            except Exception as e:
                logger.error(f"Error saving CSV data: {e}")
                messages.error(request, f"An error occurred: {e}")

        return render(request, "admin/personnel_preview_csv.html", {'csv_data': csv_data})

# Logs Admin
@admin.register(Logs)
class LogsAdmin(admin.ModelAdmin):
    list_display = ('action', 'personnel_name', 'timestamp')
    list_filter = ('action',)
    search_fields = ('personnel_name',)

# Register Models in Admin
admin.site.register(Personnel, PersonnelAdmin)
admin.site.register(Room, RoomAdmin)
admin.site.register(RoomSchedule, RoomScheduleAdmin)
