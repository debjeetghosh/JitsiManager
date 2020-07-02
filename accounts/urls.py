from django.urls import path
from accounts.views import *

app_name = 'accounts'
urlpatterns = [
    # path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('verify-otp/', VerifyOtpView.as_view(), name='verify-otp'),
    path('logout/', logout_view, name='logout'),
    path('login/submit/', login_submit, name='login_submit'),
    path('create/creator/', CreateUserView.as_view(), name="create_creator"),
    path('create/admin/', CreateAdminView.as_view(), name="create_admin"),
    path('admins/', AdminListView.as_view(), name="admin_list"),
    path('creator/<int:pk>/delete/', DeleteUserView.as_view(), name="delete_creator"),
    path('user/<int:pk>/update/', UpdateUserPassword.as_view(), name="update_user_password"),
    path('admins/<int:pk>/update/', AdminUpdateView.as_view(), name="admin_update"),
    path('', dashboard, name='dashboard'),
    path('calender/', calender_view, name='calendar'),
    path('directorySearch/', directorySearch, name='directorySearch'),
    path('profile/own/', own_profile_details,name='own_profile_details'),
    path('password-change/own/', own_password_change,name='own_password_change'),

]
