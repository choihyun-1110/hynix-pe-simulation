import importlib.util
import io
import json
import os
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SERVER_PATH = ROOT / "scripts" / "run_upkinsey_server.py"


def load_server_module():
    spec = importlib.util.spec_from_file_location("run_upkinsey_server", SERVER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class FakeHandler:
    def __init__(self, body: bytes, headers: dict[str, str] | None = None):
        self.headers = {"Content-Length": str(len(body))}
        if headers:
            self.headers.update(headers)
        self.rfile = io.BytesIO(body)


class UpkinseyServerSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = load_server_module()

    def tearDown(self):
        for key in [
            "UPKINSEY_REQUIRE_BASIC_AUTH",
            "UPKINSEY_BASIC_AUTH_USER",
            "UPKINSEY_BASIC_AUTH_PASSWORD",
            "UPKINSEY_ALLOW_DESTRUCTIVE_API",
            "UPKINSEY_MAX_ACTIVE_JOBS",
            "UPKINSEY_RATE_LIMIT_PER_MINUTE",
        ]:
            os.environ.pop(key, None)
        self.server.SIMULATION_JOBS.clear()
        self.server.RATE_LIMIT_STATE.clear()

    def test_read_json_body_accepts_object(self):
        payload = {"product_name": "테스트"}
        handler = FakeHandler(json.dumps(payload).encode("utf-8"))

        self.assertEqual(self.server._read_json_body(handler), payload)

    def test_read_json_body_rejects_invalid_json(self):
        handler = FakeHandler(b"{bad json")

        with self.assertRaisesRegex(ValueError, "invalid_json_body"):
            self.server._read_json_body(handler)

    def test_read_json_body_rejects_non_object_json(self):
        handler = FakeHandler(b"[]")

        with self.assertRaisesRegex(ValueError, "request_body_must_be_object"):
            self.server._read_json_body(handler)

    def test_cleanup_finished_jobs_keeps_running_jobs(self):
        self.server.SIMULATION_JOBS.update(
            {
                "old-done": {"status": "done", "updated_at": 0},
                "old-error": {"status": "error", "updated_at": 0},
                "running": {"status": "running", "updated_at": 0},
            }
        )

        self.server._cleanup_finished_jobs(now=3_700)

        self.assertNotIn("old-done", self.server.SIMULATION_JOBS)
        self.assertNotIn("old-error", self.server.SIMULATION_JOBS)
        self.assertIn("running", self.server.SIMULATION_JOBS)

    def test_basic_auth_required_without_credentials_denies(self):
        os.environ["UPKINSEY_REQUIRE_BASIC_AUTH"] = "1"

        self.assertTrue(self.server._basic_auth_enabled())
        self.assertFalse(self.server._basic_auth_configured())
        self.assertFalse(self.server._basic_auth_allowed(None))

    def test_destructive_api_is_disabled_by_default(self):
        self.assertFalse(self.server._destructive_api_enabled())
        os.environ["UPKINSEY_ALLOW_DESTRUCTIVE_API"] = "1"
        self.assertTrue(self.server._destructive_api_enabled())

    def test_active_job_count_respects_limit(self):
        os.environ["UPKINSEY_MAX_ACTIVE_JOBS"] = "1"
        self.server.SIMULATION_JOBS.update({"queued": {"status": "queued"}, "done": {"status": "done", "updated_at": 0}})

        self.assertEqual(self.server._max_active_jobs(), 1)
        self.assertEqual(self.server._active_job_count(), 1)

    def test_rate_limit_blocks_after_window_budget(self):
        os.environ["UPKINSEY_RATE_LIMIT_PER_MINUTE"] = "2"

        self.assertEqual(self.server._check_rate_limit("client", now=100), (True, 0))
        self.assertEqual(self.server._check_rate_limit("client", now=101), (True, 0))
        ok, retry_after = self.server._check_rate_limit("client", now=102)

        self.assertFalse(ok)
        self.assertGreaterEqual(retry_after, 1)

    def test_uploaded_document_requires_pdf_magic(self):
        boundary = "----testboundary"
        body = (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="file"; filename="fake.pdf"\r\n'
            "Content-Type: application/pdf\r\n\r\n"
            "not a pdf\r\n"
            f"--{boundary}--\r\n"
        ).encode("utf-8")
        handler = FakeHandler(body, {"Content-Type": f"multipart/form-data; boundary={boundary}"})

        with self.assertRaisesRegex(ValueError, "uploaded_document_must_be_pdf"):
            self.server._read_uploaded_document(handler)


if __name__ == "__main__":
    unittest.main()
