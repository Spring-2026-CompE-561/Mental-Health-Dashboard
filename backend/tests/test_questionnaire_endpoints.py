from app.core.auth import create_access_token


def _register_second_user(client):
    """Create a second user and return (user_data, auth_headers)."""
    resp = client.post(
        "/api/create-account",
        json={
            "username": "otheruser",
            "email": "other@example.com",
            "password": "OtherPass123",
        },
    )
    user = resp.json()
    token = create_access_token(data={"sub": str(user["id"])})
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


def _create_questionnaire(client, auth_headers, score=75.0):
    """Helper to create a questionnaire and return the response json."""
    resp = client.post(
        "/api/questionnaires/",
        json={"score": score},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    return resp.json()


class TestCreateQuestionnaire:
    def test_create_success(self, client, registered_user, auth_headers):
        data = _create_questionnaire(client, auth_headers, score=85.0)
        assert data["score"] == 85.0
        assert data["user_id"] == registered_user["id"]
        assert "id" in data
        assert "created_at" in data

    def test_create_score_zero(self, client, registered_user, auth_headers):
        data = _create_questionnaire(client, auth_headers, score=0.0)
        assert data["score"] == 0.0

    def test_create_score_hundred(self, client, registered_user, auth_headers):
        data = _create_questionnaire(client, auth_headers, score=100.0)
        assert data["score"] == 100.0

    def test_create_score_too_high(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/questionnaires/",
            json={"score": 101.0},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_score_negative(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/questionnaires/",
            json={"score": -1.0},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_missing_score(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/questionnaires/",
            json={},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_unauthenticated(self, client):
        resp = client.post("/api/questionnaires/", json={"score": 50.0})
        assert resp.status_code == 401


class TestGetAllQuestionnaires:
    def test_get_all(self, client, registered_user, auth_headers):
        _create_questionnaire(client, auth_headers, score=60.0)
        _create_questionnaire(client, auth_headers, score=80.0)
        resp = client.get("/api/questionnaires/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_get_all_empty(self, client, registered_user, auth_headers):
        resp = client.get("/api/questionnaires/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_all_excludes_other_users(self, client, registered_user, auth_headers):
        _create_questionnaire(client, auth_headers, score=60.0)
        _, other_headers = _register_second_user(client)
        _create_questionnaire(client, other_headers, score=90.0)
        resp = client.get("/api/questionnaires/", headers=auth_headers)
        assert len(resp.json()) == 1

    def test_get_all_unauthenticated(self, client):
        resp = client.get("/api/questionnaires/")
        assert resp.status_code == 401


class TestGetSingleQuestionnaire:
    def test_get_by_id(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, score=72.0)
        resp = client.get(f"/api/questionnaires/{created['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["score"] == 72.0

    def test_get_not_found(self, client, registered_user, auth_headers):
        resp = client.get("/api/questionnaires/99999", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_other_users_questionnaire(self, client, registered_user, auth_headers):
        _, other_headers = _register_second_user(client)
        other_q = _create_questionnaire(client, other_headers, score=90.0)
        resp = client.get(f"/api/questionnaires/{other_q['id']}", headers=auth_headers)
        assert resp.status_code == 403

    def test_get_unauthenticated(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers)
        resp = client.get(f"/api/questionnaires/{created['id']}")
        assert resp.status_code == 401


class TestAverageScore:
    def test_average(self, client, registered_user, auth_headers):
        _create_questionnaire(client, auth_headers, score=60.0)
        _create_questionnaire(client, auth_headers, score=80.0)
        resp = client.get("/api/questionnaires/average", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["average_score"] == 70.0

    def test_average_no_entries(self, client, registered_user, auth_headers):
        resp = client.get("/api/questionnaires/average", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["average_score"] is None

    def test_average_with_date_range(self, client, registered_user, auth_headers):
        from datetime import date

        _create_questionnaire(client, auth_headers, score=50.0)
        _create_questionnaire(client, auth_headers, score=90.0)
        today = date.today().isoformat()
        resp = client.get(
            f"/api/questionnaires/average?from_date={today}&to_date={today}",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["average_score"] is not None
        assert data["from_date"] == today
        assert data["to_date"] == today

    def test_average_excludes_other_users(self, client, registered_user, auth_headers):
        _create_questionnaire(client, auth_headers, score=60.0)
        _, other_headers = _register_second_user(client)
        _create_questionnaire(client, other_headers, score=100.0)
        resp = client.get("/api/questionnaires/average", headers=auth_headers)
        assert resp.json()["average_score"] == 60.0

    def test_average_unauthenticated(self, client):
        resp = client.get("/api/questionnaires/average")
        assert resp.status_code == 401


class TestUpdateQuestionnaire:
    def test_update_success(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, score=50.0)
        resp = client.put(
            f"/api/questionnaires/{created['id']}",
            json={"score": 95.0},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["score"] == 95.0

    def test_update_not_found(self, client, registered_user, auth_headers):
        resp = client.put(
            "/api/questionnaires/99999",
            json={"score": 50.0},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_update_other_users_questionnaire(self, client, registered_user, auth_headers):
        _, other_headers = _register_second_user(client)
        other_q = _create_questionnaire(client, other_headers, score=90.0)
        resp = client.put(
            f"/api/questionnaires/{other_q['id']}",
            json={"score": 10.0},
            headers=auth_headers,
        )
        assert resp.status_code == 403

    def test_update_invalid_score(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, score=50.0)
        resp = client.put(
            f"/api/questionnaires/{created['id']}",
            json={"score": 150.0},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_update_unauthenticated(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers)
        resp = client.put(
            f"/api/questionnaires/{created['id']}",
            json={"score": 50.0},
        )
        assert resp.status_code == 401


class TestDeleteQuestionnaire:
    def test_delete_success(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, score=50.0)
        resp = client.delete(f"/api/questionnaires/{created['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        # Confirm it's gone
        get_resp = client.get(f"/api/questionnaires/{created['id']}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_delete_not_found(self, client, registered_user, auth_headers):
        resp = client.delete("/api/questionnaires/99999", headers=auth_headers)
        assert resp.status_code == 404

    def test_delete_other_users_questionnaire(self, client, registered_user, auth_headers):
        _, other_headers = _register_second_user(client)
        other_q = _create_questionnaire(client, other_headers, score=90.0)
        resp = client.delete(f"/api/questionnaires/{other_q['id']}", headers=auth_headers)
        assert resp.status_code == 403

    def test_delete_unauthenticated(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers)
        resp = client.delete(f"/api/questionnaires/{created['id']}")
        assert resp.status_code == 401
