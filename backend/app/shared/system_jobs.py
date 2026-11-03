"""Built-in jobs used to check that workers are alive."""

from typing import Any

from app.shared.jobs import job


@job("system.ping")
def ping(_container: Any, **_: Any) -> str:
    return "pong"
