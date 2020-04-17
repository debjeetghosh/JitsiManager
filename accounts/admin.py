from django.contrib import admin

# Register your models here.
from accounts.models import JitsiUser

admin.site.register(JitsiUser)