import time
import unittest
from email.message import Message
from email.utils import formatdate

from upstage_api_sim.upstage_client import _retry_after_from_headers


class UpstageClientRetryHelpersTests(unittest.TestCase):
    def test_retry_after_accepts_delta_seconds(self):
        headers = Message()
        headers["Retry-After"] = "17"
        self.assertEqual(_retry_after_from_headers(headers), 17.0)

    def test_retry_after_accepts_http_date(self):
        headers = Message()
        headers["Retry-After"] = formatdate(time.time() + 5, usegmt=True)
        delay = _retry_after_from_headers(headers)
        self.assertIsNotNone(delay)
        self.assertGreater(delay, 0)
        self.assertLessEqual(delay, 6)

    def test_rate_limit_reset_accepts_seconds_until_reset(self):
        headers = Message()
        headers["X-RateLimit-Reset"] = "12"
        self.assertEqual(_retry_after_from_headers(headers), 12.0)


if __name__ == "__main__":
    unittest.main()
