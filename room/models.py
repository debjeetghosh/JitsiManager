from time import time

from django.db import models

# Create your models here.
from accounts.models import JitsiUser
from django.utils.translation import ugettext_lazy as _


class Room(models.Model):
    PUBLIC, PRIVATE = "public", "private"
    ROOM_TYPE = ((PUBLIC, "Public"), (PRIVATE, "Private"),)

    name = models.CharField(max_length=255)
    room_id = models.CharField(max_length=255)
    room_type = models.CharField(max_length=255, choices=ROOM_TYPE, default='public')
    created_by = models.ForeignKey(JitsiUser, on_delete=models.DO_NOTHING, related_name='created_rooms')
    is_active = models.BooleanField(default=True)
    max_number_of_user = models.IntegerField(_("Maximum number of users"), default=-1)
    start_time = models.BigIntegerField(default=0)
    host_join_time = models.BigIntegerField(null=True)
    end_time = models.BigIntegerField(default=0)
    max_length = models.IntegerField(_("Maximum meeting time length (in Minutes)"), default=-1)
    password = models.CharField(max_length=20, null=True)

    def status(self):
        time_now = int(time())*1000
        if self.start_time > time_now:
            return "Not started yet"
        if self.start_time < time_now and self.max_length > 0:
            if time_now > (self.start_time+self.max_length*60*1000):
                return "Ended"
        return "On going"

