"""Alembic environment. The database URL comes from settings (env vars), never from alembic.ini."""

from alembic import context
from sqlalchemy import create_engine

from app.db_models import metadata
from app.shared.config import get_settings

config = context.config

# Tables managed by other tools' own migrations (LangGraph's Postgres checkpointer).
EXTERNAL_TABLES = {"checkpoints", "checkpoint_blobs", "checkpoint_writes", "checkpoint_migrations"}


def include_object(
    obj: object, name: str | None, type_: str, reflected: bool, compare_to: object
) -> bool:
    if type_ == "table" and name in EXTERNAL_TABLES:
        return False
    table = getattr(obj, "table", None)
    return not (type_ == "index" and table is not None and table.name in EXTERNAL_TABLES)


def _url() -> str:
    return config.attributes.get("database_url") or get_settings().database_url


def run_migrations_offline() -> None:
    context.configure(url=_url(), target_metadata=metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(_url())
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=metadata,
            compare_type=True,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
