from django.shortcuts import redirect
from django.urls import reverse

from accounts.models import UserProfile


class OTPAuthMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.session.get('email_verified', False):
            return response
        # if request.user.is_authenticated and request.user.profile.user_type==UserProfile.ADMIN and request.path != '/verify-otp/':
        #     return redirect(reverse('accounts:verify-otp'))
        return response