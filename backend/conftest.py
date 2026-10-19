import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    # Throttle counters live in the cache; reset so tests stay independent.
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def make_user(django_user_model):
    def _make(username="alice", password="S3cure-pass-123", **extra):
        extra.setdefault("email", f"{username}@example.com")
        return django_user_model.objects.create_user(username=username, password=password, **extra)

    return _make


@pytest.fixture
def auth_client(make_user):
    """Return (client, user) authenticated with a real access token."""
    from rest_framework_simplejwt.tokens import RefreshToken

    def _auth(user=None):
        user = user or make_user()
        client = APIClient()
        token = RefreshToken.for_user(user).access_token
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client, user

    return _auth
