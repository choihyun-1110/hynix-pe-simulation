"""Adapter utilities for nvidia/Nemotron-Personas-Korea.

The dataset stores rich Korean prose persona fields, but it does not expose a
separate structured name column. In practice, the name usually appears in text
as patterns like "전기태 씨는 ...". This module parses that name and carries it
into the compact actor persona used by the simulator.
"""

from __future__ import annotations

import ast
import re
from collections import Counter
from typing import Any, Iterable

DATASET_ID = "nvidia/Nemotron-Personas-Korea"

TEXT_FIELDS: tuple[str, ...] = (
    "professional_persona",
    "sports_persona",
    "arts_persona",
    "travel_persona",
    "culinary_persona",
    "family_persona",
    "persona",
    "cultural_background",
    "skills_and_expertise",
    "hobbies_and_interests",
    "career_goals_and_ambitions",
)

LIST_FIELDS: tuple[str, ...] = (
    "skills_and_expertise_list",
    "hobbies_and_interests_list",
)

# Strong signal: Korean full name followed by an honorific.
HONORIFIC_NAME_RE = re.compile(
    r"(?<![가-힣])([가-힣]{2,4})\s*(?:선생님|씨|님|군|양)(?=[은는이가께도와과를을,\.\s]|$)"
)

# Weak fallback: name at the beginning of a sentence followed by a topic/subject marker.
SENTENCE_INITIAL_NAME_RE = re.compile(
    r"(?:^|[\n\.?!]\s*)([가-힣]{2,4})(?:은|는|이|가)\s"
)

NAME_BLACKLIST = {
    "대한민국",
    "초등학교",
    "고등학교",
    "대학교",
    "아파트",
    "무직",
    "비현역",
    "배우자",
}


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def _parse_list(value: Any) -> list[str]:
    """Normalize list-like dataset values.

    Hugging Face may return actual lists, while rendered examples often show
    Python-list strings. Keep this adapter tolerant.
    """

    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, tuple):
        return [str(item) for item in value]
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return []
        try:
            parsed = ast.literal_eval(stripped)
        except (SyntaxError, ValueError):
            return [stripped]
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
        return [str(parsed)]
    return [str(value)]


def _candidate_names_from_text(text: str, *, allow_fallback: bool) -> Iterable[tuple[str, str]]:
    normalized = _as_text(text)
    if not normalized:
        return []

    candidates: list[tuple[str, str]] = []
    for match in HONORIFIC_NAME_RE.finditer(normalized):
        name = match.group(1)
        if name not in NAME_BLACKLIST:
            candidates.append((name, "honorific"))

    if allow_fallback and not candidates:
        for match in SENTENCE_INITIAL_NAME_RE.finditer(normalized):
            name = match.group(1)
            if name not in NAME_BLACKLIST:
                candidates.append((name, "sentence_initial"))

    return candidates


def parse_name_from_row(row: dict[str, Any]) -> dict[str, Any]:
    """Parse a Korean person name from a Nemotron persona row.

    Returns a small diagnostics object instead of only a string so simulation
    traces can record whether name parsing was reliable.
    """

    weighted: Counter[str] = Counter()
    evidence: dict[str, list[dict[str, str]]] = {}

    for field in TEXT_FIELDS:
        text = _as_text(row.get(field))
        # Use the weaker fallback only on summary-like fields to avoid turning
        # arbitrary Korean nouns into names.
        allow_fallback = field in {"persona", "cultural_background"}
        for name, source in _candidate_names_from_text(text, allow_fallback=allow_fallback):
            weight = 3 if source == "honorific" else 1
            weighted[name] += weight
            evidence.setdefault(name, []).append({"field": field, "source": source})

    if not weighted:
        return {"name": None, "confidence": 0.0, "candidates": [], "evidence": {}}

    ranked = weighted.most_common()
    best_name, best_score = ranked[0]
    total_score = sum(weighted.values())
    confidence = round(best_score / total_score, 3) if total_score else 0.0

    return {
        "name": best_name,
        "confidence": confidence,
        "candidates": [{"name": name, "score": score} for name, score in ranked],
        "evidence": evidence,
    }


def compact_persona_from_row(row: dict[str, Any]) -> dict[str, Any]:
    """Convert a raw Nemotron row into the simulator's compact persona JSON."""

    parsed_name = parse_name_from_row(row)

    return {
        "dataset_id": DATASET_ID,
        "uuid": row.get("uuid"),
        "name": parsed_name["name"],
        "name_parse": parsed_name,
        "persona": row.get("persona"),
        "demographics": {
            "sex": row.get("sex"),
            "age": row.get("age"),
            "marital_status": row.get("marital_status"),
            "military_status": row.get("military_status"),
            "family_type": row.get("family_type"),
            "housing_type": row.get("housing_type"),
            "education_level": row.get("education_level"),
            "bachelors_field": row.get("bachelors_field"),
            "occupation": row.get("occupation"),
            "district": row.get("district"),
            "province": row.get("province"),
            "country": row.get("country"),
        },
        "life_domains": {
            "professional": row.get("professional_persona"),
            "sports": row.get("sports_persona"),
            "arts": row.get("arts_persona"),
            "travel": row.get("travel_persona"),
            "culinary": row.get("culinary_persona"),
            "family": row.get("family_persona"),
            "culture": row.get("cultural_background"),
        },
        "capabilities": {
            "skills_text": row.get("skills_and_expertise"),
            "skills_list": _parse_list(row.get("skills_and_expertise_list")),
        },
        "interests": {
            "hobbies_text": row.get("hobbies_and_interests"),
            "hobbies_list": _parse_list(row.get("hobbies_and_interests_list")),
        },
        "goals": row.get("career_goals_and_ambitions"),
    }
