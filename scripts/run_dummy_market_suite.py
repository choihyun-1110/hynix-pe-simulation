#!/usr/bin/env python3
"""Run repeated Upkinsey simulations over dummy product briefs.

Outputs raw JSON results plus a compact review markdown so product ideas can be
compared quickly after repeated Solar Pro 3 simulations.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from upstage_api_sim.env import load_env  # noqa: E402
from upstage_api_sim.market_research import simulate_market_research  # noqa: E402
from upstage_api_sim.personas import load_personas_jsonl  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--products", type=Path, default=ROOT / "examples" / "dummy_products.json")
    parser.add_argument("--output-dir", type=Path, default=None)
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument("--run-workers", type=int, default=2, help="Parallel product/repeat simulations")
    parser.add_argument("--persona-workers", type=int, default=4, help="Parallel persona requests inside each simulation")
    parser.add_argument("--personas", type=Path, default=None, help="Optional compact Nemotron persona JSONL file")
    parser.add_argument("--persona-limit", type=int, default=50, help="Max personas to load from --personas; must be 1-200")
    parser.add_argument("--persona-offset", type=int, default=0, help="Persona records to skip before loading")
    parser.add_argument("--limit-products", type=int, default=0, help="0 means all products")
    parser.add_argument("--fail-fast", action="store_true")
    return parser.parse_args()


def slugify(text: str) -> str:
    safe = "".join(ch.lower() if ch.isalnum() else "-" for ch in text)
    return "-".join(part for part in safe.split("-") if part)[:80] or "product"


def mean(values: list[float]) -> float:
    return sum(values) / max(1, len(values))


def stdev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    return statistics.stdev(values)


def risk_score(label: str) -> int:
    return {"Low": 0, "Low-Medium": 1, "Medium": 2, "High": 3}.get(label, 2)


def _run_decision(result: dict[str, Any]) -> str | None:
    report = result.get("report") if isinstance(result.get("report"), dict) else {}
    board = report.get("decision_board") if isinstance(report.get("decision_board"), dict) else {}
    decision = board.get("decision") or board.get("decision_label")
    return str(decision) if decision else None


def stability_label(successes: list[dict[str, Any]], failures: list[dict[str, Any]]) -> tuple[str, str]:
    """Summarize whether repeated Solar runs are directionally reproducible."""

    if not successes:
        return "failed", "유효한 반복 실행이 없어 안정성을 판단할 수 없습니다."
    if len(successes) < 2:
        return "single_run", "반복 실행이 1회뿐이라 점수 재현성은 아직 확인 전입니다."

    adoption = [float(run["result"].get("adoption_score", 0)) for run in successes]
    adoption_sd = stdev(adoption)
    adoption_range = max(adoption) - min(adoption)
    decisions = [_run_decision(run["result"]) for run in successes]
    decision_count = len({decision for decision in decisions if decision})

    if adoption_sd <= 5 and adoption_range <= 10 and decision_count <= 1 and not failures:
        return "stable", "반복 실행 간 adoption과 decision이 거의 같은 방향입니다."
    if adoption_sd <= 8 and adoption_range <= 15 and decision_count <= 2:
        note = "대체로 같은 방향이지만 추가 반복으로 decision 경계를 확인하는 편이 좋습니다."
        if failures:
            note += " 일부 실패 run이 있어 API/입력 상태도 함께 점검하세요."
        return "directional", note
    return "volatile", "반복 실행 간 점수나 decision이 흔들려 더 큰 panel 또는 prompt/brief 보강이 필요합니다."


def summarize_product(product: dict[str, Any], runs: list[dict[str, Any]]) -> dict[str, Any]:
    successes = [run for run in runs if run.get("ok")]
    failures = [run for run in runs if not run.get("ok")]
    adoption = [float(run["result"].get("adoption_score", 0)) for run in successes]
    need_fit = [float(run["result"].get("need_fit_score", 0)) for run in successes]
    price_risks = [run["result"].get("price_risk", "Medium") for run in successes]
    decisions = [_run_decision(run["result"]) for run in successes]

    risks: Counter[str] = Counter()
    drivers: Counter[str] = Counter()
    questions: Counter[str] = Counter()
    objections: Counter[str] = Counter()
    segments: Counter[str] = Counter()
    stances: Counter[str] = Counter()
    for run in successes:
        result = run["result"]
        report = result.get("report", {})
        for item in result.get("report", {}).get("top_risks", []):
            risks[item] += 1
        for item in report.get("positive_drivers", []):
            drivers[item] += 1
        for item in report.get("next_validation_questions", []):
            questions[item] += 1
        for objection in report.get("objections", []):
            label = objection.get("category") or objection.get("objection")
            if label:
                objections[str(label)] += int(objection.get("count") or 1)
        for segment in report.get("segment_recommendations", []):
            label = segment.get("segment") or segment.get("role")
            if label:
                segments[str(label)] += int(segment.get("persona_count") or 1)
        for persona in result.get("personas", []):
            stances[persona.get("stance", "unknown")] += 1

    adoption_mean = mean(adoption)
    adoption_sd = stdev(adoption)
    adoption_min = min(adoption) if adoption else None
    adoption_max = max(adoption) if adoption else None
    need_mean = mean(need_fit)
    risk_mean = mean([risk_score(r) for r in price_risks]) if price_risks else math.nan
    stability, stability_note = stability_label(successes, failures)

    if not successes:
        verdict = "실패: 유효한 결과 없음"
    elif adoption_mean >= 70 and risk_mean <= 1.5:
        verdict = "우선 검증 후보"
    elif adoption_mean >= 55:
        verdict = "조건부 후보"
    else:
        verdict = "재포지셔닝 필요"

    return {
        "product_name": product.get("product_name"),
        "runs": len(runs),
        "successes": len(successes),
        "failures": len(failures),
        "adoption_mean": round(adoption_mean, 1) if successes else None,
        "adoption_stdev": round(adoption_sd, 1) if successes else None,
        "adoption_min": round(adoption_min, 1) if adoption_min is not None else None,
        "adoption_max": round(adoption_max, 1) if adoption_max is not None else None,
        "adoption_range": round(adoption_max - adoption_min, 1) if adoption_min is not None and adoption_max is not None else None,
        "need_fit_mean": round(need_mean, 1) if successes else None,
        "price_risk_mode": Counter(price_risks).most_common(1)[0][0] if price_risks else None,
        "verdict": verdict,
        "decision_counts": sorted(
            Counter(decision for decision in decisions if decision).items(),
            key=lambda item: (-item[1], item[0]),
        ),
        "stability": stability,
        "stability_note": stability_note,
        "top_drivers": drivers.most_common(5),
        "top_risks": risks.most_common(5),
        "top_objections": objections.most_common(5),
        "top_segments": segments.most_common(5),
        "top_questions": questions.most_common(5),
        "stance_counts": stances.most_common(),
    }


def write_review(output_dir: Path, summaries: list[dict[str, Any]], run_config: dict[str, Any]) -> None:
    ranked = sorted(
        summaries,
        key=lambda item: (item.get("adoption_mean") or -1, item.get("need_fit_mean") or -1),
        reverse=True,
    )
    lines = [
        "# Upkinsey Dummy Product Simulation Review",
        "",
        f"- Generated: {datetime.now().isoformat(timespec='seconds')}",
        f"- Repeats per product: {run_config['repeats']}",
        f"- Product/repeat workers: {run_config['run_workers']}",
        f"- Persona workers per simulation: {run_config['persona_workers']}",
        f"- Persona source: {run_config.get('persona_source', 'built_in_sample')}",
        f"- Personas per simulation: {run_config.get('persona_count', 4)}",
        "- Model: Upstage Solar Pro 3",
        "",
        "## Ranked summary",
        "",
        "| Rank | Product | Verdict | Stability | Adoption mean ± sd | Need fit | Price risk | Successes |",
        "|---:|---|---|---|---:|---:|---|---:|",
    ]
    for idx, item in enumerate(ranked, start=1):
        adoption = "-" if item["adoption_mean"] is None else f"{item['adoption_mean']} ± {item['adoption_stdev']}"
        need = "-" if item["need_fit_mean"] is None else str(item["need_fit_mean"])
        lines.append(
            f"| {idx} | {item['product_name']} | {item['verdict']} | {item['stability']} | {adoption} | {need} | {item['price_risk_mode'] or '-'} | {item['successes']}/{item['runs']} |"
        )

    lines += ["", "## Per-product review", ""]
    for item in ranked:
        lines += [
            f"### {item['product_name']}",
            f"- Verdict: **{item['verdict']}**",
            f"- Adoption: {item['adoption_mean']} ± {item['adoption_stdev']}",
            f"- Adoption range: {item['adoption_min']}–{item['adoption_max']} (range {item['adoption_range']})",
            f"- Need fit: {item['need_fit_mean']}",
            f"- Price risk mode: {item['price_risk_mode']}",
            f"- Stability: **{item['stability']}** — {item['stability_note']}",
            f"- Decision counts: {item['decision_counts']}",
            f"- Persona stance counts: {item['stance_counts']}",
            "- Top positive drivers:",
        ]
        lines += [f"  - {driver} ({count})" for driver, count in item["top_drivers"]] or ["  - n/a"]
        lines.append("- Top risks:")
        lines += [f"  - {risk} ({count})" for risk, count in item["top_risks"]] or ["  - n/a"]
        lines.append("- Top objection categories:")
        lines += [f"  - {category} ({count})" for category, count in item["top_objections"]] or ["  - n/a"]
        lines.append("- Top segment recommendations:")
        lines += [f"  - {segment} ({count})" for segment, count in item["top_segments"]] or ["  - n/a"]
        lines.append("- Next validation questions:")
        lines += [f"  - {question} ({count})" for question, count in item["top_questions"]] or ["  - n/a"]
        lines.append("")

    (output_dir / "review.md").write_text("\n".join(lines), encoding="utf-8")
    (output_dir / "summary.json").write_text(json.dumps(summaries, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    args = parse_args()
    load_env(ROOT / ".env")

    products = json.loads(args.products.read_text(encoding="utf-8"))
    if args.limit_products:
        products = products[: args.limit_products]
    if not products:
        raise SystemExit("No products to simulate")

    personas = None
    persona_source = "built_in_sample"
    if args.personas:
        if not 1 <= args.persona_limit <= 200:
            raise SystemExit("--persona-limit must be between 1 and 200")
        personas = load_personas_jsonl(args.personas, limit=args.persona_limit, offset=args.persona_offset)
        persona_source = str(args.personas)

    output_dir = args.output_dir or ROOT / "runs" / "dummy-market-suite" / datetime.now().strftime("%Y%m%d-%H%M%S")
    output_dir.mkdir(parents=True, exist_ok=True)

    tasks: list[tuple[int, int, dict[str, Any]]] = []
    for product_index, product in enumerate(products):
        for repeat_index in range(args.repeats):
            brief = dict(product)
            brief["seed"] = int(product.get("seed", 42)) + repeat_index
            brief["sample_size"] = int(product.get("sample_size", 100))
            tasks.append((product_index, repeat_index, brief))

    results_by_product: dict[int, list[dict[str, Any]]] = defaultdict(list)
    started = time.perf_counter()
    persona_count = len(personas) if personas is not None else 4
    print(f"Running {len(tasks)} simulations for {len(products)} products...")
    print(f"personas={persona_count} source={persona_source}")
    print(f"run_workers={args.run_workers}, persona_workers={args.persona_workers}")

    def run_one(product_index: int, repeat_index: int, brief: dict[str, Any]) -> dict[str, Any]:
        result = simulate_market_research(brief, personas=personas, max_workers=args.persona_workers)
        return {
            "ok": True,
            "product_index": product_index,
            "repeat_index": repeat_index,
            "brief": brief,
            "result": result,
        }

    with ThreadPoolExecutor(max_workers=max(1, args.run_workers)) as executor:
        futures = {
            executor.submit(run_one, product_index, repeat_index, brief): (product_index, repeat_index, brief)
            for product_index, repeat_index, brief in tasks
        }
        for future in as_completed(futures):
            product_index, repeat_index, brief = futures[future]
            product_name = brief.get("product_name", f"product-{product_index}")
            try:
                record = future.result()
                score = record["result"].get("adoption_score")
                print(f"✓ {product_name} repeat={repeat_index} adoption={score}")
            except Exception as exc:
                record = {
                    "ok": False,
                    "product_index": product_index,
                    "repeat_index": repeat_index,
                    "brief": brief,
                    "error": str(exc)[:1000],
                }
                print(f"✗ {product_name} repeat={repeat_index}: {exc}")
                if args.fail_fast:
                    raise
            results_by_product[product_index].append(record)
            raw_name = f"{product_index:02d}-{slugify(product_name)}-r{repeat_index}.json"
            (output_dir / raw_name).write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")

    summaries = [summarize_product(product, results_by_product[index]) for index, product in enumerate(products)]
    run_config = {
        "products": str(args.products),
        "repeats": args.repeats,
        "run_workers": args.run_workers,
        "persona_workers": args.persona_workers,
        "persona_source": persona_source,
        "persona_count": persona_count,
        "persona_offset": args.persona_offset if args.personas else 0,
        "elapsed_seconds": round(time.perf_counter() - started, 2),
    }
    (output_dir / "run_config.json").write_text(json.dumps(run_config, ensure_ascii=False, indent=2), encoding="utf-8")
    write_review(output_dir, summaries, run_config)
    print(f"Wrote {output_dir}")
    print(f"Review: {output_dir / 'review.md'}")


if __name__ == "__main__":
    main()
