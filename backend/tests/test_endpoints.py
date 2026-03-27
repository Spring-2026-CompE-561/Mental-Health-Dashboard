
class TestCreateAccount:
    def test_create_account_success(self, client):
        resp = client.post(
            "/api/create-account",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "StrongPass123",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert data["username"] == "newuser"
        assert "id" in data

    def test_create_account_duplicate_email(self, client, registered_user):
        resp = client.post(
            "/api/create-account",
            json={
                "username": "another",
                "email": "test@example.com",
                "password": "StrongPass123",
            },
        )
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"]

    def test_create_account_invalid_email(self, client):
        resp = client.post(
            "/api/create-account",
            json={
                "username": "baduser",
                "email": "not-an-email",
                "password": "StrongPass123",
            },
        )
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, registered_user):
        resp = client.post(
            "/api/login",
            json={"email": "test@example.com", "password": "SecurePass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, registered_user):
        resp = client.post(
            "/api/login",
            json={"email": "test@example.com", "password": "WrongPassword"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post(
            "/api/login",
            json={"email": "ghost@example.com", "password": "whatever"},
        )
        assert resp.status_code == 401


class TestLogout:
    def test_logout_success(self, client):
        resp = client.post("/api/logout")
        assert resp.status_code == 200
        assert resp.json()["success"] is True


class TestGetUser:
    def test_get_me_authenticated(self, client, registered_user, auth_headers):
        resp = client.get("/api/users/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "test@example.com"

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code == 401

    def test_get_me_bad_token(self, client):
        resp = client.get(
            "/api/users/me", headers={"Authorization": "Bearer invalid-token"}
        )
        assert resp.status_code == 401

    def test_get_user_by_id(self, client, registered_user):
        uid = registered_user["id"]
        resp = client.get(f"/api/users/{uid}")
        assert resp.status_code == 200
        assert resp.json()["id"] == uid

    def test_get_user_not_found(self, client):
        resp = client.get("/api/users/99999")
        assert resp.status_code == 404


class TestChangePassword:
    def test_change_password_success(self, client, registered_user, auth_headers):
        uid = registered_user["id"]
        resp = client.put(
            f"/api/users/{uid}",
            json={"current_password": "SecurePass123", "new_password": "NewSecure456"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_change_password_wrong_current(self, client, registered_user, auth_headers):
        uid = registered_user["id"]
        resp = client.put(
            f"/api/users/{uid}",
            json={"current_password": "WrongOldPass", "new_password": "NewSecure456"},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_change_password_too_short(self, client, registered_user, auth_headers):
        uid = registered_user["id"]
        resp = client.put(
            f"/api/users/{uid}",
            json={"current_password": "SecurePass123", "new_password": "short"},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_change_password_wrong_user(self, client, registered_user, auth_headers):
        resp = client.put(
            "/api/users/9999",
            json={"current_password": "SecurePass123", "new_password": "NewSecure456"},
            headers=auth_headers,
        )
        assert resp.status_code == 403


class TestDeleteAccount:
    def test_delete_account_success(self, client, registered_user, auth_headers):
        uid = registered_user["id"]
        resp = client.request(
            "DELETE",
            f"/api/users/{uid}",
            json={"password": "SecurePass123"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_delete_account_wrong_password(self, client, registered_user, auth_headers):
        uid = registered_user["id"]
        resp = client.request(
            "DELETE",
            f"/api/users/{uid}",
            json={"password": "WrongPassword"},
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_delete_wrong_user(self, client, registered_user, auth_headers):
        resp = client.request(
            "DELETE",
            "/api/users/9999",
            json={"password": "SecurePass123"},
            headers=auth_headers,
        )
        assert resp.status_code == 403


class TestHealthCheck:
    def test_root_health_check(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
