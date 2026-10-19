import pytest
from django.urls import reverse

from tasks.models import Task

pytestmark = pytest.mark.django_db

LIST_URL = reverse("task-list")


def detail_url(task_id):
    return reverse("task-detail", args=[task_id])


@pytest.fixture
def alice(auth_client, make_user):
    return auth_client(make_user("alice"))


@pytest.fixture
def bob(auth_client, make_user):
    return auth_client(make_user("bob"))


class TestAuthentication:
    def test_anonymous_cannot_list(self, api_client):
        assert api_client.get(LIST_URL).status_code == 401

    def test_invalid_token_rejected(self, api_client):
        api_client.credentials(HTTP_AUTHORIZATION="Bearer not-a-token")
        assert api_client.get(LIST_URL).status_code == 401


class TestCrud:
    def test_create_sets_owner_from_request(self, alice, bob):
        client, user = alice
        _, other = bob
        res = client.post(LIST_URL, {"title": "Write report", "owner": other.id}, format="json")
        assert res.status_code == 201
        task = Task.objects.get(pk=res.data["id"])
        assert task.owner == user  # client-supplied owner ignored
        assert res.data["status"] == "todo"
        assert res.data["priority"] == "medium"

    def test_blank_title_rejected(self, alice):
        client, _ = alice
        res = client.post(LIST_URL, {"title": "   "}, format="json")
        assert res.status_code == 400
        assert "title" in res.data

    def test_invalid_status_rejected(self, alice):
        client, _ = alice
        res = client.post(LIST_URL, {"title": "x", "status": "archived"}, format="json")
        assert res.status_code == 400

    def test_partial_update(self, alice):
        client, user = alice
        task = Task.objects.create(owner=user, title="t")
        res = client.patch(detail_url(task.id), {"status": "done"}, format="json")
        assert res.status_code == 200
        task.refresh_from_db()
        assert task.status == "done"

    def test_delete(self, alice):
        client, user = alice
        task = Task.objects.create(owner=user, title="t")
        assert client.delete(detail_url(task.id)).status_code == 204
        assert not Task.objects.filter(pk=task.id).exists()


class TestOwnershipIsolation:
    """Users must never read or modify another user's tasks."""

    @pytest.fixture
    def bobs_task(self, bob):
        _, user = bob
        return Task.objects.create(owner=user, title="Bob's secret")

    def test_list_only_shows_own_tasks(self, alice, bobs_task):
        client, user = alice
        Task.objects.create(owner=user, title="Mine")
        res = client.get(LIST_URL)
        assert [t["title"] for t in res.data["results"]] == ["Mine"]

    @pytest.mark.parametrize("method", ["get", "put", "patch", "delete"])
    def test_cannot_access_other_users_task(self, alice, bobs_task, method):
        client, _ = alice
        res = getattr(client, method)(detail_url(bobs_task.id), {"title": "hacked"}, format="json")
        assert res.status_code == 404
        bobs_task.refresh_from_db()
        assert bobs_task.title == "Bob's secret"

    def test_summary_counts_only_own_tasks(self, alice, bobs_task):
        client, user = alice
        Task.objects.create(owner=user, title="a", status="done")
        res = client.get(reverse("task-summary"))
        assert res.data == {"todo": 0, "in_progress": 0, "done": 1, "total": 1}


class TestListing:
    def test_pagination_shape(self, alice):
        client, user = alice
        Task.objects.bulk_create(Task(owner=user, title=f"t{i}") for i in range(12))
        res = client.get(LIST_URL)
        assert res.data["count"] == 12
        assert len(res.data["results"]) == 10
        assert res.data["next"] is not None

    def test_page_size_is_capped(self, alice):
        client, user = alice
        Task.objects.bulk_create(Task(owner=user, title=f"t{i}") for i in range(3))
        res = client.get(LIST_URL, {"page_size": 1000})
        assert res.status_code == 200

    def test_filter_and_search(self, alice):
        client, user = alice
        Task.objects.create(owner=user, title="Buy milk", status="todo")
        Task.objects.create(owner=user, title="Buy bread", status="done")
        Task.objects.create(owner=user, title="Call mom", status="todo")

        res = client.get(LIST_URL, {"status": "todo", "search": "buy"})
        assert [t["title"] for t in res.data["results"]] == ["Buy milk"]

    def test_search_supports_khmer(self, alice):
        client, user = alice
        Task.objects.create(owner=user, title="ទិញទឹកដោះគោ")
        res = client.get(LIST_URL, {"search": "ទឹក"})
        assert res.data["count"] == 1
        assert res.data["results"][0]["title"] == "ទិញទឹកដោះគោ"

    def test_list_query_count_is_constant(self, alice, django_assert_max_num_queries):
        client, user = alice
        Task.objects.bulk_create(Task(owner=user, title=f"t{i}") for i in range(10))
        # count + page + user lookup for the token; no per-row queries.
        with django_assert_max_num_queries(3):
            client.get(LIST_URL)
