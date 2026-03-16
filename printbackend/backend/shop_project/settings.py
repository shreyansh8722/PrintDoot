'''
Django settings for shop_project.

Production-safe configuration.
Environment-variable driven.
'''

from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from the backend directory (BASE_DIR)
# Try multiple locations to ensure we find the .env file
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    # Fallback: try loading from current directory
    load_dotenv(override=True)


# --------------------------------------------------
# Security
# --------------------------------------------------
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError('SECRET_KEY is not set')

DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
ALLOWED_HOSTS = [h.strip() for h in ALLOWED_HOSTS if h.strip()]

# On Railway, the hostname is dynamic — accept the Railway-provided host
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in CSRF_TRUSTED_ORIGINS if o.strip()]

# --------------------------------------------------
# Production Security Hardening
# --------------------------------------------------
# HTTPS / SSL
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# HSTS — tell browsers to always use HTTPS (1 year)
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000')) if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# Cookie security
SESSION_COOKIE_SECURE = not DEBUG          # Only send cookies over HTTPS
CSRF_COOKIE_SECURE = not DEBUG             # CSRF cookie over HTTPS only
SESSION_COOKIE_HTTPONLY = True              # JS cannot access session cookie
CSRF_COOKIE_HTTPONLY = True                 # JS cannot access CSRF cookie
SESSION_COOKIE_SAMESITE = 'Lax'            # Prevent CSRF via cross-origin
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7     # 1 week session expiry
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Security headers
SECURE_CONTENT_TYPE_NOSNIFF = True         # Prevent MIME-type sniffing
SECURE_BROWSER_XSS_FILTER = True           # Enable XSS filter in older browsers
X_FRAME_OPTIONS = 'DENY'                   # Prevent clickjacking
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Admin URL obfuscation — use env var for admin path
ADMIN_URL = os.getenv('ADMIN_URL', 'admin/')

# Prevent host header poisoning
USE_X_FORWARDED_HOST = False

# File upload limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB max upload
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 100                # Max form fields


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party
    'rest_framework',
    'corsheaders',
    'storages',

    # Local Apps
    'apps.users',
    'apps.catalog',
    'apps.designs',
    'apps.orders',
    'apps.zakeke',
    'apps.pages',
]

MIDDLEWARE = [
    'shop_project.security_middleware.RequestSizeLimitMiddleware',
    'shop_project.security_middleware.BruteForceProtectionMiddleware',
    'shop_project.security_middleware.SuspiciousActivityMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'shop_project.security_middleware.SecurityHeadersMiddleware',
]

ROOT_URLCONF = 'shop_project.urls'
WSGI_APPLICATION = 'shop_project.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Database (ENV-DRIVEN, PULL-SAFE)
# Railway provides DATABASE_URL; fall back to individual vars for local dev
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

if not DATABASE_URL and not all([
    os.getenv('DB_NAME'),
    os.getenv('DB_USER'),
    os.getenv('DB_PASSWORD'),
]):
    raise RuntimeError('Database environment variables are not fully set')


# --------------------------------------------------
# Password validation
# --------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# --------------------------------------------------
# Internationalization
# --------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True



STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise — serve static files efficiently in production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Auth
AUTH_USER_MODEL = 'users.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration
# Get CORS origins from environment variable or use defaults
cors_origins_env = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'
).split(',')

# Only include localhost origins in DEBUG mode
if DEBUG:
    default_local_origins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ]
    CORS_ALLOWED_ORIGINS = list(set(cors_origins_env + default_local_origins))
else:
    # Production: ONLY use origins from env — no localhost
    CORS_ALLOWED_ORIGINS = [o for o in cors_origins_env if 'localhost' not in o and '127.0.0.1' not in o]

# Filter out empty strings and remove trailing slashes
CORS_ALLOWED_ORIGINS = [origin.strip().rstrip('/') for origin in CORS_ALLOWED_ORIGINS if origin.strip()]

CORS_ALLOW_CREDENTIALS = True

# Restrict allowed headers and methods
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Zakeke Configuration — MUST be set via environment variables
ZAKEKE_CLIENT_ID = os.getenv('ZAKEKE_CLIENT_ID', '')
ZAKEKE_SECRET_KEY = os.getenv('ZAKEKE_SECRET_KEY', '')
ZAKEKE_WEBHOOK_SECRET = os.getenv('ZAKEKE_WEBHOOK_SECRET', '')

# Support email for contact form
SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', '')

