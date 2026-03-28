from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import HTTPException

from app.models.user import User
from app.services.google_oauth_service import (
    exchange_code_for_token,
    get_google_auth_url,
    get_google_user_info,
    google_login,
)

FAKE_GOOGLE_USER = {
    "id": "google-uid-123",
    "email": "googleuser@gmail.com",
    "name": "Google User",
}


class TestGetGoogleAuthUrl:
    def test_returns_google_url(self):
        url = get_google_auth_url()
        parsed = urlparse(url)
        assert parsed.scheme == "https"
        assert parsed.hostname == "accounts.google.com"

    def test_includes_required_params(self):
        url = get_google_auth_url()
        params = parse_qs(urlparse(url).query)
        assert params["response_type"] == ["code"]
        assert "openid" in params["scope"][0]
        assert "email" in params["scope"][0]


class TestExchangeCodeForToken:
    @patch("app.services.google_oauth_service.httpx.post")
    def test_success(self, mock_post):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"access_token": "fake-access-token"},
        )
        token = exchange_code_for_token("auth-code-123")
        assert token == "fake-access-token"

    @patch("app.services.google_oauth_service.httpx.post")
    def test_google_returns_error(self, mock_post):
        mock_post.return_value = MagicMock(status_code=400)
        with pytest.raises(HTTPException) as exc_info:
            exchange_code_for_token("bad-code")
        assert exc_info.value.status_code == 400
        assert "Failed to exchange" in exc_info.value.detail

    @patch("app.services.google_oauth_service.httpx.post")
    def test_no_access_token_in_response(self, mock_post):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"error": "something_went_wrong"},
        )
        with pytest.raises(HTTPException) as exc_info:
            exchange_code_for_token("auth-code")
        assert exc_info.value.status_code == 400
        assert "No access token" in exc_info.value.detail


class TestGetGoogleUserInfo:
    @patch("app.services.google_oauth_service.httpx.get")
    def test_success(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: FAKE_GOOGLE_USER,
        )
        info = get_google_user_info("fake-token")
        assert info["email"] == "googleuser@gmail.com"
        assert info["id"] == "google-uid-123"

    @patch("app.services.google_oauth_service.httpx.get")
    def test_google_returns_error(self, mock_get):
        mock_get.return_value = MagicMock(status_code=401)
        with pytest.raises(HTTPException) as exc_info:
            get_google_user_info("expired-token")
        assert exc_info.value.status_code == 400
        assert "Failed to fetch user info" in exc_info.value.detail


class TestGoogleLogin:
    @patch("app.services.google_oauth_service.get_google_user_info")
    @patch("app.services.google_oauth_service.exchange_code_for_token")
    def test_new_user_created(self, mock_exchange, mock_userinfo, db_session):
        mock_exchange.return_value = "fake-access-token"
        mock_userinfo.return_value = FAKE_GOOGLE_USER

        result = google_login("auth-code", db_session)

        assert "access_token" in result
        assert result["token_type"] == "bearer"
        user = db_session.query(User).filter(User.email == "googleuser@gmail.com").first()
        assert user is not None
        assert user.oauth_provider == "google"
        assert user.google_oauth_id == "google-uid-123"
        assert user.username == "Google User"

    @patch("app.services.google_oauth_service.get_google_user_info")
    @patch("app.services.google_oauth_service.exchange_code_for_token")
    def test_existing_google_user_returns_token(self, mock_exchange, mock_userinfo, db_session):
        mock_exchange.return_value = "fake-access-token"
        mock_userinfo.return_value = FAKE_GOOGLE_USER

        # First login creates the user
        google_login("auth-code", db_session)
        # Second login finds existing user
        result = google_login("auth-code-2", db_session)

        assert "access_token" in result
        users = db_session.query(User).filter(User.email == "googleuser@gmail.com").all()
        assert len(users) == 1

    @patch("app.services.google_oauth_service.get_google_user_info")
    @patch("app.services.google_oauth_service.exchange_code_for_token")
    def test_existing_email_user_found(self, mock_exchange, mock_userinfo, db_session):
        mock_exchange.return_value = "fake-access-token"
        mock_userinfo.return_value = FAKE_GOOGLE_USER

        # Create a password-based user with the same email
        from app.repository.user import create_user

        create_user(db_session, username="existing", email="googleuser@gmail.com", hashed_password="hashed")

        result = google_login("auth-code", db_session)

        assert "access_token" in result
        users = db_session.query(User).filter(User.email == "googleuser@gmail.com").all()
        assert len(users) == 1

    @patch("app.services.google_oauth_service.get_google_user_info")
    @patch("app.services.google_oauth_service.exchange_code_for_token")
    def test_missing_email_raises_error(self, mock_exchange, mock_userinfo, db_session):
        mock_exchange.return_value = "fake-access-token"
        mock_userinfo.return_value = {"id": "123", "name": "No Email"}

        with pytest.raises(HTTPException) as exc_info:
            google_login("auth-code", db_session)
        assert exc_info.value.status_code == 400
        assert "Could not retrieve" in exc_info.value.detail

    @patch("app.services.google_oauth_service.get_google_user_info")
    @patch("app.services.google_oauth_service.exchange_code_for_token")
    def test_missing_google_id_raises_error(self, mock_exchange, mock_userinfo, db_session):
        mock_exchange.return_value = "fake-access-token"
        mock_userinfo.return_value = {"email": "test@gmail.com", "name": "No ID"}

        with pytest.raises(HTTPException) as exc_info:
            google_login("auth-code", db_session)
        assert exc_info.value.status_code == 400


class TestGoogleOAuthEndpoints:
    @patch("app.services.google_oauth_service.httpx.post")
    @patch("app.services.google_oauth_service.httpx.get")
    def test_callback_returns_token(self, mock_get, mock_post, client):
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"access_token": "google-token"},
        )
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: FAKE_GOOGLE_USER,
        )
        resp = client.get("/api/auth/google/callback?code=test-auth-code")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_callback_missing_code(self, client):
        resp = client.get("/api/auth/google/callback")
        assert resp.status_code == 422

    def test_login_url_returns_google_url(self, client):
        resp = client.get("/api/auth/google/login")
        assert resp.status_code == 200
        data = resp.json()
        assert "url" in data
        assert "accounts.google.com" in data["url"]
