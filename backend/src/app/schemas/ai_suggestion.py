"""Pydantic schemas for AI-generated mood suggestions."""

from __future__ import annotations

from pydantic import BaseModel


class MoodSuggestionItem(BaseModel):
    emoji: str
    title: str
    body: str


class MoodSuggestionsResponse(BaseModel):
    heading: str
    color: str
    suggestions: list[MoodSuggestionItem]
    source: str
