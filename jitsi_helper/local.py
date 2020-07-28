from .settings import * 
DATABASES = {
    "default": {
        "ENGINE":  "django.db.backends.sqlite3",
        "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
        "USER": "user",
        "PASSWORD": "password",
        "HOST": "localhost",
        "PORT":  "5432",
    }
}

SITE_URL = "https://talk.gomeeting.org:8000"
VIDEO_URL = "talk.gomeeting.org"