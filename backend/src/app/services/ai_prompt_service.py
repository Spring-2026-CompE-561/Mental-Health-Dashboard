"""
AI-powered journal prompt generator.

Calls Groq's free-tier chat completion API with a small Llama 3 model. If no
GROQ_API_KEY is configured, or if Groq returns an error, we transparently fall
back to a curated static prompt list so the journal page never breaks.

The static fallback list is intentionally small and lives here (rather than
importing the frontend's TS list) so the backend has no cross-package dependency.
"""

from __future__ import annotations

import logging
import random
from typing import Final

import httpx

from app.core.settings import settings

logger = logging.getLogger("mental_health_api.ai_prompt")

# A handful of curated, non-AI prompts used as a fallback. Kept short on purpose.
_FALLBACK_PROMPTS: Final[list[str]] = [
    "What are three small moments from today that brought you a flicker of joy?",
    "Name one feeling sitting with you right now. Where do you notice it in your body?",
    "What's something you've been avoiding, and what would the kindest next step look like?",
    "Describe a person whose presence calms you. What about them grounds you?",
    "Write about a recent moment when you felt proud of yourself, however small.",
    "What's one thing you're carrying today that you can choose to set down for a few minutes?",
    "If your week had a weather report, what would it say — and what's behind that?",
    "Write a short letter to the version of yourself from one month ago.",
    "What are you craving more of right now: rest, connection, challenge, or quiet?",
    "Name one boundary, however small, that would protect your peace this week.",
]

_SYSTEM_PROMPT = (
    "You are a gentle, trauma-informed journaling guide. Generate ONE single "
    "open-ended journaling prompt that helps the writer reflect on their "
    "feelings, mental health, or daily experiences. Keep it warm, non-clinical, "
    "and under 25 words. Return ONLY the prompt — no quotes, no preface, no list."
)

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _fallback_prompt() -> str:
    return random.choice(_FALLBACK_PROMPTS)


async def generate_prompt() -> tuple[str, str]:
    """
    Return (prompt_text, source) where source is either 'ai' or 'fallback'.

    Never raises — any error path returns a fallback prompt so the UX is unbroken.
    """
    api_key = (settings.groq_api_key or "").strip()
    if not api_key:
        return _fallback_prompt(), "fallback"

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": "Give me one journaling prompt."},
        ],
        "temperature": 0.9,
        "max_tokens": 80,
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(
                _GROQ_URL,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
        r.raise_for_status()
        data = r.json()
        text = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
            .strip('"')
        )
        if not text:
            return _fallback_prompt(), "fallback"
        return text, "ai"
    except Exception as exc:  # pragma: no cover — exercised in tests via monkeypatch
        logger.warning("Groq prompt generation failed: %s. Using fallback.", exc)
        return _fallback_prompt(), "fallback"
