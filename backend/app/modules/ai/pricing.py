"""Cost calculation from the price table. Costs are stored on each usage row, so later price
changes never rewrite history."""

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.ai.models import AIPrice

MILLION = Decimal(1_000_000)


def unit_price(db: Session, provider: str, model: str, unit: str) -> Decimal:
    price = db.scalar(
        select(AIPrice.usd_per_million)
        .where(
            AIPrice.provider == provider,
            AIPrice.model == model,
            AIPrice.unit == unit,
            AIPrice.effective_from <= datetime.now(UTC),
        )
        .order_by(AIPrice.effective_from.desc())
        .limit(1)
    )
    return price if price is not None else Decimal(0)


def compute_cost(
    db: Session,
    provider: str,
    model: str,
    *,
    input_tokens: int = 0,
    output_tokens: int = 0,
    embedding_tokens: int = 0,
    tts_characters: int = 0,
) -> Decimal:
    amounts = {
        "input_token": input_tokens,
        "output_token": output_tokens,
        "embedding_token": embedding_tokens,
        "tts_char": tts_characters,
    }
    total = sum(
        (unit_price(db, provider, model, unit) * amount / MILLION)
        for unit, amount in amounts.items()
        if amount
    )
    return Decimal(total).quantize(Decimal("0.000001"))


# Mirrors the seed in migration 0006 (USD per million units).
DEFAULT_PRICES: list[tuple[str, str, str, str]] = [
    ("anthropic", "claude-opus-5-5", "input_token", "4.00"),
    ("anthropic", "claude-opus-5-5", "output_token", "20.00"),
    ("anthropic", "claude-sonnet-5-5", "input_token", "2.00"),
    ("anthropic", "claude-sonnet-5-5", "output_token", "10.00"),
    ("anthropic", "claude-haiku-5-5", "input_token", "0.10"),
    ("anthropic", "claude-haiku-5-5", "output_token", "0.50"),
    ("anthropic", "claude-opus-4-8", "input_token", "5.00"),
    ("anthropic", "claude-opus-4-8", "output_token", "25.00"),
    ("fake", "fake-llm", "input_token", "1.00"),
    ("fake", "fake-llm", "output_token", "2.00"),
    ("fake", "fake-embedding", "embedding_token", "0.10"),
    ("fake", "fake-tts", "tts_char", "15.00"),
]


def seed_default_prices(db: Session) -> None:
    for provider, model, unit, price in DEFAULT_PRICES:
        db.add(
            AIPrice(
                provider=provider,
                model=model,
                unit=unit,
                usd_per_million=Decimal(price),
                effective_from=datetime(2026, 1, 1, tzinfo=UTC),
            )
        )
