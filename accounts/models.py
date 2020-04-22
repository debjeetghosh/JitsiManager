import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.contrib.auth.models import AbstractUser


# Create your models here.
class MyUserManager(BaseUserManager):
    def create_superuser(self, email, username, password=None):
        user = self.model(
            email=self.normalize_email(email),
            username=username
        )
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        profile = UserProfile.objects.create(
            user=user,
            user_uid=uuid.uuid4(),
            user_type=UserProfile.CREATOR,
            name=username
        )
        return user



class JitsiUser(AbstractUser):
    objects = MyUserManager()


class UserProfile(models.Model):
    CREATOR, ADMIN = 'creator', 'admin'
    USER_TYPE_CHOICES = ((CREATOR, "Content Creator"), (ADMIN, "Admin member"), )

    user = models.OneToOneField(JitsiUser, models.CASCADE, related_name='profile')
    user_uid = models.CharField(max_length=255, default='')
    name = models.CharField(max_length=255)
    user_type = models.CharField(choices=USER_TYPE_CHOICES, max_length=255)
