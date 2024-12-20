from django.contrib import admin
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.http import HttpResponseRedirect
from django.contrib import messages
import csv
from .forms import UploadCSVForm
from .models import Personnel, Room, RoomSchedule, Logs
import logging

logger = logging.getLogger(__name__)

class PersonnelAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact', 'location', 'employment_type', 'department_position')
    fields = ('name', 'contact', 'location', 'employment_type', 'department_position', 'image')

    change_list_template = "admin/personnel_changelist.html"  # Custom template for CSV upload button

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
                logger.debug(f"CSV Headers: {csv_reader.fieldnames}")
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
                    logger.info(f"Personnel imported: {row}")
                del request.session['csv_preview_data']
                messages.success(request, "All personnel data imported successfully!")
                return redirect("admin:main_personnel_changelist")
            except Exception as e:
                logger.error(f"Error saving CSV data: {e}")
                messages.error(request, f"An error occurred: {e}")

        return render(request, "admin/personnel_preview_csv.html", {'csv_data': csv_data})


# LogsAdmin: Handles Logs in Admin
@admin.register(Logs)
class LogsAdmin(admin.ModelAdmin):
    list_display = ('action', 'personnel_name', 'timestamp')  # Adjusted to match your model fields
    list_filter = ('action',)
    search_fields = ('personnel_name',)


# Register models in admin
admin.site.register(Personnel, PersonnelAdmin)  # Register Personnel with custom admin
admin.site.register(Room)  # Register Room model
admin.site.register(RoomSchedule)  # Register RoomSchedule model
