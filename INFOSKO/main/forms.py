from django import forms
from .models import Personnel

class PersonnelForm(forms.ModelForm):
    class Meta:
        model = Personnel
        fields = ['name', 'position', 'contact', 'location', 'image', 'employment_type']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add a disabled 'Select Employment Type' option
        self.fields['employment_type'].choices = [
            ('', 'Select Employment Type'),  # This will show but be disabled
        ] + list(self.fields['employment_type'].choices[1:])
        self.fields['employment_type'].widget.attrs.update({
            'required': True,  # Enforce selection
        })