from django.conf import settings
from django.db import models


class TaskStatus(models.TextChoices):
    TODO = "todo", "To do"
    IN_PROGRESS = "in_progress", "In progress"
    DONE = "done", "Done"


class TaskPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"


class Task(models.Model):
    Status = TaskStatus
    Priority = TaskPriority

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["owner", "due_date"]),
            models.Index(fields=["owner", "-created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(title=""),
                name="task_title_not_empty",
            ),
            models.CheckConstraint(
                condition=models.Q(status__in=[c.value for c in TaskStatus]),
                name="task_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(priority__in=[c.value for c in TaskPriority]),
                name="task_priority_valid",
            ),
        ]

    def __str__(self):
        return self.title
