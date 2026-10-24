from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from tasks.models import Task

DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "taskflow-demo-123"

# (title, description, status, priority, due date offset in days or None)
SAMPLE_TASKS = [
    ("Plan sprint backlog", "Pick the top stories for next sprint.", "todo", "high", 2),
    (
        "Fix login error message",
        "Show a clearer message for wrong credentials.",
        "in_progress",
        "high",
        0,
    ),
    (
        "Write ERD documentation",
        "Diagram the current schema and growth plan.",
        "done",
        "medium",
        -3,
    ),
    ("Renew TLS certificate", "Staging certificate expired last week.", "todo", "high", -2),
    ("Update dependencies", "", "todo", "low", 14),
    ("Review pull requests", "Two PRs waiting on review.", "in_progress", "medium", 1),
    ("រៀបចំកិច្ចប្រជុំប្រចាំសប្តាហ៍", "រៀបចំរបៀបវារៈ និងផ្ញើការអញ្ជើញ។", "todo", "medium", 5),
    ("បកប្រែទំព័រការកំណត់", "", "done", "low", None),
    (
        "Set up error monitoring",
        "Send backend exceptions to an alerting tool.",
        "todo",
        "medium",
        None,
    ),
    ("Load test the task list", "Check query count with 10k tasks.", "todo", "low", 21),
    (
        "Clean up test users",
        "Remove leftover e2e accounts from the dev database.",
        "done",
        "low",
        -1,
    ),
    (
        "Prepare demo for the team",
        "Walk through login, filters and Khmer UI.",
        "in_progress",
        "medium",
        3,
    ),
]


# Days ago each sample task was "created", so the weekly chart has history to show.
CREATED_DAYS_AGO = [45, 40, 33, 30, 26, 22, 19, 15, 11, 8, 4, 1]
assert len(CREATED_DAYS_AGO) == len(SAMPLE_TASKS)


class Command(BaseCommand):
    help = "Create or reset the local demo user with sample tasks. Only runs with DEBUG=True."

    def add_arguments(self, parser):
        parser.add_argument("--password", default=DEMO_PASSWORD, help="Password for the demo user.")
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete the demo user's existing tasks and recreate the samples.",
        )

    @transaction.atomic
    def handle(self, *args, password, reset, **options):
        # The default password is public, so never create this account outside local development.
        if not settings.DEBUG:
            raise CommandError("seed_demo only runs with DEBUG=True.")

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=DEMO_USERNAME, defaults={"email": DEMO_EMAIL}
        )
        user.is_active = True
        user.set_password(password)
        user.save()

        if reset:
            user.tasks.all().delete()

        added = 0
        if not user.tasks.exists():
            today = timezone.localdate()
            tasks = Task.objects.bulk_create(
                Task(
                    owner=user,
                    title=title,
                    description=description,
                    status=status,
                    priority=priority,
                    due_date=None if offset is None else today + timedelta(days=offset),
                )
                for title, description, status, priority, offset in SAMPLE_TASKS
            )
            # created_at is auto_now_add, so backdate with update() after inserting.
            now = timezone.now()
            for task, days_ago in zip(tasks, CREATED_DAYS_AGO, strict=True):
                Task.objects.filter(pk=task.pk).update(created_at=now - timedelta(days=days_ago))
            added = len(SAMPLE_TASKS)

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(f"{action} user '{DEMO_USERNAME}' and added {added} sample tasks.")
        )
        self.stdout.write(f"Log in with username '{DEMO_USERNAME}' and password '{password}'.")
