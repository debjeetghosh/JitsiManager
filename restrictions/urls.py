from django.urls import path
from .views import *

app_name = 'restrictions'
urlpatterns = [
    path('restriction/', RestrictionListView.as_view(), name='restriction_list'),
    path('restriction/update/<int:pk>/', RestrictionUpdateView.as_view(), name='restriction_update'),
]
