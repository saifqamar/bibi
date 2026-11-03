import uuid
from datetime import datetime

from sqlalchemy import Select, select, update
from sqlalchemy.orm import Session

from app.modules.identity.models import RefreshToken, Role, User, WriterInvite


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def get_user_by_provider(db: Session, provider: str, provider_id: str) -> User | None:
    return db.scalar(select(User).where(User.provider == provider, User.provider_id == provider_id))


def get_refresh_token(db: Session, token_hash: str) -> RefreshToken | None:
    return db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))


def revoke_all_refresh_tokens(db: Session, user_id: uuid.UUID, now: datetime) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=now)
    )


def get_invite_by_hash(db: Session, token_hash: str) -> WriterInvite | None:
    return db.scalar(select(WriterInvite).where(WriterInvite.token_hash == token_hash))


def pending_invites_for(db: Session, email: str, now: datetime) -> list[WriterInvite]:
    return list(
        db.scalars(
            select(WriterInvite).where(
                WriterInvite.email == normalize_email(email),
                WriterInvite.accepted_at.is_(None),
                WriterInvite.revoked_at.is_(None),
                WriterInvite.expires_at > now,
            )
        )
    )


def invites_query() -> Select[WriterInvite]:
    return select(WriterInvite).order_by(WriterInvite.created_at.desc())


def writers_query() -> Select[User]:
    return select(User).where(User.role == Role.WRITER).order_by(User.created_at.desc())
