from app.repository.journal import (
    create_journal,
    delete_journal,
    get_all_journals_by_user,
    get_journal_by_id,
    update_journal,
)


class TestJournalRepository:
    def test_create_journal(self, db_session, registered_user):
        journal = create_journal(db_session, user_id=registered_user["id"], body="Today was good")
        assert journal.id is not None
        assert journal.body == "Today was good"
        assert journal.user_id == registered_user["id"]

    def test_get_journal_by_id(self, db_session, registered_user):
        journal = create_journal(db_session, user_id=registered_user["id"], body="Test entry")
        fetched = get_journal_by_id(db_session, journal.id)
        assert fetched is not None
        assert fetched.body == "Test entry"

    def test_get_journal_by_id_not_found(self, db_session):
        fetched = get_journal_by_id(db_session, 99999)
        assert fetched is None

    def test_get_all_journals_by_user(self, db_session, registered_user):
        create_journal(db_session, user_id=registered_user["id"], body="Entry 1")
        create_journal(db_session, user_id=registered_user["id"], body="Entry 2")
        journals = get_all_journals_by_user(db_session, registered_user["id"])
        assert len(journals) == 2

    def test_get_all_journals_ordered_by_date(self, db_session, registered_user):
        create_journal(db_session, user_id=registered_user["id"], body="First")
        create_journal(db_session, user_id=registered_user["id"], body="Second")
        journals = get_all_journals_by_user(db_session, registered_user["id"])
        assert len(journals) == 2

    def test_update_journal(self, db_session, registered_user):
        journal = create_journal(db_session, user_id=registered_user["id"], body="Original")
        updated = update_journal(db_session, journal, "Updated body")
        assert updated.body == "Updated body"

    def test_delete_journal(self, db_session, registered_user):
        journal = create_journal(db_session, user_id=registered_user["id"], body="To be deleted")
        jid = journal.id
        delete_journal(db_session, journal)
        assert get_journal_by_id(db_session, jid) is None


class TestJournalEndpoints:
    def test_create_journal_entry(self, client, auth_headers):
        response = client.post(
            "/api/journals/create",
            json={"body": "Today was a good day"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["body"] == "Today was a good day"

    def test_create_journal_unauthorized(self, client):
        response = client.post(
            "/api/journals/create",
            json={"body": "No auth"},
        )
        assert response.status_code == 401

    def test_get_all_journals(self, client, auth_headers):
        client.post(
            "/api/journals/create",
            json={"body": "Entry 1"},
            headers=auth_headers,
        )
        response = client.get("/api/journals/", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_get_single_journal(self, client, auth_headers):
        create_resp = client.post(
            "/api/journals/create",
            json={"body": "Single entry"},
            headers=auth_headers,
        )
        journal_id = create_resp.json()["id"]
        response = client.get(f"/api/journals/{journal_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["body"] == "Single entry"

    def test_get_journal_not_found(self, client, auth_headers):
        response = client.get("/api/journals/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_update_journal(self, client, auth_headers):
        create_resp = client.post(
            "/api/journals/create",
            json={"body": "Original body"},
            headers=auth_headers,
        )
        journal_id = create_resp.json()["id"]
        response = client.put(
            f"/api/journals/{journal_id}",
            json={"body": "Updated body"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["body"] == "Updated body"

    def test_delete_journal(self, client, auth_headers):
        create_resp = client.post(
            "/api/journals/create",
            json={"body": "To delete"},
            headers=auth_headers,
        )
        journal_id = create_resp.json()["id"]
        response = client.delete(f"/api/journals/{journal_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_delete_journal_not_found(self, client, auth_headers):
        response = client.delete("/api/journals/99999", headers=auth_headers)
        assert response.status_code == 404
