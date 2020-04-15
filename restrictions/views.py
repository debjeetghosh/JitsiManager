from django.contrib.auth.decorators import login_required
from django.shortcuts import render

# Create your views here.
from django.urls import reverse, reverse_lazy
from django.utils.decorators import method_decorator
from django.views.generic import ListView, UpdateView

from restrictions.forms import RestrictionForm
from restrictions.models import Restrictions


@method_decorator(login_required, name="dispatch")
class RestrictionListView(ListView):
    model = Restrictions
    template_name = 'restrictions/list.html'

    def get_queryset(self):
        return self.model.objects.filter(user__is_staff=False, user__is_superuser=False)

@method_decorator(login_required, name="dispatch")
class RestrictionUpdateView(UpdateView):
    model = Restrictions
    form_class = RestrictionForm
    template_name = 'restrictions/update.html'

    def get_object(self, queryset=None):
        return self.model.objects.get(pk=self.kwargs.get('pk'))

    def get_success_url(self):
        return '/restriction/'

