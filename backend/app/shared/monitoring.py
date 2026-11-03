"""Error monitoring (Sentry). Initialised only when ``BIBI_SENTRY_DSN`` is set."""

import logging

from app.shared.config import Settings

logger = logging.getLogger(__name__)


def init_sentry(settings: Settings, *, component: str) -> bool:
    if not settings.sentry_dsn:
        return False
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.env,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        send_default_pii=False,
    )
    sentry_sdk.set_tag("component", component)
    logger.info("sentry_enabled", extra={"component": component})
    return True


def tag_request_id(request_id: str | None) -> None:
    """Attach the request id to errors reported from this context (no-op without Sentry)."""
    if not request_id:
        return
    try:
        import sentry_sdk
    except ImportError:  # pragma: no cover - sentry is a declared dependency
        return
    sentry_sdk.set_tag("request_id", request_id)
