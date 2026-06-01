"""内存滑动窗口速率限制器

用于 FastAPI 依赖注入，对标注的端点进行 IP 级别的请求频率控制。
"""

import time
import threading
import logging
from typing import Dict, Tuple
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)

# 默认配置
DEFAULT_MAX_REQUESTS = 5
DEFAULT_WINDOW_SECONDS = 60

# 线程安全的计数器存储
_counters: Dict[str, Tuple[int, float]] = {}
_counters_lock = threading.Lock()


class RateLimiter:
    """速率限制器，可作为 FastAPI 依赖使用。"""

    def __init__(self, max_requests: int = DEFAULT_MAX_REQUESTS,
                 window_seconds: int = DEFAULT_WINDOW_SECONDS):
        self.max_requests = max_requests
        self.window_seconds = window_seconds

    async def __call__(self, request: Request) -> None:
        client_ip = _get_client_ip(request)
        now = time.time()
        window_start = int(now / self.window_seconds) * self.window_seconds
        key = f"{client_ip}:{window_start}"

        with _counters_lock:
            # 清理过期计数器
            expired_before = window_start - self.window_seconds * 2
            expired_keys = [
                k for k, (_, ws) in _counters.items()
                if ws < expired_before
            ]
            for k in expired_keys:
                del _counters[k]

            # 获取或创建计数器
            if key in _counters:
                count, _ = _counters[key]
                count += 1
                _counters[key] = (count, window_start)
            else:
                count = 1
                _counters[key] = (count, window_start)

        if count > self.max_requests:
            logger.warning(
                "速率限制触发: ip=%s, count=%d, max=%d, window=%ds",
                client_ip, count, self.max_requests, self.window_seconds,
            )
            raise HTTPException(
                status_code=429,
                detail=f"请求过于频繁，每分钟最多 {self.max_requests} 次",
            )

        # 内存保护：计数器超过 10000 时清空全部旧数据
        with _counters_lock:
            if len(_counters) > 10000:
                _counters.clear()


def _get_client_ip(request: Request) -> str:
    """从请求中提取客户端 IP（支持反向代理）。"""
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip.strip()
    client = request.client
    if client:
        return client.host
    return "unknown"
