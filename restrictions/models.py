from django.db import models
from accounts.models import JitsiUser
from django.utils.translation import ugettext_lazy as _

# Create your models here.
from room.models import Room


class Restrictions(models.Model):
	user = models.OneToOneField(JitsiUser, models.CASCADE, related_name='restrictions', unique=True)
	max_room_count = models.IntegerField(_("Maximum room a user can create"), default=0)
	max_time_length = models.IntegerField(_("Maximum time length of a room(in minute)"), default=0)
	max_member_count = models.IntegerField(_("Maximum number of guest in a room"), default=0)

	@staticmethod
	def can_create_new_room(user):
		restriction = Restrictions.objects.filter(user=user).first()
		if restriction:
			rooms_by_user = Room.objects.filter(created_by=user)
			if rooms_by_user.count() >= restriction.max_room_count:
				return False
		return True
