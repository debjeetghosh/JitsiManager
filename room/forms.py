from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from accounts.models import JitsiUser
from restrictions.models import Restrictions
from room.models import Room
from django.utils.translation import ugettext_lazy as _


class RoomForm(forms.ModelForm):

    def __init__(self, user, *args, **kwargs):
        super(RoomForm, self).__init__(*args, **kwargs)
        self.user = user
        self.fields['password'].required = False

    def clean(self):
        super().clean()
        restriction = Restrictions.objects.filter(user=self.user).first()
        if not self.user.is_staff and not self.user.is_superuser and restriction:
            max_number_of_user = int(self.data.get('max_number_of_user'))
            max_length = int(self.data.get('max_length'))

            if restriction.max_member_count > 0 and (max_number_of_user > restriction.max_member_count or max_number_of_user < 0):
                self.add_error('max_number_of_user','You cannot set Maximum number of guest in a meeting more than {value}'.format(value=restriction.max_member_count))
            if restriction.max_time_length > 0 and (max_length > restriction.max_time_length or max_length < 0):
                self.add_error('max_length','You cannot set time length of a meeting more than {value}'.format(value=restriction.max_time_length))

    class Meta:
        model = Room
        fields = ['name', 'password', 'max_number_of_user', 'max_length', 'start_time']
        help_texts = {
            "max_number_of_user": "Please put -1 if you want unlimited",
            "max_length": "Please put -1 if you want unlimited",
        }

        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'password': forms.TextInput(attrs={'class': 'form-control'}),
            'max_number_of_user': forms.TextInput(attrs={'class': 'form-control'}),
            'max_length': forms.TextInput(attrs={'class': 'form-control'}),
            'start_time': forms.HiddenInput()
        }
