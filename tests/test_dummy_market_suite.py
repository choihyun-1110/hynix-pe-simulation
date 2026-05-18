import tempfile
import unittest
from pathlib import Path

from scripts.run_dummy_market_suite import summarize_product, write_review


def successful_run(adoption, decision="Refine", need_fit=60, price_risk="Medium"):
    return {
        "ok": True,
        "result": {
            "adoption_score": adoption,
            "need_fit_score": need_fit,
            "price_risk": price_risk,
            "personas": [{"stance": "조건부 긍정"}],
            "report": {
                "decision_board": {"decision": decision},
                "positive_drivers": ["시간 절약"],
                "top_risks": ["월 구독료 부담"],
                "next_validation_questions": ["월 구독 전환 조건은 무엇인가?"],
                "objections": [{"category": "가격 부담", "count": 1}],
                "segment_recommendations": [{"segment": "조건부 전환 타깃", "persona_count": 1}],
            },
        },
    }


class DummyMarketSuiteTests(unittest.TestCase):
    def test_summarize_product_adds_repeated_run_stability(self):
        summary = summarize_product(
            {"product_name": "테스트 제품"},
            [
                successful_run(60, decision="Refine"),
                successful_run(63, decision="Refine"),
                successful_run(58, decision="Refine"),
            ],
        )

        self.assertEqual(summary["stability"], "stable")
        self.assertEqual(summary["adoption_range"], 5.0)
        self.assertEqual(summary["decision_counts"], [("Refine", 3)])
        self.assertIn("같은 방향", summary["stability_note"])

    def test_summarize_product_marks_volatile_when_decision_and_score_swing(self):
        summary = summarize_product(
            {"product_name": "흔들리는 제품"},
            [
                successful_run(42, decision="Hold", need_fit=45, price_risk="High"),
                successful_run(78, decision="Go", need_fit=80, price_risk="Low"),
            ],
        )

        self.assertEqual(summary["stability"], "volatile")
        self.assertEqual(summary["adoption_range"], 36.0)
        self.assertEqual(summary["decision_counts"], [("Go", 1), ("Hold", 1)])

    def test_write_review_renders_stability_columns(self):
        summary = summarize_product(
            {"product_name": "테스트 제품"},
            [successful_run(60), successful_run(62)],
        )
        with tempfile.TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir)
            write_review(
                output_dir,
                [summary],
                {
                    "repeats": 2,
                    "run_workers": 1,
                    "persona_workers": 1,
                    "persona_source": "built_in_sample",
                    "persona_count": 4,
                },
            )
            review = (output_dir / "review.md").read_text(encoding="utf-8")

        self.assertIn("| Verdict | Stability | Adoption mean ± sd |", review)
        self.assertIn("- Stability: **stable**", review)
        self.assertIn("- Decision counts:", review)


if __name__ == "__main__":
    unittest.main()
