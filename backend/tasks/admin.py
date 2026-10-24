from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "owner_link", "status", "priority", "due_date", "created_at"]
    list_filter = ["status", "priority"]
    search_fields = ["title", "description", "owner__username", "owner__email"]
    list_select_related = ["owner"]
    autocomplete_fields = ["owner"]

    @admin.display(description="Owner", ordering="owner__username")
    def owner_link(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.owner_id])
        return format_html('<a href="{}">{}</a>', url, obj.owner.username)
