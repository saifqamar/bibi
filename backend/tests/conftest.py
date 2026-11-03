"""Test harness: a migrated Postgres test database, fake adapters and a TestClient.

Set ``TEST_DATABASE_URL`` to point at a disposable database (its ``public`` schema is reset).
"""

import os
from collections.abc import Callable, Iterator
from typing import Any

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.container import Container, build_container
from app.main import create_app
from app.modules.ai.pricing import seed_default_prices
from app.modules.identity.models import Role
from app.shared.config import Settings
from app.shared.db import Database
from tests.factories import TestUser, make_user

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/bibi_test"
)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def make_settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "env": "test",
        "database_url": TEST_DATABASE_URL,
        "redis_url": None,
        "secret_key": "test-secret-key-for-tests-only-0123456789",
        "storage_backend": "memory",
        "email_backend": "fake",
        "queue_backend": "memory",
        "public_base_url": "http://testserver",
        "log_level": "WARNING",
        "social_auth_backend": "fake",
        "tracing_backend": "noop",
    }
    values.update(overrides)
    return Settings(**values)  # type: ignore[arg-type]


@pytest.fixture(scope="session")
def database() -> Iterator[Database]:
    db = Database(TEST_DATABASE_URL)
    with db.engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BACKEND_DIR, "migrations"))
    cfg.attributes["database_url"] = TEST_DATABASE_URL
    command.upgrade(cfg, "head")
    with db.engine.begin() as conn:  # start every test from the same seed
        conn.execute(text("TRUNCATE ai_prices"))
    _seed_reference_data(db)
    yield db
    db.dispose()


@pytest.fixture(autouse=True)
def _clean_tables(database: Database) -> Iterator[None]:
    yield
    with database.engine.begin() as conn:
        tables = conn.execute(
            text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' "
                "AND tablename NOT IN ('alembic_version')"
            )
        ).scalars()
        names = ", ".join(f'"{t}"' for t in tables)
        if names:
            conn.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))
    _seed_reference_data(database)


def _seed_reference_data(database: Database) -> None:
    """Reference rows that migrations seed; restored after every truncation."""
    with database.session() as session:
        seed_default_prices(session)
        session.commit()


@pytest.fixture
def settings() -> Settings:
    return make_settings()


@pytest.fixture
def container(settings: Settings, database: Database) -> Container:
    built = build_container(settings)
    built.db.dispose()
    built.db = database
    built.retry_sleep = lambda _seconds: None  # no real waiting in tests
    return built


@pytest.fixture
def app(container: Container) -> FastAPI:
    return create_app(container=container)


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db(container: Container) -> Iterator[Session]:
    session = container.db.session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def make(db: Session, container: Container) -> Callable[..., TestUser]:
    """``make(Role.WRITER)`` creates a user and returns it with auth headers."""

    def _make(role: Role = Role.LISTENER, **kwargs: Any) -> TestUser:
        return make_user(db, container, role, **kwargs)

    return _make
