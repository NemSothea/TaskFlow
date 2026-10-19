import pytest
from django.db import IntegrityError

from tasks.models import Task

pytestmark = pytest.mark.django_db


def test_db_rejects_empty_title(make_user):
    with pytest.raises(IntegrityError):
        Task.objects.create(owner=make_user(), title="")


def test_db_rejects_unknown_status(make_user):
    with pytest.raises(IntegrityError):
        Task.objects.create(owner=make_user(), title="x", status="archived")


def test_tasks_deleted_with_owner(make_user):
    user = make_user()
    Task.objects.create(owner=user, title="x")
    user.delete()
    assert Task.objects.count() == 0
