from accounts.models import UserProfile


def is_user_admin(user):
    return user.profile.user_type == UserProfile.ADMIN
