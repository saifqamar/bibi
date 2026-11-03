"""Identity service: sign-up, sessions, writer invites and account management."""

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from app.modules.identity import repository as repo
from app.modules.identity.models import RefreshToken, Role, User, UserStatus, WriterInvite
from app.modules.identity.ports import SocialAuthError
from app.modules.identity.schemas import CurrentUser, InviteOut, TokenPair, UserOut
from app.modules.identity.security import (
    create_access_token,
    hash_password,
    hash_token,
    new_opaque_token,
    verify_password,
)
from app.shared.audit import record_audit
from app.shared.email import EmailMessage
from app.shared.errors import Conflict, Forbidden, NotFound, Unauthorized, ValidationFailed
from app.shared.events import emit

if TYPE_CHECKING:
    from app.container import Container

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(UTC)


def invite_status(invite: WriterInvite, now: datetime | None = None) -> str:
    if invite.accepted_at:
        return "accepted"
    if invite.revoked_at:
        return "revoked"
    if invite.expires_at <= (now or _now()):
        return "expired"
    return "pending"


def invite_out(invite: WriterInvite) -> InviteOut:
    return InviteOut(
        id=invite.id,
        email=invite.email,
        status=invite_status(invite),
        invited_by=invite.invited_by,
        expires_at=invite.expires_at,
        accepted_at=invite.accepted_at,
        revoked_at=invite.revoked_at,
        created_at=invite.created_at,
    )


