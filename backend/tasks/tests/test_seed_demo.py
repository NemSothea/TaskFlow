import pytest
from django.core.management import CommandError, call_command
from django.urls import reverse
from django.utils import timezone

from tasks.management.commands.seed_demo import DEMO_PASSWORD, SAMPLE_TASKS
from tasks.models import Task

pytestmark = pytest.mark.django_db


@pytest.fixture
def debug_on(settings):
    settings.DEBUG = True


class TestSeedDemo:
    def test_refuses_without_debug(self, settings, django_user_model):
        settings.DEBUG = False
        with pytest.raises(CommandError):
            call_command("seed_demo")
        assert not django_user_model.objects.filter(username="demo").exists()

    def test_demo_user_can_log_in(self, debug_on, api_client):
        call_command("seed_demo")
        res = api_client.post(
            reverse("login"), {"username": "demo", "password": DEMO_PASSWORD}, format="json"
        )
        assert res.status_code == 200
        assert Task.objects.filter(owner__username="demo").count() == len(SAMPLE_TASKS)

    def test_resets_password_of_existing_user(self, debug_on, api_client, make_user):
        make_user("demo", password="forgotten-Pass-987")
        call_command("seed_demo", password="new-Pass-456")
        res = api_client.post(
            reverse("login"), {"username": "demo", "password": "new-Pass-456"}, format="json"
        )
        assert res.status_code == 200

    def test_keeps_existing_tasks_without_reset(self, debug_on, make_user):
        user = make_user("demo")
        Task.objects.create(owner=user, title="My own task")
        call_command("seed_demo")
        assert list(user.tasks.values_list("title", flat=True)) == ["My own task"]

    def test_reset_replaces_tasks(self, debug_on, make_user):
        user = make_user("demo")
        Task.objects.create(owner=user, title="My own task")
        call_command("seed_demo", reset=True)
        assert user.tasks.count() == len(SAMPLE_TASKS)
        assert not user.tasks.filter(title="My own task").exists()

    def test_does_not_touch_other_users(self, debug_on, make_user):
        other = make_user("alice")
        Task.objects.create(owner=other, title="Alice task")
        call_command("seed_demo", reset=True)
        assert other.tasks.count() == 1

    def test_spreads_creation_dates_over_past_weeks(self, debug_on):
        call_command("seed_demo")
        created = Task.objects.filter(owner__username="demo").values_list("created_at", flat=True)
        weeks = {moment.isocalendar()[:2] for moment in created}
        assert len(weeks) >= 6
        assert max(created) <= timezone.now()