# --------------------------------------------------
# Django REST Framework
# --------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'shop_project.authentication.BasicAuthWithoutPopup',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [] if DEBUG else [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/hour' if DEBUG else '100/hour',
        'user': '50000/hour' if DEBUG else '1000/hour',
        'register': '100/hour' if DEBUG else '5/hour',
        'login': '100/minute' if DEBUG else '10/minute',
        'password_reset': '50/hour' if DEBUG else '3/hour',
        'contact': '50/hour' if DEBUG else '5/hour',
        'order_create': '200/hour' if DEBUG else '20/hour',
        'payment': '200/hour' if DEBUG else '30/hour',
        'shipping': '200/minute' if DEBUG else '30/minute',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] if not DEBUG else [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'shop_project.exception_handler.custom_exception_handler',
}

# --------------------------------------------------
# Instamojo Configuration
# --------------------------------------------------
# SECURITY: Never hardcode credentials. Set these in your .env file.
INSTAMOJO_API_KEY = os.getenv('INSTAMOJO_API_KEY', '')
INSTAMOJO_AUTH_TOKEN = os.getenv('INSTAMOJO_AUTH_TOKEN', '')
INSTAMOJO_PRIVATE_SALT = os.getenv('INSTAMOJO_PRIVATE_SALT', '')
# Set to 'https://www.instamojo.com' for production, 'https://test.instamojo.com' for sandbox
INSTAMOJO_BASE_URL = os.getenv('INSTAMOJO_BASE_URL', 'https://www.instamojo.com')

# --------------------------------------------------
# Frontend URL (for email links)
# --------------------------------------------------
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# --------------------------------------------------
# Email Configuration
# --------------------------------------------------
# Use console backend for development (prints emails to terminal)
# Switch to SMTP for production
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@printshop.com')

# --------------------------------------------------
# Shiprocket Configuration
# --------------------------------------------------
SHIPROCKET_EMAIL = os.getenv('SHIPROCKET_EMAIL', '')
SHIPROCKET_PASSWORD = os.getenv('SHIPROCKET_PASSWORD', '')
SHIPROCKET_PICKUP_LOCATION = os.getenv('SHIPROCKET_PICKUP_LOCATION', 'Primary')
SHIPROCKET_WEBHOOK_TOKEN = os.getenv('SHIPROCKET_WEBHOOK_TOKEN', '')

# --------------------------------------------------
# Shipmozo Configuration
# --------------------------------------------------
SHIPMOZO_PUBLIC_KEY = os.getenv('SHIPMOZO_PUBLIC_KEY', '')
SHIPMOZO_PRIVATE_KEY = os.getenv('SHIPMOZO_PRIVATE_KEY', '')
STORE_PINCODE = os.getenv('STORE_PINCODE', '413512')

# --------------------------------------------------
# File Storage (S3 or Local)
# --------------------------------------------------
# Set USE_S3=True in .env to enable S3 storage for ALL media files
# (avatars, category images, design assets, invoices, print files, etc.)
USE_S3 = os.getenv('USE_S3', 'False') == 'True'

if USE_S3:
    # ── AWS S3 Core Configuration ──
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'ap-south-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None      # ACLs disabled — bucket policy controls access

    # Public media — no signed URLs (faster, cacheable)
    AWS_QUERYSTRING_AUTH = False

    # Cache headers for S3 objects (1 year — files are hashed)
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=31536000, public',
    }

    # ── Django STORAGES dict (Django 4.2+) ──
    # Default storage = public media (avatars, categories, designs, etc.)
    # Uses our custom MediaStorage with 'media/' prefix
    STORAGES = {
        "default": {
            "BACKEND": "shop_project.storage_backends.MediaStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

    # Media URL points to S3
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

# --------------------------------------------------
# Security Logging
# --------------------------------------------------
# Railway / cloud platforms have ephemeral filesystems.
# Use file handler only when running locally (DEBUG=True).
_log_handlers = {
    'console': {
        'class': 'logging.StreamHandler',
        'formatter': 'verbose',
    },
    'security_console': {
        'class': 'logging.StreamHandler',
        'formatter': 'security',
    },
}

# Add file handler only in local development
if DEBUG:
    _security_handlers = ['security_console', 'security_file']
    _log_handlers['security_file'] = {
        'class': 'logging.FileHandler',
        'filename': BASE_DIR / 'logs' / 'security.log',
        'formatter': 'security',
    }
else:
    _security_handlers = ['security_console']

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'security': {
            'format': '[{asctime}] SECURITY {levelname} {name}: {message}',
            'style': '{',
        },
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {module}: {message}',
            'style': '{',
        },
    },
    'handlers': _log_handlers,
    'loggers': {
        'security': {
            'handlers': _security_handlers,
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': _security_handlers,
            'level': 'WARNING',
            'propagate': False,
        },
        'apps.orders': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'apps.users': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}

# Create logs directory only for local dev (not needed on Railway)
if DEBUG:
    import os as _os
    _logs_dir = BASE_DIR / 'logs'
    if not _logs_dir.exists():
        _logs_dir.mkdir(parents=True, exist_ok=True)
