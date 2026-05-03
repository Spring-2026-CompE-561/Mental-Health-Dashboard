"""Tests for semantic journal ratings (sentiment scoring pipeline).

Validates:
  1. compute_positivity_score() — the VADER-based scoring function itself
  2. Repository layer — scores are computed and persisted on create/update
  3. API layer — scores are returned in endpoint responses
  4. Failure mode — returns None (not a fake 5.5) when VADER is unavailable
"""

import pytest
from unittest.mock import patch

import app.services.sentiment as sentiment_mod
from app.services.sentiment import compute_positivity_score
from app.repository.journal import (
    create_journal,
    update_journal,
)


# ─── 1. Unit tests for compute_positivity_score ────────────────────────────

class TestComputePositivityScore:
    """Direct tests of the VADER scoring function."""

    def test_very_positive_text(self):
        score = compute_positivity_score(
            "I feel absolutely wonderful! Today is the best day of my life!"
        )
        assert score >= 7.0, f"Very positive text scored too low: {score}"

    def test_very_negative_text(self):
        score = compute_positivity_score(
            "I feel terrible and miserable. Everything is awful and hopeless."
        )
        assert score <= 4.0, f"Very negative text scored too high: {score}"

    def test_neutral_text(self):
        score = compute_positivity_score("I went to the store today.")
        assert 3.5 <= score <= 7.5, f"Neutral text scored outside expected range: {score}"

    def test_score_range_lower_bound(self):
        score = compute_positivity_score("worst horrible terrible awful")
        assert score >= 1.0, f"Score below minimum bound: {score}"

    def test_score_range_upper_bound(self):
        score = compute_positivity_score("best amazing wonderful excellent")
        assert score <= 10.0, f"Score above maximum bound: {score}"

    def test_empty_string_returns_neutral(self):
        score = compute_positivity_score("")
        assert 4.0 <= score <= 6.5, f"Empty string gave unexpected score: {score}"

    def test_positive_scores_higher_than_negative(self):
        pos = compute_positivity_score("I am so happy and grateful today!")
        neg = compute_positivity_score("I am so sad and angry today.")
        assert pos > neg, f"Positive ({pos}) should be higher than negative ({neg})"

    def test_return_type_is_float(self):
        score = compute_positivity_score("just a normal day")
        assert isinstance(score, float)

    def test_mixed_sentiment(self):
        score = compute_positivity_score(
            "The day started badly but ended on a wonderful note."
        )
        # Mixed sentiment — should land somewhere in the middle-to-positive range
        assert 3.0 <= score <= 8.5, f"Mixed sentiment out of range: {score}"


# ─── 2. Repository layer: scores are persisted ─────────────────────────────

class TestSentimentPersistence:
    """Verify sentiment_score is computed and saved in the DB."""

    def test_create_journal_stores_sentiment(self, db_session, registered_user):
        journal = create_journal(
            db_session,
            user_id=registered_user["id"],
            body="I am overjoyed and thankful!",
        )
        assert journal.sentiment_score is not None, "sentiment_score should not be None"
        assert isinstance(journal.sentiment_score, float)
        assert 1.0 <= journal.sentiment_score <= 10.0

    def test_create_journal_positive_body_has_high_score(self, db_session, registered_user):
        journal = create_journal(
            db_session,
            user_id=registered_user["id"],
            body="Today was amazing, I love everything about my life!",
        )
        assert journal.sentiment_score >= 7.0, (
            f"Positive journal body scored too low: {journal.sentiment_score}"
        )

    def test_create_journal_negative_body_has_low_score(self, db_session, registered_user):
        journal = create_journal(
            db_session,
            user_id=registered_user["id"],
            body="I feel so hopeless, nothing ever works out.",
        )
        assert journal.sentiment_score <= 4.0, (
            f"Negative journal body scored too high: {journal.sentiment_score}"
        )

    def test_update_journal_recomputes_sentiment(self, db_session, registered_user):
        journal = create_journal(
            db_session,
            user_id=registered_user["id"],
            body="I feel wonderful and happy!",
        )
        original_score = journal.sentiment_score

        updated = update_journal(
            db_session,
            journal,
            "I feel terrible and depressed.",
        )
        assert updated.sentiment_score is not None
        assert updated.sentiment_score < original_score, (
            f"Updated negative text ({updated.sentiment_score}) should be lower "
            f"than original positive text ({original_score})"
        )

    def test_update_journal_score_changes_with_content(self, db_session, registered_user):
        journal = create_journal(
            db_session,
            user_id=registered_user["id"],
            body="I hate this.",
        )
        low_score = journal.sentiment_score

        updated = update_journal(db_session, journal, "I love this!")
        high_score = updated.sentiment_score

        assert high_score > low_score, (
            f"'I love this!' ({high_score}) should score higher than 'I hate this.' ({low_score})"
        )


