"""Tests for the journal AI prompt endpoint and rate limiting."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch


class TestAiPromptFallback:
    """When GROQ_API_KEY is empty, the endpoint must return a curated fallback prompt."""

    def test_fallback_when_no_api_key(self, client, auth_headers):
        with patch("app.services.ai_prompt_service.settings") as mock_settings:
            mock_settings.groq_api_key = ""
            mock_settings.groq_model = "llama-3.1-8b-instant"
            resp = client.get("/api/journals/ai-prompt", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "fallback"
        assert isinstance(data["prompt"], str) and len(data["prompt"]) > 5

    def test_unauthenticated_is_rejected(self, client):
        resp = client.get("/api/journals/ai-prompt")
        assert resp.status_code == 401


class TestAiPromptGroq:
    """When GROQ_API_KEY is set, we hit Groq and return its response."""

    def test_groq_path_returns_ai_source(self, client, auth_headers):
        fake_response = {
            "choices": [
                {"message": {"content": "What does today need from you, gently?"}}
            ]
        }

        async def fake_post(*args, **kwargs):
            class _R:
                status_code = 200

                def json(self):
                    return fake_response

                def raise_for_status(self):
                    return None

            return _R()

        with patch("app.services.ai_prompt_service.settings") as mock_settings, patch(
            "app.services.ai_prompt_service.httpx.AsyncClient"
        ) as mock_client:
            mock_settings.groq_api_key = "fake-key"
            mock_settings.groq_model = "llama-3.1-8b-instant"

            instance = AsyncMock()
            instance.__aenter__.return_value = instance
            instance.__aexit__.return_value = None
            instance.post = AsyncMock(side_effect=fake_post)
            mock_client.return_value = instance

            resp = client.get("/api/journals/ai-prompt", headers=auth_headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "ai"
        assert data["prompt"] == "What does today need from you, gently?"

    def test_groq_failure_falls_back_silently(self, client, auth_headers):
        async def boom(*args, **kwargs):
            raise RuntimeError("groq is down")

        with patch("app.services.ai_prompt_service.settings") as mock_settings, patch(
            "app.services.ai_prompt_service.httpx.AsyncClient"
        ) as mock_client:
            mock_settings.groq_api_key = "fake-key"
            mock_settings.groq_model = "llama-3.1-8b-instant"

            instance = AsyncMock()
            instance.__aenter__.return_value = instance
            instance.__aexit__.return_value = None
            instance.post = AsyncMock(side_effect=boom)
            mock_client.return_value = instance

            resp = client.get("/api/journals/ai-prompt", headers=auth_headers)

        # The endpoint must NEVER 500 — it gracefully falls back.
        assert resp.status_code == 200
        assert resp.json()["source"] == "fallback"


class TestRateLimits:
    """The per-bucket rate limiter must throttle auth and AI endpoints."""

    def test_auth_bucket_throttles_after_5(self, client):
        # The auth bucket allows 5 requests / 60s. The 6th must 429.
        # We hit /login because /create-account would create real users.
        statuses = []
        for _ in range(7):
            r = client.post("/api/login", json={"email": "x@x.com", "password": "wrong"})
            statuses.append(r.status_code)
        assert 429 in statuses, f"Expected throttling on auth bucket; got {statuses}"

    def test_ai_bucket_throttles_after_10(self, client, auth_headers):
        with patch("app.services.ai_prompt_service.settings") as mock_settings:
            mock_settings.groq_api_key = ""  # always fallback path
            mock_settings.groq_model = "llama-3.1-8b-instant"

            statuses = []
            for _ in range(12):
                r = client.get("/api/journals/ai-prompt", headers=auth_headers)
                statuses.append(r.status_code)
        assert 429 in statuses, f"Expected throttling on ai bucket; got {statuses}"
