"""Integration tests that verify the complete frontend-to-backend flow.

These tests simulate real user workflows: creating an account, logging in,
writing journals, submitting mood scores, and verifying that the API
returns properly formatted data for the frontend.
"""

import pytest


class TestUserRegistrationFlow:
    """Full registration + login + profile retrieval flow."""

    def test_register_then_login(self, client):
        # Step 1: register
        register_resp = client.post(
            "/api/create-account",
            json={
                "username": "flowuser",
                "email": "flow@example.com",
                "password": "StrongPass99",
            },
        )
        assert register_resp.status_code == 201
        user_data = register_resp.json()
        assert user_data["username"] == "flowuser"
        assert user_data["email"] == "flow@example.com"
        assert "id" in user_data

        # Step 2: login with the new credentials
        login_resp = client.post(
            "/api/login",
            json={"email": "flow@example.com", "password": "StrongPass99"},
        )
        assert login_resp.status_code == 200
        token_data = login_resp.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        # Step 3: fetch the user profile with the token
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        me_resp = client.get("/api/users/me", headers=headers)
        assert me_resp.status_code == 200
        profile = me_resp.json()
        assert profile["email"] == "flow@example.com"
        assert profile["username"] == "flowuser"

    def test_duplicate_email_blocked(self, client):
        client.post(
            "/api/create-account",
            json={"username": "first", "email": "dup@example.com", "password": "Password123"},
        )
        dup_resp = client.post(
            "/api/create-account",
            json={"username": "second", "email": "dup@example.com", "password": "Password456"},
        )
        assert dup_resp.status_code in (400, 409)

    def test_invalid_login_credentials(self, client, registered_user):
        resp = client.post(
            "/api/login",
            json={"email": "test@example.com", "password": "WrongPassword99"},
        )
        assert resp.status_code == 401


class TestJournalIntegration:
    """Complete CRUD lifecycle for journal entries."""

    def test_create_read_update_delete_journal(self, client, auth_headers):
        # Create
        create_resp = client.post(
            "/api/journals/create",
            json={"body": "Today was productive and uplifting."},
            headers=auth_headers,
        )
        assert create_resp.status_code == 201
        journal = create_resp.json()
        journal_id = journal["id"]
        assert journal["body"] == "Today was productive and uplifting."
        assert "created_at" in journal

        # Read all
        list_resp = client.get("/api/journals", headers=auth_headers)
        assert list_resp.status_code == 200
        entries = list_resp.json()
        assert len(entries) == 1
        assert entries[0]["id"] == journal_id

        # Read one
        get_resp = client.get(f"/api/journals/{journal_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["body"] == "Today was productive and uplifting."

        # Update
        update_resp = client.put(
            f"/api/journals/{journal_id}",
            json={"body": "Updated: even better than I thought."},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["body"] == "Updated: even better than I thought."

        # Delete
        del_resp = client.delete(f"/api/journals/{journal_id}", headers=auth_headers)
        assert del_resp.status_code == 200

        # Verify deletion
        list_after = client.get("/api/journals", headers=auth_headers)
        assert len(list_after.json()) == 0

    def test_journal_requires_auth(self, client):
        resp = client.get("/api/journals")
        assert resp.status_code == 401


class TestQuestionnaireIntegration:
    """Full mood tracking workflow."""

    def test_submit_and_retrieve_mood(self, client, auth_headers):
        # Submit mood score
        submit_resp = client.post(
            "/api/questionnaires",
            json={"mood": 8, "depression": 4, "anxiety": 3},
            headers=auth_headers,
        )
        assert submit_resp.status_code in (200, 201)
        entry = submit_resp.json()
        assert entry["mood"] == 8
        assert entry["depression"] == 4
        assert entry["anxiety"] == 3

        # Retrieve today's entry
        today_resp = client.get("/api/questionnaires/today", headers=auth_headers)
        assert today_resp.status_code == 200
        today = today_resp.json()
        assert today["mood"] == 8

        # Update via upsert (post again on same day)
        update_resp = client.post(
            "/api/questionnaires",
            json={"mood": 6, "depression": 2, "anxiety": 2},
            headers=auth_headers,
        )
        assert update_resp.status_code in (200, 201)

        # Check updated value
        today_after = client.get("/api/questionnaires/today", headers=auth_headers)
        assert today_after.json()["mood"] == 6

    def test_list_questionnaires_returns_array(self, client, auth_headers):
        client.post(
            "/api/questionnaires",
            json={"mood": 7, "depression": 3, "anxiety": 3},
            headers=auth_headers,
        )
        resp = client.get("/api/questionnaires", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_average_endpoint(self, client, auth_headers):
        client.post(
            "/api/questionnaires",
            json={"mood": 5, "depression": 5, "anxiety": 5},
            headers=auth_headers,
        )
        resp = client.get("/api/questionnaires/average", headers=auth_headers)
        assert resp.status_code == 200


class TestSecurityHeaders:
    """Verify that security headers are present on responses."""

    def test_security_headers_on_root(self, client):
        resp = client.get("/")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-XSS-Protection") == "1; mode=block"
        assert "Strict-Transport-Security" in resp.headers
        assert "Referrer-Policy" in resp.headers

    def test_cors_headers_present(self, client):
        resp = client.options(
            "/api/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        # CORS preflight should return 200
        assert resp.status_code == 200


class TestHealthCheck:
    """Root endpoint health check."""

    def test_root_returns_ok(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
