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


def _create_questionnaire(client, auth_headers, mood=7.0, depression=3.0, anxiety=3.0):
    """Helper to create a questionnaire and return the response json."""
    resp = client.post(
        "/api/questionnaires",
        json={"mood": mood, "depression": depression, "anxiety": anxiety},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


class TestCreateQuestionnaire:
    def test_create_success(self, client, registered_user, auth_headers):
        data = _create_questionnaire(client, auth_headers, mood=8.0, depression=4.0, anxiety=2.0)
        assert data["mood"] == 8.0
        assert data["depression"] == 4.0
        assert data["anxiety"] == 2.0
        assert data["score"] is not None
        assert data["user_id"] == registered_user["id"]
        assert "id" in data
        assert "created_at" in data

    def test_create_min_values(self, client, registered_user, auth_headers):
        # Score formula: (mood + (10-depression) + (10-anxiety)) / 3 * 10
        # mood=0, depression=0, anxiety=0 → (0 + 10 + 10) / 3 * 10 = 66.67
        data = _create_questionnaire(client, auth_headers, mood=0.0, depression=0.0, anxiety=0.0)
        assert data["mood"] == 0.0
        assert data["score"] == 66.67

    def test_create_max_values(self, client, registered_user, auth_headers):
        # mood=10, depression=10, anxiety=10 → (10 + 0 + 0) / 3 * 10 = 33.33
        data = _create_questionnaire(client, auth_headers, mood=10.0, depression=10.0, anxiety=10.0)
        assert data["mood"] == 10.0
        assert data["score"] == 33.33

    def test_create_mood_too_high(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/questionnaires",
            json={"mood": 11.0, "depression": 3.0, "anxiety": 3.0},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_depression_negative(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/questionnaires",
            json={"mood": 5.0, "depression": -1.0, "anxiety": 3.0},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_missing_field(self, client, registered_user, auth_headers):
        resp = client.post(
            "/api/questionnaires",
            json={"mood": 5.0},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_create_unauthenticated(self, client):
        resp = client.post(
            "/api/questionnaires",
            json={"mood": 5.0, "depression": 3.0, "anxiety": 3.0},
        )
        assert resp.status_code == 401


class TestGetAllQuestionnaires:
    def test_get_all(self, client, registered_user, auth_headers):
        _create_questionnaire(client, auth_headers, mood=6.0, depression=3.0, anxiety=3.0)
        _create_questionnaire(client, auth_headers, mood=8.0, depression=4.0, anxiety=2.0)
        resp = client.get("/api/questionnaires", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # Same-day posts trigger upsert, so the second replaces the first
        assert len(data) == 1
        assert data[0]["mood"] == 8.0

    def test_get_all_empty(self, client, registered_user, auth_headers):
        resp = client.get("/api/questionnaires", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_all_excludes_other_users(self, client, registered_user, auth_headers):
        _create_questionnaire(client, auth_headers, mood=6.0)
        _, other_headers = _register_second_user(client)
        _create_questionnaire(client, other_headers, mood=9.0)
        resp = client.get("/api/questionnaires", headers=auth_headers)
        assert len(resp.json()) == 1

    def test_get_all_unauthenticated(self, client):
        resp = client.get("/api/questionnaires")
        assert resp.status_code == 401


class TestGetSingleQuestionnaire:
    def test_get_by_id(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, mood=7.0, depression=2.0, anxiety=4.0)
        resp = client.get(f"/api/questionnaires/{created['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["mood"] == 7.0

    def test_get_not_found(self, client, registered_user, auth_headers):
        resp = client.get("/api/questionnaires/99999", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_other_users_questionnaire(self, client, registered_user, auth_headers):
        _, other_headers = _register_second_user(client)
        other_q = _create_questionnaire(client, other_headers, mood=9.0)
        resp = client.get(f"/api/questionnaires/{other_q['id']}", headers=auth_headers)
        assert resp.status_code == 403

    def test_get_unauthenticated(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers)
        resp = client.get(f"/api/questionnaires/{created['id']}")
        assert resp.status_code == 401


class TestAverageScore:
    def test_average(self, client, registered_user, auth_headers):
        _create_questionnaire(client, auth_headers, mood=6.0, depression=6.0, anxiety=6.0)
        # upsert replaces on same day, so only this one counts
        _create_questionnaire(client, auth_headers, mood=8.0, depression=8.0, anxiety=8.0)
        resp = client.get("/api/questionnaires/average", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        # score = (8 + (10-8) + (10-8))/3*10 = (8+2+2)/3*10 = 40.0
        assert data["average_score"] == 40.0

    def test_average_no_entries(self, client, registered_user, auth_headers):
        resp = client.get("/api/questionnaires/average", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["average_score"] is None

    def test_average_with_date_range(self, client, registered_user, auth_headers):
        from datetime import date

        _create_questionnaire(client, auth_headers, mood=5.0, depression=5.0, anxiety=5.0)
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
        _create_questionnaire(client, auth_headers, mood=6.0, depression=6.0, anxiety=6.0)
        _, other_headers = _register_second_user(client)
        _create_questionnaire(client, other_headers, mood=10.0, depression=10.0, anxiety=10.0)
        resp = client.get("/api/questionnaires/average", headers=auth_headers)
        # our user's score = (6 + (10-6) + (10-6))/3*10 = (6+4+4)/3*10 = 46.67
        assert resp.json()["average_score"] == 46.67

    def test_average_unauthenticated(self, client):
        resp = client.get("/api/questionnaires/average")
        assert resp.status_code == 401


class TestUpdateQuestionnaire:
    def test_update_success(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, mood=5.0, depression=5.0, anxiety=5.0)
        resp = client.put(
            f"/api/questionnaires/{created['id']}",
            json={"mood": 9.0, "depression": 2.0, "anxiety": 1.0},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["mood"] == 9.0
        assert resp.json()["depression"] == 2.0

    def test_update_not_found(self, client, registered_user, auth_headers):
        resp = client.put(
            "/api/questionnaires/99999",
            json={"mood": 5.0, "depression": 5.0, "anxiety": 5.0},
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_update_other_users_questionnaire(self, client, registered_user, auth_headers):
        _, other_headers = _register_second_user(client)
        other_q = _create_questionnaire(client, other_headers, mood=9.0)
        resp = client.put(
            f"/api/questionnaires/{other_q['id']}",
            json={"mood": 1.0, "depression": 1.0, "anxiety": 1.0},
            headers=auth_headers,
        )
        assert resp.status_code == 403

    def test_update_invalid_score(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, mood=5.0, depression=5.0, anxiety=5.0)
        resp = client.put(
            f"/api/questionnaires/{created['id']}",
            json={"mood": 15.0, "depression": 5.0, "anxiety": 5.0},
            headers=auth_headers,
        )
        assert resp.status_code == 422

    def test_update_unauthenticated(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers)
        resp = client.put(
            f"/api/questionnaires/{created['id']}",
            json={"mood": 5.0, "depression": 5.0, "anxiety": 5.0},
        )
        assert resp.status_code == 401


class TestDeleteQuestionnaire:
    def test_delete_success(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers, mood=5.0, depression=5.0, anxiety=5.0)
        resp = client.delete(f"/api/questionnaires/{created['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        get_resp = client.get(f"/api/questionnaires/{created['id']}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_delete_not_found(self, client, registered_user, auth_headers):
        resp = client.delete("/api/questionnaires/99999", headers=auth_headers)
        assert resp.status_code == 404

    def test_delete_other_users_questionnaire(self, client, registered_user, auth_headers):
        _, other_headers = _register_second_user(client)
        other_q = _create_questionnaire(client, other_headers, mood=9.0)
        resp = client.delete(f"/api/questionnaires/{other_q['id']}", headers=auth_headers)
        assert resp.status_code == 403

    def test_delete_unauthenticated(self, client, registered_user, auth_headers):
        created = _create_questionnaire(client, auth_headers)
        resp = client.delete(f"/api/questionnaires/{created['id']}")
        assert resp.status_code == 401
