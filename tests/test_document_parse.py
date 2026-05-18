import unittest

from upstage_api_sim.document_parse import extract_document_text, normalize_extracted_brief


class DocumentParseHelpersTests(unittest.TestCase):
    def test_extract_document_text_collects_nested_parse_response(self):
        text = extract_document_text(
            {
                "elements": [
                    {"text": "Product Name: CarePup"},
                    {"content": "Features: voice, alerts"},
                    {"text": "Product Name: CarePup"},
                ],
                "pages": [{"paragraphs": [{"text": "Pricing: monthly"}]}],
            }
        )
        self.assertIn("Product Name: CarePup", text)
        self.assertIn("Features: voice, alerts", text)
        self.assertIn("Pricing: monthly", text)
        self.assertEqual(text.count("Product Name: CarePup"), 1)

    def test_normalize_extracted_brief_fills_confidence_when_model_omits_it(self):
        brief = normalize_extracted_brief(
            {
                "productName": "CarePup",
                "description": "Companion robot",
                "features": "voice, alerts",
                "pricing": ["월 39,000원"],
                "target": "older adults",
                "alternatives": "AI speaker",
                "hypothesis": "children pay remotely",
            }
        )
        self.assertEqual(brief["features"], ["voice", "alerts"])
        self.assertGreaterEqual(brief["confidence"], 70)

    def test_normalize_extracted_brief_accepts_ratio_confidence(self):
        brief = normalize_extracted_brief({"productName": "CarePup", "confidence": 0.86})
        self.assertEqual(brief["confidence"], 86)


if __name__ == "__main__":
    unittest.main()
