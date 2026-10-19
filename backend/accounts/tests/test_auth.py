import pytest
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

PASSWORD = "S3cure-pass-123"
COOKIE = settings.REFRESH_COOKIE_NAME


def login(client, username="alice", password=PASSWORD):
    return client.post(
        reverse("login"), {"username": username, "password": password}, format="json"
    )


def csrf_client():
    return APIClient(enforce_csrf_checks=True)


def csrf_headers(client):
    return {"HTTP_X_CSRFTOKEN": client.cookies["csrftoken"].value}


class TestRegister:
    def test_creates_user_without_returning_password(self, api_client):
        res = api_client.post(
            reverse("register"),
            {"username": "bob", "email": "Bob@Example.com", "password": PASSWORD},
            format="json",
        )
        assert res.status_code == 201
        assert "password" not in res.data
        assert res.data["email"] == "bob@example.com"

    def test_rejects_weak_password(self, api_client):
        res = api_client.post(
            reverse("register"),
            {"username": "bob", "email": "bob@example.com", "password": "123"},
            format="json",
        )
        assert res.status_code == 400

    def test_rejects_duplicate_email_case_insensitive(self, api_client, make_user):
        make_user("alice", email="alice@example.com")
        res = api_client.post(
            reverse("register"),
            {"username": "alice2", "email": "ALICE@example.com", "password": PASSWORD},
            format="json",
        )
        assert res.status_code == 400
        assert "email" in res.data


class TestLogin:
    def test_returns_access_and_sets_httponly_refresh_cookie(self, api_client, make_user):
        make_user()
        res = login(api_client)
        assert res.status_code == 200
        assert "access" in res.data
        assert "refresh" not in res.data  # never exposed to JavaScript
        cookie = res.cookies[COOKIE]
        assert cookie["httponly"]
        assert cookie["path"] == settings.REFRESH_COOKIE_PATH
        assert cookie["samesite"] == "Lax"

    def test_wrong_password_is_401(self, api_client, make_user):
        make_user()
        res = login(api_client, password="wrong-password")
        assert res.status_code == 401

    def test_login_is_throttled(self, api_client, make_user):
        make_user()
        statuses = [login(api_client, password="nope").status_code for _ in range(11)]
        assert statuses[-1] == 429


class TestRefreshAndLogout:
    def test_refresh_requires_csrf(self, make_user):
        make_user()
        client = csrf_client()
        login(client)
        res = client.post(reverse("token-refresh"))
        assert res.status_code == 403

    def test_refresh_rotates_and_blacklists_old_token(self, make_user):
        make_user()
        client = csrf_client()
        login(client)
        old_refresh = client.cookies[COOKIE].value

        res = client.post(reverse("token-refresh"), **csrf_headers(client))
        assert res.status_code == 200
        assert "access" in res.data
        assert client.cookies[COOKIE].value != old_refresh

        # Replaying the old refresh token must fail.
        client.cookies[COOKIE] = old_refresh
        res = client.post(reverse("token-refresh"), **csrf_headers(client))
        assert res.status_code == 401

    def test_refresh_without_cookie_is_401(self, make_user):
        make_user()
        client = csrf_client()
        login(client)
        del client.cookies[COOKIE]
        res = client.post(reverse("token-refresh"), **csrf_headers(client))
        assert res.status_code == 401

    def test_logout_blacklists_refresh_token(self, make_user):
        make_user()
        client = csrf_client()
        login(client)
        refresh = client.cookies[COOKIE].value

        res = client.post(reverse("logout"), **csrf_headers(client))
        assert res.status_code == 204

        client.cookies[COOKIE] = refresh
        res = client.post(reverse("token-refresh"), **csrf_headers(client))
        assert res.status_code == 401


class TestMe:
    def test_requires_authentication(self, api_client):
        assert api_client.get(reverse("me")).status_code == 401

    def test_returns_current_user(self, auth_client):
        client, user = auth_client()
        res = client.get(reverse("me"))
        assert res.status_code == 200
        assert res.data == {"id": user.id, "username": user.username, "email": user.email}
