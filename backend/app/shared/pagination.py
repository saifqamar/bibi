"""Offset pagination used by every list endpoint."""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from fastapi import Query
from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

MAX_LIMIT = 100


@dataclass(frozen=True)
class PageParams:
    limit: int = 20
    offset: int = 0


def page_params(
    limit: int = Query(20, ge=1, le=MAX_LIMIT),
    offset: int = Query(0, ge=0),
) -> PageParams:
    return PageParams(limit=limit, offset=offset)


class Page[T](BaseModel):
    items: list[T]
    total: int
    limit: int
    offset: int


def paginate(db: Session, stmt: Select[Any], params: PageParams) -> tuple[Sequence[Any], int]:
    """Run ``stmt`` with limit/offset and return ``(rows, total)``."""
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = db.scalars(stmt.limit(params.limit).offset(params.offset)).all()
    return rows, total


def make_page[T](items: list[T], total: int, params: PageParams) -> Page[T]:
    return Page[T](items=items, total=total, limit=params.limit, offset=params.offset)
