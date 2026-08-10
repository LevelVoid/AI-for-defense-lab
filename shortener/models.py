from django.db import models

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
    
