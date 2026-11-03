"""Tiny in-process event hooks so modules can react to each other without importing each other.

Example: ``identity`` emits ``user_deleted``; ``listening`` subscribes and anonymises events.
Handlers run synchronously inside the emitter's transaction.
"""

from collections import defaultdict
from collections.abc import Callable
from typing import Any

Handler = Callable[..., None]

_handlers: dict[str, list[Handler]] = defaultdict(list)


def subscribe(event: str) -> Callable[[Handler], Handler]:
    def decorator(fn: Handler) -> Handler:
        if fn not in _handlers[event]:
            _handlers[event].append(fn)
        return fn

    return decorator


def emit(event: str, **payload: Any) -> None:
    for handler in list(_handlers[event]):
        handler(**payload)


def handlers(event: str) -> list[Handler]:
    return list(_handlers[event])
