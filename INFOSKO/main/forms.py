from django import forms
from .models import Personnel

class PersonnelForm(forms.ModelForm):
    class Meta:
        model = Personnel
        fields = ['name', 'contact', 'location', 'employment_type', 'department_position', 'image'] 

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add a disabled 'Select Employment Type' option
        self.fields['employment_type'].choices = [
            ('', 'Select Employment Type'),  # This will show but be disabled
        ] + list(self.fields['employment_type'].choices[1:])
        self.fields['employment_type'].widget.attrs.update({
            'required': True,  # Enforce selection
        })

class UploadCSVForm(forms.Form):
    csv_file = forms.FileField(
        label="Select CSV File",
        widget=forms.FileInput(attrs={"accept": ".csv"})
    )