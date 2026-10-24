from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncWeek
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for the current user's tasks.

    Object-level authorization is enforced by scoping the queryset to the
    requesting user: another user's task is simply not found (404), which
    also avoids leaking which IDs exist.
    """

    serializer_class = TaskSerializer
    STATS_WEEKS = 8
    filterset_fields = ["status", "priority"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at", "due_date", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        counts = dict(
            self.get_queryset()
            .values_list("status")
            .annotate(n=Count("id"))
            .values_list("status", "n")
        )
        data = {choice.value: counts.get(choice.value, 0) for choice in Task.Status}
        data["total"] = sum(data.values())
        return Response(data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Chart data for the dashboard: status per priority, weekly intake, deadlines."""
        tasks = self.get_queryset()
        today = timezone.localdate()

        pairs = tasks.values_list("priority", "status").annotate(n=Count("id"))
        counts = {(priority, status): n for priority, status, n in pairs}
        by_priority = [
            {"priority": priority}
            | {status: counts.get((priority, status), 0) for status in Task.Status.values}
            for priority in reversed(Task.Priority.values)  # high -> low
        ]

        # Last WEEKS weeks (Monday start), oldest first, zero-filled.
        this_monday = today - timedelta(days=today.weekday())
        first_monday = this_monday - timedelta(weeks=self.STATS_WEEKS - 1)
        weekly = dict(
            tasks.filter(created_at__date__gte=first_monday)
            .annotate(week=TruncWeek("created_at"))
            .values_list("week")
            .annotate(n=Count("id"))
            .values_list("week", "n")
        )
        weekly = {week.date(): n for week, n in weekly.items()}
        created_per_week = [
            {"week_start": monday.isoformat(), "count": weekly.get(monday, 0)}
            for monday in (first_monday + timedelta(weeks=i) for i in range(self.STATS_WEEKS))
        ]

        open_tasks = tasks.exclude(status=Task.Status.DONE)
        sunday = this_monday + timedelta(days=6)
        deadlines = open_tasks.aggregate(
            overdue=Count("id", filter=Q(due_date__lt=today)),
            due_this_week=Count("id", filter=Q(due_date__gte=today, due_date__lte=sunday)),
        )

        return Response(
            {"by_priority": by_priority, "created_per_week": created_per_week, **deadlines}
        )
