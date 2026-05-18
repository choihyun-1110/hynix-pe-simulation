#!/usr/bin/env python3
"""Sample Nemotron-Personas-Korea rows and save compact personas as JSONL.

Example:
  python scripts/sample_nemotron_personas.py --seed 42 --n 10 --output data/personas/sample.jsonl
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from upstage_api_sim.personas.nemotron import DATASET_ID, compact_persona_from_row  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--n", type=int, default=10)
    parser.add_argument("--buffer-size", type=int, default=10_000)
    parser.add_argument("--output", type=Path, default=Path("data/personas/sample.jsonl"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: datasets. Install with `pip install -e '.[persona]'`."
        ) from exc

    stream = load_dataset(DATASET_ID, split="train", streaming=True)
    sampled_rows = stream.shuffle(seed=args.seed, buffer_size=args.buffer_size).take(args.n)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    sampled_uuids: list[str] = []
    with args.output.open("w", encoding="utf-8") as f:
        for row in sampled_rows:
            compact = compact_persona_from_row(dict(row))
            compact["sampling"] = {
                "dataset_id": DATASET_ID,
                "split": "train",
                "seed": args.seed,
                "buffer_size": args.buffer_size,
                "method": "streaming_shuffle_take",
            }
            sampled_uuids.append(str(compact.get("uuid")))
            f.write(json.dumps(compact, ensure_ascii=False) + "\n")

    manifest = {
        "dataset_id": DATASET_ID,
        "split": "train",
        "sampling_seed": args.seed,
        "sample_size": args.n,
        "buffer_size": args.buffer_size,
        "sampling_method": "streaming_shuffle_take",
        "output": str(args.output),
        "sampled_uuids": sampled_uuids,
    }
    manifest_path = args.output.with_suffix(args.output.suffix + ".manifest.json")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"wrote {args.output}")
    print(f"wrote {manifest_path}")


if __name__ == "__main__":
    main()
