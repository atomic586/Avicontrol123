"""
Django settings for AVICONTROL project.
<<<<<<< HEAD
Sistema de Gestión Avícola - Backend
"""
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
=======
Sistema de Gestión Avícola - configuración principal.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))

# Ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

<<<<<<< HEAD
# ============================================
# SEGURIDAD
# ============================================
SECRET_KEY = config('SECRET_KEY', default='cambiar-en-produccion')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost', cast=Csv())

# ============================================
# APPS INSTALADAS
# ============================================
INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceros
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'strawberry_django',

    # App del proyecto
    'avicontrol',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
=======

# ============================================
# SEGURIDAD
# ============================================
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-fallback")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")


# ============================================
# APLICACIONES
# ============================================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Terceros
    "corsheaders",
    "rest_framework",
    "strawberry_django",

    # Propias
    "avicontrol",
]


# ============================================
# MIDDLEWARE
# ============================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # Debe ir arriba
    "django.middleware.security.SecurityMiddleware",
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
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
            ],
        },
    },
]

<<<<<<< HEAD
WSGI_APPLICATION = 'config.wsgi.application'
=======
WSGI_APPLICATION = "config.wsgi.application"


>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
# ============================================
# BASE DE DATOS (PostgreSQL)
# ============================================
DATABASES = {
<<<<<<< HEAD
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='avicontrol_db'),
        'USER': config('DB_USER', default='avicontrol_user'),
        'PASSWORD': config('DB_PASSWORD', default='9053'),
        'HOST': config('DB_HOST', default='127.0.0.1'),
        'PORT': config('DB_PORT', default='5432'),
        'OPTIONS': {
            'options': '-c client_encoding=utf8'
        },
    }
}

=======
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "avicontrol_db"),
        "USER": os.getenv("DB_USER", "avicontrol_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}


>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
# ============================================
# VALIDACIÓN DE CONTRASEÑAS
# ============================================
AUTH_PASSWORD_VALIDATORS = [
<<<<<<< HEAD
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================
# INTERNACIONALIZACIÓN
# ============================================
LANGUAGE_CODE = 'es-bo'
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True

# ============================================
# ARCHIVOS ESTÁTICOS Y MEDIA
# ============================================
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================
# CORS (para permitir al frontend React en :5173)
# ============================================
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True

=======
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ============================================
# INTERNACIONALIZACIÓN
# ============================================
LANGUAGE_CODE = "es-bo"
TIME_ZONE = "America/La_Paz"
USE_I18N = True
USE_TZ = True


# ============================================
# ARCHIVOS ESTÁTICOS
# ============================================
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"


# ============================================
# CLAVE PRIMARIA POR DEFECTO
# ============================================
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================
# CORS (para el frontend en :5173)
# ============================================
CORS_ALLOWED_ORIGINS = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True


>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
# ============================================
# DJANGO REST FRAMEWORK + JWT
# ============================================
REST_FRAMEWORK = {
<<<<<<< HEAD
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=config('JWT_ACCESS_MINUTES', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_DAYS', default=7, cast=int)),
    'SIGNING_KEY': config('JWT_SECRET', default=SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
=======
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

from datetime import timedelta
JWT_ACCESS_MIN = int(os.getenv("JWT_ACCESS_LIFETIME_MINUTES", "60"))
JWT_REFRESH_DAYS = int(os.getenv("JWT_REFRESH_LIFETIME_DAYS", "7"))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=JWT_ACCESS_MIN),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_DAYS),
    "SIGNING_KEY": os.getenv("JWT_SECRET", SECRET_KEY),
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
}

# ============================================
# MODELO DE USUARIO PERSONALIZADO (AVICONTROL)
# ============================================
<<<<<<< HEAD
AUTH_USER_MODEL = 'avicontrol.Usuario'

# ============================================
# PERSONALIZACIÓN DEL ADMIN (AVICONTROL)
# ============================================
ADMIN_SITE_HEADER = 'AVICONTROL - Administración'
ADMIN_SITE_TITLE = 'AVICONTROL Admin'
ADMIN_INDEX_TITLE = 'Panel de Gestión Avícola'
# Confianza CSRF para el frontend de React
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
=======
AUTH_USER_MODEL = "avicontrol.Usuario"
>>>>>>> f3fbb1f (feat: estructura inicial AVICONTROL (backend Django+GraphQL, frontend React+Tailwind))
