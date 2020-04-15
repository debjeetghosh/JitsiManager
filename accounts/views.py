import uuid

from django import views
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.shortcuts import render, redirect

# Create your views here.
from django.urls import reverse
from django.views import View

from accounts.forms import LoginForm, UserForm, UserProfileForm
from restrictions.models import Restrictions
from utils.helpers import get_obj, split_name


def login_view(request):
    form = LoginForm()
    return render(request, "login.html", {"form": form})

class RegisterView(View):
    form = UserForm
    profile_form = UserProfileForm
    template = "register.html"

    def get(self, request, *args, **kwargs):
        form = self.form()
        profile_form = self.profile_form()
        return render(request, self.template, locals())

    def post(self, request, *args, **kwargs):
        form = self.form(request.POST)
        profile_form = self.profile_form(request.POST)
        if form.is_valid() and profile_form.is_valid():
            user = form.save(commit=False)
            user.password = make_password(form.cleaned_data.get('password'))
            user.first_name, user.last_name = split_name(profile_form.cleaned_data.get('name'))
            user.save()

            user_profile = profile_form.save(commit=False)
            user_profile.user_uid = uuid.uuid4()
            user_profile.user = user
            user_profile.save()

            Restrictions.objects.create(
                user=user,
                max_member_count=-1,
                max_room_count=-1,
                max_time_length=-1
            )

            return redirect(reverse("accounts:login"))
        return render(request, self.template, locals())



def login_submit(request):
    if request.POST:
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')

            user = authenticate(username=username, password=password)
            email_user = get_obj(User, email=username)
            if user and getattr(user, 'is_active', False):
                login(request, user)
                if 'next' in request.GET:
                    return redirect(request.GET.get('next', '/'))
                return redirect(reverse('accounts:dashboard'))
            elif email_user and getattr(email_user, 'is_active', False):
                user = authenticate(username=email_user.username, password=password)
                if user:
                    login(request, user)
                    if 'next' in request.GET:
                        return redirect(request.GET.get('next', '/'))
                    return redirect(reverse('accounts:dashboard'))
            return render(request, "login.html", {"form": form, 'errors': "You have entered wrong username/email or password"})
        return render(request, "login.html", {"form": form, 'errors': form.errors})
    return redirect(reverse("accounts:login"))

def logout_view(request):
    logout(request)
    return redirect(reverse("accounts:login"))

@login_required
def dashboard(request):
    return render(request, 'dashboard.html', {})