import unittest

from upstage_api_sim.personas.nemotron import compact_persona_from_row, parse_name_from_row


class NemotronPersonaTests(unittest.TestCase):
    def test_parse_name_from_honorific_fields(self):
        row = {
            "professional_persona": "전기태 씨는 광주 서구의 하역 현장에서 일합니다.",
            "family_persona": "전기태 씨는 가족을 행동으로 챙깁니다.",
            "persona": "전기태 씨는 성실하고 사교적인 인물입니다.",
        }

        parsed = parse_name_from_row(row)

        self.assertEqual(parsed["name"], "전기태")
        self.assertEqual(parsed["confidence"], 1.0)
        self.assertEqual(parsed["candidates"][0]["name"], "전기태")

    def test_parse_name_fallback_from_summary_field(self):
        row = {"persona": "최은지는 서초구의 오래된 다세대 주택가에서 나고 자랐습니다."}

        parsed = parse_name_from_row(row)

        self.assertEqual(parsed["name"], "최은지")
        self.assertEqual(parsed["confidence"], 1.0)

    def test_compact_persona_includes_name_and_lists(self):
        row = {
            "uuid": "abc",
            "persona": "김다희 씨는 분당의 정돈된 일상 속에서 가족의 평온함을 중시합니다.",
            "skills_and_expertise_list": "['가족 구성원 간의 의견 조율', '정보 검색']",
            "hobbies_and_interests_list": ["탄천 산책", "다큐멘터리 시청"],
            "age": 46,
            "occupation": "무직",
        }

        compact = compact_persona_from_row(row)

        self.assertEqual(compact["name"], "김다희")
        self.assertEqual(compact["uuid"], "abc")
        self.assertEqual(compact["capabilities"]["skills_list"], ["가족 구성원 간의 의견 조율", "정보 검색"])
        self.assertEqual(compact["interests"]["hobbies_list"], ["탄천 산책", "다큐멘터리 시청"])
        self.assertEqual(compact["demographics"]["age"], 46)


if __name__ == "__main__":
    unittest.main()
