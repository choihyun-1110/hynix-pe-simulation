import json
import tempfile
import unittest
from pathlib import Path

from upstage_api_sim.personas import load_personas_jsonl


class PersonaIoTests(unittest.TestCase):
    def test_load_personas_jsonl_respects_limit_and_offset(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "personas.jsonl"
            rows = [{"name": "A"}, {"name": "B"}, {"name": "C"}]
            path.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows), encoding="utf-8")

            loaded = load_personas_jsonl(path, limit=1, offset=1)

        self.assertEqual(loaded, [{"name": "B"}])

    def test_load_personas_jsonl_rejects_non_object_records(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "personas.jsonl"
            path.write_text("[]\n", encoding="utf-8")

            with self.assertRaises(ValueError):
                load_personas_jsonl(path)


if __name__ == "__main__":
    unittest.main()