# ─── 3. API layer: scores appear in responses ──────────────────────────────

class TestSentimentInAPI:
    """Verify the API endpoints return sentiment_score in JSON responses."""

    def test_create_endpoint_returns_sentiment(self, client, auth_headers):
        resp = client.post(
            "/api/journals/create",
            json={"body": "Life is beautiful and full of joy!"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "sentiment_score" in data, "Response missing sentiment_score field"
        assert data["sentiment_score"] is not None
        assert isinstance(data["sentiment_score"], float)
        assert 1.0 <= data["sentiment_score"] <= 10.0

    def test_create_endpoint_positive_score(self, client, auth_headers):
        resp = client.post(
            "/api/journals/create",
            json={"body": "I am ecstatic! Everything is going perfectly!"},
            headers=auth_headers,
        )
        data = resp.json()
        assert data["sentiment_score"] >= 7.0, (
            f"Positive text scored too low via API: {data['sentiment_score']}"
        )

    def test_create_endpoint_negative_score(self, client, auth_headers):
        resp = client.post(
            "/api/journals/create",
            json={"body": "I feel miserable, lonely, and worthless."},
            headers=auth_headers,
        )
        data = resp.json()
        assert data["sentiment_score"] <= 4.0, (
            f"Negative text scored too high via API: {data['sentiment_score']}"
        )

    def test_get_single_journal_includes_sentiment(self, client, auth_headers):
        create_resp = client.post(
            "/api/journals/create",
            json={"body": "A peaceful calm day."},
            headers=auth_headers,
        )
        journal_id = create_resp.json()["id"]

        get_resp = client.get(f"/api/journals/{journal_id}", headers=auth_headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert "sentiment_score" in data
        assert data["sentiment_score"] is not None

    def test_get_all_journals_include_sentiment(self, client, auth_headers):
        client.post(
            "/api/journals/create",
            json={"body": "Happy entry!"},
            headers=auth_headers,
        )
        client.post(
            "/api/journals/create",
            json={"body": "Sad entry."},
            headers=auth_headers,
        )

        resp = client.get("/api/journals", headers=auth_headers)
        assert resp.status_code == 200
        journals = resp.json()
        for j in journals:
            assert "sentiment_score" in j, f"Journal {j['id']} missing sentiment_score"
            assert j["sentiment_score"] is not None

    def test_update_endpoint_returns_updated_sentiment(self, client, auth_headers):
        create_resp = client.post(
            "/api/journals/create",
            json={"body": "I feel great!"},
            headers=auth_headers,
        )
        journal_id = create_resp.json()["id"]
        original_score = create_resp.json()["sentiment_score"]

        update_resp = client.put(
            f"/api/journals/{journal_id}",
            json={"body": "I feel awful and broken."},
            headers=auth_headers,
        )
        assert update_resp.status_code == 200
        updated_score = update_resp.json()["sentiment_score"]
        assert updated_score < original_score, (
            f"Updated negative score ({updated_score}) should be less than "
            f"original positive score ({original_score})"
        )


# ─── 4. Failure mode: returns None when VADER is unavailable ───────────────

class TestSentimentFallback:
    """Verify that a missing analyzer produces None, not a fake 5.5."""

    def _reset_analyzer(self):
        """Reset the module-level cached state so each test starts fresh."""
        sentiment_mod._analyzer = None
        sentiment_mod._init_attempted = False

    def test_returns_none_when_analyzer_unavailable(self):
        self._reset_analyzer()
        with patch(
            "nltk.sentiment.vader.SentimentIntensityAnalyzer",
            side_effect=Exception("no lexicon"),
        ):
            score = sentiment_mod.compute_positivity_score("I feel great!")
        self._reset_analyzer()
        assert score is None, (
            f"Expected None when analyzer is unavailable, got {score}"
        )

    def test_does_not_retry_after_confirmed_failure(self):
        self._reset_analyzer()
        with patch(
            "nltk.sentiment.vader.SentimentIntensityAnalyzer",
            side_effect=Exception("no lexicon"),
        ) as mock_sia:
            sentiment_mod.compute_positivity_score("first call")
            sentiment_mod.compute_positivity_score("second call")
            # Should only attempt initialization once
            assert mock_sia.call_count == 1
        self._reset_analyzer()

    def test_create_journal_stores_none_when_analyzer_down(self, db_session, registered_user):
        self._reset_analyzer()
        with patch.object(sentiment_mod, "_get_analyzer", return_value=None):
            journal = create_journal(
                db_session,
                user_id=registered_user["id"],
                body="This should have no score",
            )
        self._reset_analyzer()
        assert journal.sentiment_score is None, (
            f"Expected None in DB when analyzer is down, got {journal.sentiment_score}"
        )
