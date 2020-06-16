from django.urls import path
from room.views import *

app_name = 'room'
urlpatterns = [
    path('room/create/', RoomCreateView.as_view(), name='create_room'),
    path('room/', RoomListView.as_view(), name='room_list'),
    path('room/<int:pk>/join/', RoomJoinView.as_view(), name='join_room'),
    path('room/<int:pk>/delete/', RoomDeleteView.as_view(), name='delete_room'),
    path('room/<str:uid>/join/as-guest/', GuestJoinView.as_view(), name='join_guest_room'),
    path('room/update/<int:pk>/', RoomUpdateView.as_view(), name='room_update'),
    path('room/<int:pk>/details/json/', RoomJsonDetailsView.as_view(), name="room_json_details"),
    path('room/sync_google/json/', RoomSyncGoogle.as_view(), name="room_google_sync"),
    path('room/sync_outlook/json/', RoomSyncOutlook.as_view(), name="room_outlook_sync"),
    path('room/google_calender/not_synced/json/', RoomGoogleCalenderListView.as_view(), name="room_google_calender"),
    path('room/outlook_calender/not_synced/json/', RoomOutlookCalenderListView.as_view(), name="room_outlook_calender"),
]
