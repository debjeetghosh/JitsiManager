from django.contrib import admin
from django.utils.html import format_html
from restrictions.models import *
# Register your models here.

class RestrictionAdmin(admin.ModelAdmin):
	def change_button(self, obj):
		return format_html('<a class="btn" href="/admin/restrictions/restrictions/{}/change/">Change</a>', obj.id)

	def delete_button(self, obj):
		return format_html('<a class="btn" href="/admin/restrictions/restrictions/{}/delete/">Delete</a>', obj.id)

	change_button.short_description = ''
	delete_button.short_description = ''

	list_display= ('user', 'max_room_count', 'max_time_length', 'max_member_count', 'change_button', 'delete_button')

admin.site.register(Restrictions, RestrictionAdmin)