class IdentityService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.settings = container.settings

    # Sessions -------------------------------------------------------------------------------

    def issue_tokens(self, user: User) -> TokenPair:
        refresh = new_opaque_token()
        self.db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=hash_token(refresh),
                expires_at=_now() + timedelta(days=self.settings.refresh_token_ttl_days),
            )
        )
        access = create_access_token(
            user.id,
            user.role.value,
            secret=self.settings.secret_key,
            ttl_minutes=self.settings.access_token_ttl_minutes,
        )
        self.db.flush()
        return TokenPair(
            access_token=access,
            refresh_token=refresh,
            expires_in=self.settings.access_token_ttl_minutes * 60,
            user=UserOut.model_validate(user),
        )

    def signup(self, email: str, password: str, display_name: str | None) -> TokenPair:
        """Public sign-up always creates a listener. Writers only join through invites."""
        if repo.get_user_by_email(self.db, email):
            raise Conflict("An account with this email already exists", code="email_in_use")
        user = User(
            email=repo.normalize_email(email),
            password_hash=hash_password(password),
            role=Role.LISTENER,
            display_name=display_name,
            last_login_at=_now(),
        )
        self.db.add(user)
        self.db.flush()
        return self.issue_tokens(user)

    def login(self, email: str, password: str) -> TokenPair:
        user = repo.get_user_by_email(self.db, email)
        if not verify_password(password, user.password_hash if user else None) or user is None:
            raise Unauthorized("Wrong email or password", code="invalid_credentials")
        self._ensure_active(user)
        user.last_login_at = _now()
        return self.issue_tokens(user)

    def refresh(self, refresh_token: str) -> TokenPair:
        stored = repo.get_refresh_token(self.db, hash_token(refresh_token))
        now = _now()
        if stored is None:
            raise Unauthorized("Invalid refresh token", code="invalid_refresh_token")
        if stored.revoked_at is not None:
            # A rotated token was used again: treat as theft and end every session.
            repo.revoke_all_refresh_tokens(self.db, stored.user_id, now)
            self.db.commit()
            raise Unauthorized("Refresh token was already used", code="refresh_token_reused")
        if stored.expires_at <= now:
            raise Unauthorized("Refresh token expired", code="refresh_token_expired")
        user = repo.get_user(self.db, stored.user_id)
        if user is None:
            raise Unauthorized("Invalid refresh token", code="invalid_refresh_token")
        self._ensure_active(user)
        stored.revoked_at = now
        return self.issue_tokens(user)

    def logout(self, refresh_token: str) -> None:
        stored = repo.get_refresh_token(self.db, hash_token(refresh_token))
        if stored and stored.revoked_at is None:
            stored.revoked_at = _now()

    def social_login(self, provider: str, id_token: str) -> TokenPair:
        try:
            identity = self.container.social_auth.verify(provider, id_token)
        except SocialAuthError as exc:
            raise Unauthorized(str(exc), code="social_auth_failed") from exc
        user = repo.get_user_by_provider(self.db, provider, identity.provider_id)
        if user is None:
            user = repo.get_user_by_email(self.db, identity.email)
            if user is not None and user.provider is None:
                # Same verified email: link the provider to the existing account.
                user.provider, user.provider_id = provider, identity.provider_id
            elif user is None:
                user = User(
                    email=repo.normalize_email(identity.email),
                    provider=provider,
                    provider_id=identity.provider_id,
                    role=Role.LISTENER,
                    display_name=identity.name,
                )
                self.db.add(user)
                self.db.flush()
            else:
                raise Conflict("Account is linked to another provider", code="provider_mismatch")
        self._ensure_active(user)
        user.last_login_at = _now()
        return self.issue_tokens(user)

    def current_user(self, user_id: uuid.UUID) -> CurrentUser:
        user = repo.get_user(self.db, user_id)
        if user is None:
            raise Unauthorized("Account not found", code="invalid_token")
        self._ensure_active(user)
        return CurrentUser(
            id=user.id, email=user.email, role=user.role, display_name=user.display_name
        )

    @staticmethod
    def _ensure_active(user: User) -> None:
        if user.status != UserStatus.ACTIVE:
            raise Forbidden("This account is deactivated", code="account_deactivated")

    # Writer invites ------------------------------------------------------------------------

    def _send_invite_email(self, email: str, token: str) -> None:
        link = f"{self.settings.studio_url.rstrip('/')}/accept-invite?token={token}"
        self.container.email.send(
            EmailMessage(
                to=email,
                subject="You're invited to write for Bibi",
                text=(
                    "You have been invited to join Bibi Studio as a writer.\n\n"
                    f"Accept the invite and set your password here:\n{link}\n\n"
                    f"The link expires in {self.settings.invite_ttl_days} days and works once."
                ),
            )
        )

    def create_invite(self, admin: CurrentUser, email: str) -> InviteOut:
        email = repo.normalize_email(email)
        existing = repo.get_user_by_email(self.db, email)
        if existing and existing.role in (Role.WRITER, Role.ADMIN):
            raise Conflict("This person already has Studio access", code="already_writer")
        if existing:
            raise Conflict("This email belongs to a listener account", code="email_in_use")
        now = _now()
        for old in repo.pending_invites_for(self.db, email, now):
            old.revoked_at = now
        token = new_opaque_token()
        invite = WriterInvite(
            email=email,
            token_hash=hash_token(token),
            invited_by=admin.id,
            expires_at=now + timedelta(days=self.settings.invite_ttl_days),
        )
        self.db.add(invite)
        self.db.flush()
        record_audit(
            self.db,
            actor_id=admin.id,
            action="invite.create",
            entity_type="writer_invite",
            entity_id=invite.id,
            metadata={"email": email},
        )
        self._send_invite_email(email, token)
        return invite_out(invite)

    def _get_invite(self, invite_id: uuid.UUID) -> WriterInvite:
        invite = self.db.get(WriterInvite, invite_id)
        if invite is None:
            raise NotFound("Invite not found")
        return invite

    def resend_invite(self, admin: CurrentUser, invite_id: uuid.UUID) -> InviteOut:
        invite = self._get_invite(invite_id)
        if invite.accepted_at or invite.revoked_at:
            raise Conflict("Invite is no longer pending", code="invite_not_pending")
        token = new_opaque_token()
        invite.token_hash = hash_token(token)  # the old link stops working
        invite.expires_at = _now() + timedelta(days=self.settings.invite_ttl_days)
        record_audit(
            self.db,
            actor_id=admin.id,
            action="invite.resend",
            entity_type="writer_invite",
            entity_id=invite.id,
        )
        self._send_invite_email(invite.email, token)
        return invite_out(invite)

    def revoke_invite(self, admin: CurrentUser, invite_id: uuid.UUID) -> InviteOut:
        invite = self._get_invite(invite_id)
        if invite.accepted_at:
            raise Conflict("Invite was already accepted", code="invite_not_pending")
        if invite.revoked_at is None:
            invite.revoked_at = _now()
            record_audit(
                self.db,
                actor_id=admin.id,
                action="invite.revoke",
                entity_type="writer_invite",
                entity_id=invite.id,
            )
        return invite_out(invite)

    def accept_invite(self, token: str, password: str, display_name: str | None) -> TokenPair:
        invite = repo.get_invite_by_hash(self.db, hash_token(token))
        if invite is None or invite_status(invite) != "pending":
            raise ValidationFailed("This invite link is invalid or expired", code="invalid_invite")
        if repo.get_user_by_email(self.db, invite.email):
            raise Conflict("An account with this email already exists", code="email_in_use")
        user = User(
            email=invite.email,
            password_hash=hash_password(password),
            role=Role.WRITER,
            display_name=display_name,
            last_login_at=_now(),
        )
        self.db.add(user)
        self.db.flush()
        invite.accepted_at = _now()
        invite.accepted_user_id = user.id
        record_audit(
            self.db,
            actor_id=user.id,
            action="invite.accept",
            entity_type="writer_invite",
            entity_id=invite.id,
        )
        return self.issue_tokens(user)

    # Writer management ---------------------------------------------------------------------

    def _get_writer(self, user_id: uuid.UUID) -> User:
        user = repo.get_user(self.db, user_id)
        if user is None or user.role != Role.WRITER:
            raise NotFound("Writer not found")
        return user

    def deactivate_writer(self, admin: CurrentUser, user_id: uuid.UUID) -> User:
        user = self._get_writer(user_id)
        if user.status != UserStatus.DEACTIVATED:
            user.status = UserStatus.DEACTIVATED
            repo.revoke_all_refresh_tokens(self.db, user.id, _now())
            record_audit(
                self.db,
                actor_id=admin.id,
                action="writer.deactivate",
                entity_type="user",
                entity_id=user.id,
            )
        return user

    def reactivate_writer(self, admin: CurrentUser, user_id: uuid.UUID) -> User:
        user = self._get_writer(user_id)
        if user.status != UserStatus.ACTIVE:
            user.status = UserStatus.ACTIVE
            record_audit(
                self.db,
                actor_id=admin.id,
                action="writer.reactivate",
                entity_type="user",
                entity_id=user.id,
            )
        return user

    # Account ---------------------------------------------------------------------------------

    def delete_account(self, current: CurrentUser) -> None:
        if current.role != Role.LISTENER:
            raise Forbidden(
                "Studio accounts are removed by an admin", code="account_deletion_not_allowed"
            )
        user = repo.get_user(self.db, current.id)
        if user is None:
            raise NotFound("Account not found")
        emit("user_deleted", db=self.db, user_id=user.id)
        self.db.delete(user)
        logger.info("account_deleted", extra={"user_id": str(user.id)})

    def create_admin(self, email: str, password: str) -> User:
        if repo.get_user_by_email(self.db, email):
            raise Conflict("An account with this email already exists", code="email_in_use")
        user = User(
            email=repo.normalize_email(email),
            password_hash=hash_password(password),
            role=Role.ADMIN,
        )
        self.db.add(user)
        self.db.flush()
        record_audit(
            self.db, actor_id=None, action="admin.seed", entity_type="user", entity_id=user.id
        )
        return user


def lookup_user(db: Session, user_id: uuid.UUID) -> UserOut | None:
    """Public read for other modules (e.g. checking that a new series owner is a writer)."""
    user = repo.get_user(db, user_id)
    return UserOut.model_validate(user) if user else None
