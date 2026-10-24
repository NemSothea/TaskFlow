from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html

from tasks.models import Task

from .models import User


class TaskInline(admin.TabularInline):
    """Shows the user's tasks on their page. Edit a task through its own link."""

    model = Task
    fields = ["title", "status", "priority", "due_date", "created_at"]
    readonly_fields = fields
    extra = 0
    show_change_link = True
    can_delete = False
    ordering = ["-created_at"]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [TaskInline]
    list_display = ["username", "email", "task_count", "is_staff", "date_joined"]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_task_count=Count("tasks"))

    @admin.display(description="Tasks", ordering="_task_count")
    def task_count(self, obj):
        # Link to the task list filtered by owner, which paginates for users with many tasks.
        url = reverse("admin:tasks_task_changelist") + f"?owner__id__exact={obj.pk}"
        return format_html('<a href="{}">{}</a>', url, obj._task_count)
