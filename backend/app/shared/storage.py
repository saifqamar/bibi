"""Object storage port with HMAC-signed, expiring URLs.

``LocalStorage`` writes to disk for development; ``InMemoryStorage`` is for tests. An S3/CDN
adapter can implement the same port once hosting is chosen (DECISIONS.md D3).
"""

import hashlib
import hmac
import mimetypes
import re
import time
from pathlib import Path
from typing import Protocol
from urllib.parse import urlencode

from app.shared.errors import NotFound, ValidationFailed

_KEY_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9/_.-]{0,511}$")


def validate_key(key: str) -> str:
    if not _KEY_RE.match(key) or ".." in key.split("/") or "//" in key:
        raise ValidationFailed("Invalid storage key", code="invalid_storage_key")
    return key


def guess_content_type(key: str) -> str:
    return mimetypes.guess_type(key)[0] or "application/octet-stream"


class StoragePort(Protocol):
    def put(self, key: str, data: bytes, content_type: str | None = None) -> None: ...
    def get(self, key: str) -> bytes: ...
    def delete(self, key: str) -> None: ...
    def exists(self, key: str) -> bool: ...
    def signed_url(self, key: str, ttl_seconds: int | None = None) -> str: ...
    def verify(self, key: str, expires: int, signature: str) -> bool: ...


class _Signer:
    def __init__(self, secret: str, base_url: str, default_ttl: int) -> None:
        self._secret = secret.encode()
        self._base_url = base_url.rstrip("/")
        self._default_ttl = default_ttl

    def _sign(self, key: str, expires: int) -> str:
        return hmac.new(self._secret, f"{key}:{expires}".encode(), hashlib.sha256).hexdigest()

    def signed_url(self, key: str, ttl_seconds: int | None = None) -> str:
        validate_key(key)
        expires = int(time.time()) + (ttl_seconds or self._default_ttl)
        query = urlencode({"expires": expires, "sig": self._sign(key, expires)})
        return f"{self._base_url}/media/{key}?{query}"

    def verify(self, key: str, expires: int, signature: str) -> bool:
        if expires < int(time.time()):
            return False
        return hmac.compare_digest(self._sign(key, expires), signature)


class LocalStorage(_Signer):
    def __init__(self, root: str, *, secret: str, base_url: str, default_ttl: int = 3600) -> None:
        super().__init__(secret, base_url, default_ttl)
        self._root = Path(root).resolve()
        self._root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = (self._root / validate_key(key)).resolve()
        if self._root not in path.parents:
            raise ValidationFailed("Invalid storage key", code="invalid_storage_key")
        return path

    def put(self, key: str, data: bytes, content_type: str | None = None) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def get(self, key: str) -> bytes:
        path = self._path(key)
        if not path.is_file():
            raise NotFound("File not found")
        return path.read_bytes()

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)

    def exists(self, key: str) -> bool:
        return self._path(key).is_file()


class InMemoryStorage(_Signer):
    def __init__(
        self, *, secret: str = "test", base_url: str = "http://test", default_ttl: int = 3600
    ) -> None:
        super().__init__(secret, base_url, default_ttl)
        self.files: dict[str, tuple[bytes, str]] = {}

    def put(self, key: str, data: bytes, content_type: str | None = None) -> None:
        self.files[validate_key(key)] = (data, content_type or guess_content_type(key))

    def get(self, key: str) -> bytes:
        if key not in self.files:
            raise NotFound("File not found")
        return self.files[key][0]

    def delete(self, key: str) -> None:
        self.files.pop(key, None)

    def exists(self, key: str) -> bool:
        return key in self.files
