from django.db.models import Count
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
