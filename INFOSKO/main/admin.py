from django.contrib import admin
from django import forms 
from .models import Personnel, Room, RoomSchedule
from .forms import PersonnelForm

class PersonnelForm(forms.ModelForm):
    class Meta:
        model = Personnel
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(PersonnelForm, self).__init__(*args, **kwargs)
        # Add the 'Select Employment Type' as the placeholder option
        self.fields['employment_type'].empty_label = "Select Employment Type"

class PersonnelAdmin(admin.ModelAdmin):
    form = PersonnelForm

    class Media:
        js = ('js/custom_admin.js',)  # Link to your custom JS file

# Register your models here.
admin.site.register(Personnel, PersonnelAdmin)
admin.site.register(Room)
admin.site.register(RoomSchedule)