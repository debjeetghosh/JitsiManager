from django import forms

from restrictions.models import Restrictions


class RestrictionForm(forms.ModelForm):
    class Meta:
        model = Restrictions
        fields = ['user', 'max_member_count', 'max_room_count', 'max_time_length']
        help_texts = {
            "max_time_length": "Please put -1 if you want unlimited",
            "max_room_count": "Please put -1 if you want unlimited",
            "max_member_count": "Please put -1 if you want unlimited",
        }
        widgets = {
            'user': forms.HiddenInput(),
            'max_time_length': forms.NumberInput(attrs={"class": "form-control"}),
            "max_room_count": forms.NumberInput(attrs={"class": "form-control"}),
            'max_member_count': forms.NumberInput(attrs={"class": "form-control"})
        }


class RestrictionFormWithoutUserForm(forms.ModelForm):
    class Meta:
        model = Restrictions
        fields = ['max_member_count', 'max_room_count', 'max_time_length']
        help_texts = {
            "max_time_length": "Please put -1 if you want unlimited",
            "max_room_count": "Please put -1 if you want unlimited",
            "max_member_count": "Please put -1 if you want unlimited",
        }
        widgets = {
            'max_time_length': forms.NumberInput(attrs={"class": "form-control"}),
            "max_room_count": forms.NumberInput(attrs={"class": "form-control"}),
            'max_member_count': forms.NumberInput(attrs={"class": "form-control"})
        }
