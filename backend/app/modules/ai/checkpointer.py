"""LangGraph Postgres checkpointer, one connection pool per process."""

from functools import lru_cache

from langgraph.checkpoint.postgres import PostgresSaver
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


def _plain_dsn(database_url: str) -> str:
    return database_url.replace("postgresql+psycopg://", "postgresql://", 1)


@lru_cache
def get_checkpointer(database_url: str) -> PostgresSaver:
    pool = ConnectionPool(
        _plain_dsn(database_url),
        kwargs={"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row},
        min_size=1,
        max_size=5,
        open=True,
    )
    saver = PostgresSaver(pool)  # type: ignore[arg-type]
    saver.setup()  # creates or migrates the checkpoint tables
    return saver
