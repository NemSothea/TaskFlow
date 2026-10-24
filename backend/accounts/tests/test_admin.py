import pytest
from django.urls import reverse

from tasks.models import Task

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_client_with_data(client, django_user_model, make_user):
    admin_user = django_user_model.objects.create_superuser(
        "admin", "admin@example.com", "Adm1n-pass-123"
    )
    client.force_login(admin_user)
    alice = make_user("alice")
    Task.objects.create(owner=alice, title="Buy milk")
    Task.objects.create(owner=alice, title="ទិញទឹកដោះគោ")
    return client, alice


class TestUserAdmin:
    def test_user_page_lists_their_tasks(self, admin_client_with_data):
        client, alice = admin_client_with_data
        res = client.get(reverse("admin:accounts_user_change", args=[alice.pk]))
        assert res.status_code == 200
        assert "Buy milk" in res.content.decode()
        assert "ទិញទឹកដោះគោ" in res.content.decode()

    def test_user_list_links_task_count_to_filtered_tasks(self, admin_client_with_data):
        client, alice = admin_client_with_data
        res = client.get(reverse("admin:accounts_user_changelist"))
        assert res.status_code == 200
        assert f"?owner__id__exact={alice.pk}" in res.content.decode()

    def test_filtered_task_list_shows_only_that_owner(self, admin_client_with_data, make_user):
        client, alice = admin_client_with_data
        Task.objects.create(owner=make_user("bob"), title="Bob task")
        url = reverse("admin:tasks_task_changelist") + f"?owner__id__exact={alice.pk}"
        body = client.get(url).content.decode()
        assert "Buy milk" in body
        assert "Bob task" not in body


class TestTaskAdmin:
    def test_task_list_links_owner(self, admin_client_with_data):
        client, alice = admin_client_with_data
        body = client.get(reverse("admin:tasks_task_changelist")).content.decode()
        assert reverse("admin:accounts_user_change", args=[alice.pk]) in body
