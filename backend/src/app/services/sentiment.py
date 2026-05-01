"""Sentiment scoring using VADER from NLTK.

The compound score returned by VADER ranges from -1 (most negative) to +1
(most positive).  We normalise this to a 1-10 integer scale so it can be
stored alongside questionnaire mood scores and displayed on the dashboard.
"""

import logging

logger = logging.getLogger(__name__)

_analyzer = None


def _get_analyzer():
    """Lazy-load the VADER analyzer so the module imports cleanly even without the lexicon."""
    global _analyzer
    if _analyzer is not None:
        return _analyzer
    try:
        import nltk
        from nltk.sentiment.vader import SentimentIntensityAnalyzer

        nltk.download("vader_lexicon", quiet=True)
        _analyzer = SentimentIntensityAnalyzer()
    except Exception as exc:
        logger.warning("VADER sentiment analyzer unavailable: %s", exc)
        _analyzer = None
    return _analyzer


def compute_positivity_score(text: str) -> float:
    """Return a positivity score in the range 1.0 - 10.0.

    Mapping: VADER compound  -1 -> 1,  +1 -> 10.
    Falls back to a neutral score of 5.5 if the analyzer is not available.
    """
    analyzer = _get_analyzer()
    if analyzer is None:
        return 5.5

    compound = analyzer.polarity_scores(text)["compound"]
    # Linear map from [-1, 1] to [1, 10]
    score = round(((compound + 1) / 2) * 9 + 1, 1)
    # Clamp just in case of floating-point drift
    return max(1.0, min(10.0, score))
