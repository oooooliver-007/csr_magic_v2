"""速率限制器测试"""

import time
import pytest
from fastapi import HTTPException, Request
from unittest.mock import MagicMock, patch
from app.utils.rate_limit import RateLimiter, _get_client_ip


class TestGetClientIp:
    """客户端 IP 提取测试"""

    def test_x_forwarded_for(self):
        request = MagicMock(spec=Request)
        request.headers = {"X-Forwarded-For": "10.0.0.1, 10.0.0.2"}
        assert _get_client_ip(request) == "10.0.0.1"

    def test_x_real_ip(self):
        request = MagicMock(spec=Request)
        request.headers = {"X-Real-IP": "10.0.0.3"}
        assert _get_client_ip(request) == "10.0.0.3"

    def test_client_host(self):
        request = MagicMock(spec=Request)
        request.headers = {}
        request.client.host = "10.0.0.4"
        assert _get_client_ip(request) == "10.0.0.4"

    def test_unknown(self):
        request = MagicMock(spec=Request)
        request.headers = {}
        request.client = None
        assert _get_client_ip(request) == "unknown"


class TestRateLimiter:
    """速率限制逻辑测试"""

    def setup_method(self):
        """每个测试前清空计数器，避免测试间污染。"""
        from app.utils.rate_limit import _counters
        _counters.clear()

    @pytest.mark.asyncio
    async def test_allows_requests_within_limit(self):
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        request = MagicMock(spec=Request)
        request.headers = {}
        request.client.host = "10.0.0.1"

        # First 3 requests should pass
        for _ in range(3):
            await limiter(request)  # should not raise

    @pytest.mark.asyncio
    async def test_blocks_requests_exceeding_limit(self):
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        request = MagicMock(spec=Request)
        request.headers = {}
        request.client.host = "10.0.0.2"

        # First 2 requests pass
        await limiter(request)
        await limiter(request)

        # 3rd request should be blocked
        with pytest.raises(HTTPException) as exc_info:
            await limiter(request)
        assert exc_info.value.status_code == 429

    @pytest.mark.asyncio
    async def test_different_ips_count_separately(self):
        limiter = RateLimiter(max_requests=1, window_seconds=60)

        request_a = MagicMock(spec=Request)
        request_a.headers = {}
        request_a.client.host = "10.0.0.1"

        request_b = MagicMock(spec=Request)
        request_b.headers = {}
        request_b.client.host = "10.0.0.2"

        # Both should pass since they're different IPs
        await limiter(request_a)
        await limiter(request_b)  # should not raise
