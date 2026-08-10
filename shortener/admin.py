from django.contrib import admin

from .models import ShortURL


@admin.register(ShortURL)
class ShortURLAdmin(admin.ModelAdmin):
    list_display = (
        "short_code",
        "original_url",
        "owner",
        "is_active",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "is_active",
        "created_at",
    )

    search_fields = (
        "short_code",
        "original_url",
    )

    ordering = ("-created_at",)