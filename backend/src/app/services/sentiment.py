"""Sentiment scoring using VADER from NLTK.

The compound score returned by VADER ranges from -1 (most negative) to +1
(most positive).  We normalise this to a 1–10 integer scale so it can be
stored alongside questionnaire mood scores and displayed on the dashboard.
"""

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Download the VADER lexicon once (no-op if already present).
nltk.download("vader_lexicon", quiet=True)

_analyzer = SentimentIntensityAnalyzer()


def compute_positivity_score(text: str) -> float:
    """Return a positivity score in the range 1.0 – 10.0.

    Mapping: VADER compound  -1 → 1,  +1 → 10.
    """
    compound = _analyzer.polarity_scores(text)["compound"]
    # Linear map from [-1, 1] → [1, 10]
    score = round(((compound + 1) / 2) * 9 + 1, 1)
    # Clamp just in case of floating-point drift.
    return max(1.0, min(10.0, score))
