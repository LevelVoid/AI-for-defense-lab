from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class ShortURL(models.Model):
    short_code = models.CharField(
        max_length=16,
        unique=True
    )

    original_url = models.URLField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

class User(AbstractUser):
    owner = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="short_urls",
    )
