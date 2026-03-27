from datetime import date, timedelta

from app.core.auth import hash_password
from app.repository.questionnaire import (
    create_questionnaire,
    delete_questionnaire,
    get_average_score,
    get_questionnaire_by_id,
    get_questionnaires_by_user,
    update_questionnaire,
)
from app.repository.user import create_user


def _make_user(db_session, email="q_user@test.com"):
    hashed = hash_password("testpass123")
    return create_user(db_session, username="quser", email=email, hashed_password=hashed)


class TestCreateQuestionnaire:
    def test_create_questionnaire(self, db_session):
        user = _make_user(db_session)
        q = create_questionnaire(db_session, user_id=user.id, score=75.0)
        assert q.id is not None
        assert q.user_id == user.id
        assert q.score == 75.0
        assert q.created_at == date.today()

    def test_create_questionnaire_boundary_scores(self, db_session):
        user = _make_user(db_session)
        low = create_questionnaire(db_session, user_id=user.id, score=0.0)
        high = create_questionnaire(db_session, user_id=user.id, score=100.0)
        assert low.score == 0.0
        assert high.score == 100.0


class TestGetQuestionnaire:
    def test_get_by_id(self, db_session):
        user = _make_user(db_session)
        q = create_questionnaire(db_session, user_id=user.id, score=60.0)
        fetched = get_questionnaire_by_id(db_session, q.id)
        assert fetched is not None
        assert fetched.id == q.id
        assert fetched.score == 60.0

    def test_get_by_id_not_found(self, db_session):
        fetched = get_questionnaire_by_id(db_session, 99999)
        assert fetched is None

    def test_get_by_user(self, db_session):
        user = _make_user(db_session)
        create_questionnaire(db_session, user_id=user.id, score=50.0)
        create_questionnaire(db_session, user_id=user.id, score=70.0)
        results = get_questionnaires_by_user(db_session, user_id=user.id)
        assert len(results) == 2

    def test_get_by_user_empty(self, db_session):
        user = _make_user(db_session)
        results = get_questionnaires_by_user(db_session, user_id=user.id)
        assert results == []

    def test_get_by_user_excludes_other_users(self, db_session):
        user1 = _make_user(db_session, email="user1@test.com")
        user2 = _make_user(db_session, email="user2@test.com")
        create_questionnaire(db_session, user_id=user1.id, score=80.0)
        create_questionnaire(db_session, user_id=user2.id, score=90.0)
        results = get_questionnaires_by_user(db_session, user_id=user1.id)
        assert len(results) == 1
        assert results[0].score == 80.0


class TestAverageScore:
    def test_average_score(self, db_session):
        user = _make_user(db_session)
        create_questionnaire(db_session, user_id=user.id, score=60.0)
        create_questionnaire(db_session, user_id=user.id, score=80.0)
        avg = get_average_score(db_session, user_id=user.id)
        assert avg == 70.0

    def test_average_score_no_entries(self, db_session):
        user = _make_user(db_session)
        avg = get_average_score(db_session, user_id=user.id)
        assert avg is None

    def test_average_score_single_entry(self, db_session):
        user = _make_user(db_session)
        create_questionnaire(db_session, user_id=user.id, score=85.0)
        avg = get_average_score(db_session, user_id=user.id)
        assert avg == 85.0

    def test_average_score_with_date_filter(self, db_session):
        user = _make_user(db_session)
        today = date.today()
        yesterday = today - timedelta(days=1)

        q1 = create_questionnaire(db_session, user_id=user.id, score=60.0)
        q1.created_at = yesterday
        db_session.commit()

        create_questionnaire(db_session, user_id=user.id, score=80.0)

        # Only today
        avg = get_average_score(db_session, user_id=user.id, from_date=today)
        assert avg == 80.0

        # Only yesterday
        avg = get_average_score(db_session, user_id=user.id, to_date=yesterday)
        assert avg == 60.0

        # Full range
        avg = get_average_score(db_session, user_id=user.id, from_date=yesterday, to_date=today)
        assert avg == 70.0


class TestUpdateQuestionnaire:
    def test_update_score(self, db_session):
        user = _make_user(db_session)
        q = create_questionnaire(db_session, user_id=user.id, score=50.0)
        updated = update_questionnaire(db_session, q, 95.0)
        assert updated.score == 95.0
        assert updated.id == q.id

    def test_update_persists(self, db_session):
        user = _make_user(db_session)
        q = create_questionnaire(db_session, user_id=user.id, score=50.0)
        update_questionnaire(db_session, q, 75.0)
        fetched = get_questionnaire_by_id(db_session, q.id)
        assert fetched.score == 75.0


class TestDeleteQuestionnaire:
    def test_delete(self, db_session):
        user = _make_user(db_session)
        q = create_questionnaire(db_session, user_id=user.id, score=50.0)
        qid = q.id
        delete_questionnaire(db_session, q)
        assert get_questionnaire_by_id(db_session, qid) is None

    def test_delete_does_not_affect_others(self, db_session):
        user = _make_user(db_session)
        q1 = create_questionnaire(db_session, user_id=user.id, score=50.0)
        q2 = create_questionnaire(db_session, user_id=user.id, score=70.0)
        delete_questionnaire(db_session, q1)
        assert get_questionnaire_by_id(db_session, q2.id) is not None
