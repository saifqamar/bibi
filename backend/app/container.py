"""Dependency injection: every adapter and shared service is wired here.

Modules receive the container through ``get_container`` and never construct vendor clients
themselves. Tests build a container with fake adapters.
"""

from dataclasses import dataclass

from fastapi import Request

from app.modules.identity.ports import DisabledSocialAuth, FakeSocialAuth, SocialAuthPort
from app.shared.config import Settings
from app.shared.db import Database
from app.shared.email import ConsoleEmail, EmailPort, FakeEmail, SmtpEmail
from app.shared.jobs import ArqJobQueue, InMemoryJobQueue, JobQueuePort
from app.shared.ratelimit import InMemoryRateLimiter, RateLimiterPort, RedisRateLimiter
from app.shared.storage import InMemoryStorage, LocalStorage, StoragePort


@dataclass
class Container:
    settings: Settings
    db: Database
    storage: StoragePort
    email: EmailPort
    queue: JobQueuePort
    rate_limiter: RateLimiterPort
    social_auth: SocialAuthPort


def _build_storage(settings: Settings) -> StoragePort:
    if settings.storage_backend == "memory":
        return InMemoryStorage(
            secret=settings.secret_key,
            base_url=settings.public_base_url,
            default_ttl=settings.signed_url_ttl_seconds,
        )
    return LocalStorage(
        settings.storage_dir,
        secret=settings.secret_key,
        base_url=settings.public_base_url,
        default_ttl=settings.signed_url_ttl_seconds,
    )


def _build_email(settings: Settings) -> EmailPort:
    if settings.email_backend == "smtp":
        return SmtpEmail(
            settings.smtp_host,
            settings.smtp_port,
            settings.email_from,
            settings.smtp_username,
            settings.smtp_password,
        )
    if settings.email_backend == "fake":
        return FakeEmail()
    return ConsoleEmail()


def _build_queue(settings: Settings) -> JobQueuePort:
    if settings.queue_backend == "arq":
        if not settings.redis_url:
            raise ValueError("BIBI_REDIS_URL is required for the arq queue backend")
        return ArqJobQueue(settings.redis_url)
    return InMemoryJobQueue()


def build_container(settings: Settings) -> Container:
    container = Container(
        settings=settings,
        db=Database(settings.database_url),
        storage=_build_storage(settings),
        email=_build_email(settings),
        queue=_build_queue(settings),
        rate_limiter=(
            RedisRateLimiter(settings.redis_url) if settings.redis_url else InMemoryRateLimiter()
        ),
        social_auth=(
            FakeSocialAuth() if settings.social_auth_backend == "fake" else DisabledSocialAuth()
        ),
    )
    if isinstance(container.queue, InMemoryJobQueue):
        container.queue.container = container
    return container


def get_container(request: Request) -> Container:
    container: Container = request.app.state.container
    return container
