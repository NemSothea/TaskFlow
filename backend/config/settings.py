"""Django settings for TaskFlow.

All environment-specific values come from environment variables (or a local
`.env` file in development). See `.env.example` for the full list.
"""

from datetime import timedelta
from pathlib import Path

import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
    CORS_ALLOWED_ORIGINS=(list, []),
    CSRF_TRUSTED_ORIGINS=(list, []),
    SECURE_COOKIES=(bool, True),
    SECURE_SSL_REDIRECT=(bool, False),
    SECURE_HSTS_SECONDS=(int, 0),
    BEHIND_TLS_PROXY=(bool, False),
    ACCESS_TOKEN_MINUTES=(int, 5),
    REFRESH_TOKEN_DAYS=(int, 7),
    AUTH_THROTTLE_RATE=(str, "10/min"),
    REFRESH_THROTTLE_RATE=(str, "30/min"),
)
environ.Env.read_env(BASE_DIR / ".env")

PLACEHOLDER_SECRET_KEYS = {"change-me"}


def require_strong_secret_key(key: str) -> str:
    """Refuse empty, placeholder or short keys so a copied .env.example cannot run."""
    if key in PLACEHOLDER_SECRET_KEYS or len(key) < 32:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY is missing, a placeholder, or shorter than 32 characters. "
            'Generate one with: uv run python -c "from django.core.management.utils '
            'import get_random_secret_key as g; print(g())"'
        )
    return key


# SECRET_KEY has no default on purpose: the app must not start with a guessable key.
SECRET_KEY = require_strong_secret_key(env("DJANGO_SECRET_KEY"))
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "accounts",
    "tasks",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["CONN_MAX_AGE"] = 60

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Django REST Framework ---------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "tasks.pagination.StandardPagination",
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    # Only throttles views that declare a `throttle_scope` (login, register, refresh).
    # Refresh has its own bucket so failed logins cannot block session renewal.
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "auth": env("AUTH_THROTTLE_RATE"),
        "auth_refresh": env("REFRESH_THROTTLE_RATE"),
    },
    "UNICODE_JSON": True,
}

# --- JWT ---------------------------------------------------------------------
# Access token: short-lived, kept in browser memory only.
# Refresh token: rotated on every use, old one blacklisted, stored in an
# httpOnly cookie scoped to the auth endpoints (see accounts/cookies.py).

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env("ACCESS_TOKEN_MINUTES")),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env("REFRESH_TOKEN_DAYS")),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

REFRESH_COOKIE_NAME = "taskflow_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth/"

# --- Cookies, CORS, CSRF -----------------------------------------------------
# The frontend is expected to be served from the same origin as the API
# (Vite proxy in development, reverse proxy in production). CORS is only
# needed if you deliberately host them on different origins.

SECURE_COOKIES = env("SECURE_COOKIES")
SESSION_COOKIE_SECURE = SECURE_COOKIES
CSRF_COOKIE_SECURE = SECURE_COOKIES
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True

# --- HTTPS hardening (production) --------------------------------------------

SECURE_SSL_REDIRECT = env("SECURE_SSL_REDIRECT")
SECURE_HSTS_SECONDS = env("SECURE_HSTS_SECONDS")
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
# Only trust X-Forwarded-Proto when a proxy you control strips client-supplied values.
if env("BEHIND_TLS_PROXY"):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# --- Logging -----------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "{asctime} {levelname} {name} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.request": {"level": "WARNING"},
    },
}
