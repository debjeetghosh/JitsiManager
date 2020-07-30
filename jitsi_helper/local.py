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

GOOGLE_API_KEY = 'AIzaSyDTXgC5Ll9bhz1gpBfrhUP2HGN539w8JCI'
GOOGLE_CLIENT_ID = '110448409460-2vm0cnh7pdo6i2o30rac7929413vl1tm.apps.googleusercontent.com'

MICROSOFT_CLIENT_ID = '5b005403-dd7b-4872-be03-435a9a9d43f3'