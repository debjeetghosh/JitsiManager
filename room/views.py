import secrets
import uuid
from time import time
from uuid import UUID

import jwt
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404

# Create your views here.
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.generic import ListView

from accounts.models import UserProfile
from jitsi_helper.settings import JITSI_AUD, JITSI_ISSUER, JITSI_PRIVATE_KEY, JITSI_URL
from restrictions.models import Restrictions
from room.forms import RoomForm, RoomPasswordForm
from room.models import Room


@method_decorator(login_required, name="dispatch")
class RoomCreateView(View):
    template_name = 'room/room_create.html'
    form = RoomForm

    def get(self, request):

        if not request.user.is_staff and not request.user.is_superuser and not Restrictions.can_create_new_room(request.user) :
            max_room_count = Restrictions.objects.get(user=request.user).max_room_count
            messages.add_message(request, messages.ERROR, 'You cannot create more than {} meetings.'.format(max_room_count))
            return redirect(reverse('room:room_list'))
        form = self.form(request.user)
        return render(request, self.template_name, locals())

    def post(self, request):
        form = self.form(data=request.POST, user=request.user)
        if form.is_valid():
            room = form.save(commit=False)
            room.room_id = str(int(time())*1000)
            room.created_by = request.user
            if room.max_length > 0:
                room.end_time = room.start_time + room.max_length*60*1000
            room.save()
            form.save_m2m()
            return redirect(reverse('room:room_list'))
        return render(request, self.template_name, locals())


@method_decorator(login_required, name="dispatch")
class RoomUpdateView(View):
    form = RoomForm
    template_name = 'room/room_create.html'

    def get(self, request, *args, **kwargs):
        room_obj = get_object_or_404(Room, pk=kwargs.get('pk'), created_by=request.user)
        form = self.form(instance=room_obj, user=self.request.user)
        update=True
        return render(request, self.template_name, locals())

    def post(self, request, *args, **kwargs):
        room_obj = get_object_or_404(Room, pk=kwargs.get('pk'), created_by=request.user)
        form = self.form(data=request.POST, instance=room_obj, user=self.request.user)
        update=True
        if form.is_valid():
            room = form.save(commit=False)
            if room.max_length > 0:
                room.end_time = room.start_time + room.max_length*60*1000
            room.save()

            form.save_m2m()
            return redirect(reverse('room:room_list'))
        return render(request, self.template_name, locals())


@method_decorator(login_required, name="dispatch")
class RoomListView(ListView):
    model = Room

    def get_queryset(self):
        now_time = int(time())*1000
        return Room.objects.filter(
            created_by=self.request.user
        )


@method_decorator(login_required, name="dispatch")
class RoomJsonDetailsView(View):
    def get(self, request, *args, **kwargs):
        room_id = kwargs.get('pk')
        room = Room.objects.get(pk = room_id)
        room_dict = {
            "id": room.id,
            "start_time": room.start_time,
            "max_length": room.max_length,
            "host_join_time": room.host_join_time
        }
        return JsonResponse(data=room_dict)

@method_decorator(login_required, name="dispatch")
class RoomJoinView(View):
    template = 'room/join.html'

    def get(self, request, *args, **kwargs):
        room_obj = get_object_or_404(Room, pk=kwargs.get('pk'))
        is_active = True
        has_access = False
        if not room_obj.is_active:
            is_active = False
        if room_obj.room_type == Room.PUBLIC:
            has_access = True
        elif room_obj.created_by == request.user:
            has_access = True

        if room_obj.created_by == request.user:
            if not room_obj.host_join_time:
                room_obj.host_join_time = int(time())*1000
                room_obj.save()
            is_moderator = True
        if is_active and has_access:
            headers = {
            }
            payload = {
                "context": {
                    "user": {
                        "avatar": "https:/gravatar.com/avatar/abc123",
                        "name": "{} {}".format(request.user.first_name, request.user.last_name),
                        "email": request.user.email,
                        "id": request.user.profile.user_uid,
                        "p_id": str(request.user.id),
                        "room_id": str(room_obj.id)
                    },
                    "room_info": {
                        "id": str(room_obj.id),
                        "name": room_obj.name,
                        "creator": room_obj.created_by.profile.user_uid,
                        "room_type": room_obj.room_type,
                        "moderator": room_obj.created_by.profile.user_uid
                    },
                    "group": "a123-123-456-789"
                },
                "aud": JITSI_AUD,
                "iss": JITSI_ISSUER,
                "sub": "example_app_id",
                "room": room_obj.room_id,
                "exp": 1685141372
            }
            domain = 'talk.gomeeting.org'
            creator = room_obj.created_by.profile.user_uid
            token = jwt.encode(payload, "example_app_secret", algorithm='HS256', headers=headers).decode('utf-8')
            return render(request, self.template, locals())


class GuestJoinView(View):
    template = "room/join_guest.html"
    password_template = 'room/password_prompt.html'
    password_form = RoomPasswordForm

    def get(self, request, *args, **kwargs):
        room_obj = get_object_or_404(Room, room_id=kwargs.get('uid'))
        if room_obj.password:
            form = self.password_form(room=room_obj)
            return render(request, self.password_template, locals())
        return self.join_room(request, room_obj=room_obj)

    def post(self, request, *args, **kwargs):
        room_obj = get_object_or_404(Room, room_id=kwargs.get('uid'))
        if room_obj.password:
            form = self.password_form(room=room_obj, data=request.POST)
            if form.is_valid():
                return self.join_room(request, room_obj)
            return render(request, self.password_template, locals())
        return self.join_room(request, room_obj)

    def join_room(self, request, room_obj):
        is_active = True
        has_access = False
        if not room_obj.is_active:
            is_active = False
        if room_obj.room_type == Room.PUBLIC:
            has_access = True
        if is_active and has_access:
            user_uid = uuid.uuid4()
            headers = {
            }
            payload = {
                "context": {
                    "user": {
                        "avatar": "https:/gravatar.com/avatar/abc123",
                        "name": str(user_uid),
                        "email": '',
                        "id": str(user_uid),
                        "p_id": "0",
                        "room_id": str(room_obj.id)
                    },
                    "room_info": {
                        "id": str(room_obj.id),
                        "name": room_obj.name,
                        "creator": room_obj.created_by.profile.user_uid,
                        "room_type": room_obj.room_type,
                        "moderator": room_obj.created_by.profile.user_uid
                    },
                    "group": "a123-123-456-789"
                },
                "aud": JITSI_AUD,
                "iss": JITSI_ISSUER,
                "sub": "example_app_id",
                "room": room_obj.room_id,
                "exp": 1685141372
            }
            domain = 'talk.gomeeting.org'
            creator = room_obj.created_by.profile.user_uid
            token = jwt.encode(payload, "example_app_secret", algorithm='HS256', headers=headers).decode('utf-8')
            return render(request, self.template, locals())