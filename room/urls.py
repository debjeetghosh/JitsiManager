from django.urls import path
from room.views import *

app_name = 'room'
urlpatterns = [
    path('room/create/', RoomCreateView.as_view(), name='create_room'),
    path('room/', RoomListView.as_view(), name='room_list'),
    path('room/<int:pk>/join/', RoomJoinView.as_view(), name='join_room'),
    path('room/update/<int:pk>/', RoomUpdateView.as_view(), name='room_update'),
]
