"""Fixed-window rate limiting for auth, AI and listening-event endpoints."""

import threading
import time
from collections.abc import Callable
from typing import Any, Protocol

from fastapi import Request

from app.shared.errors import RateLimited


class RateLimiterPort(Protocol):
    def hit(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        """Count one hit; return ``(allowed, seconds_until_reset)``."""
        ...


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._windows: dict[str, tuple[int, int]] = {}
        self._lock = threading.Lock()

    def hit(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now = int(time.time())
        window = now // window_seconds
        with self._lock:
            current_window, count = self._windows.get(key, (window, 0))
            if current_window != window:
                count = 0
            count += 1
            self._windows[key] = (window, count)
        return count <= limit, window_seconds - (now % window_seconds)

    def reset(self) -> None:
        with self._lock:
            self._windows.clear()


class RedisRateLimiter:
    def __init__(self, redis_url: str) -> None:
        import redis

        self._redis = redis.Redis.from_url(redis_url)

    def hit(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now = int(time.time())
        bucket = f"ratelimit:{key}:{now // window_seconds}"
        pipe = self._redis.pipeline()
        pipe.incr(bucket)
        pipe.expire(bucket, window_seconds)
        count, _ = pipe.execute()
        return int(count) <= limit, window_seconds - (now % window_seconds)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def rate_limit(
    name: str,
    *,
    limit: int,
    window_seconds: int = 60,
    key_func: Callable[[Request], str] = client_ip,
) -> Callable[[Request], Any]:
    """FastAPI dependency limiting ``limit`` calls per ``window_seconds`` per key."""

    def dependency(request: Request) -> None:
        limiter: RateLimiterPort = request.app.state.container.rate_limiter
        allowed, retry_after = limiter.hit(f"{name}:{key_func(request)}", limit, window_seconds)
        if not allowed:
            raise RateLimited(
                "Too many requests, try again later", details={"retry_after": retry_after}
            )

    return dependency
