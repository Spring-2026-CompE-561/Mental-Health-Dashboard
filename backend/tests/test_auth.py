from jose import jwt

from app.core.auth import create_access_token, hash_password, verify_password
from app.core.settings import settings


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        hashed = hash_password("mypassword")
        assert isinstance(hashed, str)
        assert hashed != "mypassword"

    def test_verify_correct_password(self):
        hashed = hash_password("correctpassword")
        assert verify_password("correctpassword", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correctpassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_different_hashes_for_same_password(self):
        h1 = hash_password("samepassword")
        h2 = hash_password("samepassword")
        assert h1 != h2


class TestJWT:
    def test_create_access_token_structure(self):
        token = create_access_token(data={"sub": "42"})
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert payload["sub"] == "42"
        assert "exp" in payload

    def test_token_contains_custom_data(self):
        token = create_access_token(data={"sub": "99", "role": "admin"})
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert payload["sub"] == "99"
        assert payload["role"] == "admin"
