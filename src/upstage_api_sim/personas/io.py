"""Persona file loading helpers for simulation runs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_personas_jsonl(path: str | Path, *, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Load compact persona records from JSONL with bounded slicing.

    Args:
        path: JSONL file path. Each non-empty line must be one JSON object.
        limit: Maximum records to return. Use 0 to read all records after offset.
        offset: Number of valid persona records to skip before collecting.
    """

    persona_path = Path(path)
    if not persona_path.exists():
        raise FileNotFoundError(f"persona file not found: {persona_path}")
    if limit < 0:
        raise ValueError("limit must be >= 0")
    if offset < 0:
        raise ValueError("offset must be >= 0")

    personas: list[dict[str, Any]] = []
    seen = 0
    with persona_path.open("r", encoding="utf-8") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            line = raw_line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"invalid JSON on {persona_path}:{line_number}: {exc.msg}") from exc
            if not isinstance(record, dict):
                raise ValueError(f"persona record on {persona_path}:{line_number} must be an object")
            if seen < offset:
                seen += 1
                continue
            personas.append(record)
            seen += 1
            if limit and len(personas) >= limit:
                break

    if not personas:
        raise ValueError(f"no persona records loaded from {persona_path}")
    return personas
