from app.core.auth import hash_password, verify_password
from app.repository.user import (
    create_user,
    delete_user,
    get_user_by_email,
    get_user_by_id,
    update_user_password,
)


class TestUserRepository:
    def test_create_user(self, db_session):
        hashed = hash_password("testpass123")
        user = create_user(db_session, username="alice", email="alice@test.com", hashed_password=hashed)
        assert user.id is not None
        assert user.username == "alice"
        assert user.email == "alice@test.com"

    def test_get_user_by_id(self, db_session):
        hashed = hash_password("testpass123")
        user = create_user(db_session, username="bob", email="bob@test.com", hashed_password=hashed)
        fetched = get_user_by_id(db_session, user.id)
        assert fetched is not None
        assert fetched.email == "bob@test.com"

    def test_get_user_by_id_not_found(self, db_session):
        fetched = get_user_by_id(db_session, 99999)
        assert fetched is None

    def test_get_user_by_email(self, db_session):
        hashed = hash_password("testpass123")
        create_user(db_session, username="carol", email="carol@test.com", hashed_password=hashed)
        fetched = get_user_by_email(db_session, "carol@test.com")
        assert fetched is not None
        assert fetched.username == "carol"

    def test_get_user_by_email_not_found(self, db_session):
        fetched = get_user_by_email(db_session, "nobody@test.com")
        assert fetched is None

    def test_update_user_password(self, db_session):
        hashed = hash_password("oldpass123")
        user = create_user(db_session, username="dave", email="dave@test.com", hashed_password=hashed)
        new_hashed = hash_password("newpass456")
        updated = update_user_password(db_session, user, new_hashed)
        assert verify_password("newpass456", updated.hashed_password) is True

    def test_delete_user(self, db_session):
        hashed = hash_password("testpass123")
        user = create_user(db_session, username="eve", email="eve@test.com", hashed_password=hashed)
        uid = user.id
        delete_user(db_session, user)
        assert get_user_by_id(db_session, uid) is None
