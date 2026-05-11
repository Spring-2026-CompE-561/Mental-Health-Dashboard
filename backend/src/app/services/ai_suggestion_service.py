"""AI-powered mood suggestion generator using Groq.

Calls Groq to produce personalised mood suggestions based on the user's
daily questionnaire scores. Results are cached in the database so a given
user only triggers one Groq call per day.  On any failure the service
returns the same hardcoded 3-tier suggestions the frontend used to show.
"""

from __future__ import annotations

import json
import logging

import httpx
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.repository.ai_suggestion import create_suggestion, get_suggestion_for_today

logger = logging.getLogger("mental_health_api.ai_suggestions")

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

_SYSTEM_PROMPT = (
    "You are a compassionate mental-health wellness assistant. "
    "The user just completed a daily check-in with three scores (0-10 scale): "
    "mood, depression, and anxiety, plus a combined wellness score (0-100). "
    "Based on their scores, generate personalised, actionable suggestions.\n\n"
    "Return ONLY valid JSON with this exact structure:\n"
    "{\n"
    '  "heading": "A short encouraging heading (under 12 words)",\n'
    '  "suggestions": [\n'
    "    {\n"
    '      "emoji": "one emoji",\n'
    '      "title": "short title (2-5 words)",\n'
    '      "body": "one sentence of actionable advice"\n'
    "    }\n"
    "  ]\n"
    "}\n\n"
    "Provide exactly 3-4 suggestions. Be warm, non-clinical, and practical. "
    "No markdown, no code fences, no explanation — JSON only."
)

# ──────────────────────────────────────────────────────────
# Hardcoded fallback (matches the original frontend logic)
# ──────────────────────────────────────────────────────────

_FALLBACK_HIGH = {
    "heading": "You're doing great! Keep it up",
    "color": "#b2f9c8",
    "suggestions": [
        {
            "emoji": "\U0001f4d3",
            "title": "Journal your wins",
            "body": "Write down what's going well — it reinforces positive patterns.",
        },
        {
            "emoji": "\U0001f9d8",
            "title": "Keep your routine",
            "body": "Consistency is key. Maintain the habits that are working for you.",
        },
        {
            "emoji": "\U0001f91d",
            "title": "Support someone else",
            "body": "Reach out to a friend or family member who might need a boost.",
        },
    ],
}

_FALLBACK_MID = {
    "heading": "You're managing — here are some tips",
    "color": "#b2def9",
    "suggestions": [
        {
            "emoji": "\U0001f6b6",
            "title": "Take a short walk",
            "body": "Even 10 minutes outside can lift your mood significantly.",
        },
        {
            "emoji": "\U0001f4a7",
            "title": "Stay hydrated",
            "body": "Dehydration affects mood more than most people realize.",
        },
        {
            "emoji": "\U0001f4d3",
            "title": "Write it out",
            "body": "Journaling your thoughts can help you process what you're feeling.",
        },
        {
            "emoji": "\U0001f634",
            "title": "Prioritize sleep",
            "body": "Aim for 7–8 hours tonight — sleep has a huge impact on mood.",
        },
    ],
}

_FALLBACK_LOW = {
    "heading": "It's okay to have hard days — you're not alone",
    "color": "#f9b2d7",
    "suggestions": [
        {
            "emoji": "\U0001fab1",
            "title": "Try box breathing",
            "body": "Inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times.",
        },
        {
            "emoji": "\U0001f4de",
            "title": "Reach out to someone",
            "body": "Talk to a friend, family member, or counselor about how you feel.",
        },
        {
            "emoji": "\U0001f6c1",
            "title": "Do something kind for yourself",
            "body": "A warm shower, your favourite meal, or a short rest.",
        },
        {
            "emoji": "\U0001f3e5",
            "title": "Consider professional support",
            "body": "If low scores persist, speaking to a mental health professional can really help.",
        },
    ],
}


def _fallback_for_score(score: float) -> dict:
    if score >= 70:
        return {**_FALLBACK_HIGH, "source": "fallback"}
    if score >= 40:
        return {**_FALLBACK_MID, "source": "fallback"}
    return {**_FALLBACK_LOW, "source": "fallback"}


def _color_for_score(score: float) -> str:
    if score >= 70:
        return "#b2f9c8"
    if score >= 40:
        return "#b2def9"
    return "#f9b2d7"


async def get_mood_suggestions(
    db: Session,
    user_id: int,
    mood: float,
    depression: float,
    anxiety: float,
    score: float,
) -> dict:
    cached = get_suggestion_for_today(db, user_id, "mood")
    if cached:
        try:
            data = json.loads(cached.content)
            data["source"] = cached.source
            return data
        except json.JSONDecodeError:
            pass

    api_key = (settings.groq_api_key or "").strip()
    if not api_key:
        result = _fallback_for_score(score)
        create_suggestion(db, user_id, "mood", json.dumps(result), "fallback")
        return result

    user_msg = (
        f"My scores today: mood={mood}/10, depression={depression}/10, "
        f"anxiety={anxiety}/10, combined wellness score={score}/100."
    )

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.7,
        "max_tokens": 400,
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(
                _GROQ_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
        r.raise_for_status()
        raw = r.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
        parsed = json.loads(raw)
        result = {
            "heading": parsed.get("heading", "Here are some suggestions"),
            "color": _color_for_score(score),
            "suggestions": parsed.get("suggestions", [])[:4],
            "source": "ai",
        }
        create_suggestion(db, user_id, "mood", json.dumps(result), "ai")
        return result
    except Exception as exc:
        logger.warning("Groq mood suggestions failed: %s. Using fallback.", exc)
        result = _fallback_for_score(score)
        create_suggestion(db, user_id, "mood", json.dumps(result), "fallback")
        return result
