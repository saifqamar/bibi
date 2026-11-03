import uuid
from datetime import date

from sqlalchemy import BigInteger, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.db import Base


class EpisodeDailyStats(Base):
    __tablename__ = "episode_daily_stats"

    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), primary_key=True
    )
    day: Mapped[date] = mapped_column(Date, primary_key=True)
    series_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("series.id", ondelete="CASCADE"), index=True
    )
    plays: Mapped[int] = mapped_column(Integer, default=0)
    completions: Mapped[int] = mapped_column(Integer, default=0)
    next_episode_starts: Mapped[int] = mapped_column(Integer, default=0)


class EpisodeDropoffMinute(Base):
    __tablename__ = "episode_dropoff_minutes"

    episode_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("episodes.id", ondelete="CASCADE"), primary_key=True
    )
    minute: Mapped[int] = mapped_column(Integer, primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0)


class UserActivityDay(Base):
    """One row per user per day with listening activity (for day-1/7/30 return rates)."""

    __tablename__ = "user_activity_days"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    day: Mapped[date] = mapped_column(Date, primary_key=True)


class AnalyticsWatermark(Base):
    __tablename__ = "analytics_watermarks"

    name: Mapped[str] = mapped_column(String(40), primary_key=True)
    last_seq: Mapped[int] = mapped_column(BigInteger, default=0)
