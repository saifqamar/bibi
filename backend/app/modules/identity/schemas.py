import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.identity.models import Role, UserStatus

PASSWORD = Field(min_length=8, max_length=128)


class CurrentUser(BaseModel):
    """The signed-in user, as seen by every module's route dependencies."""

    model_config = ConfigDict(frozen=True)

    id: uuid.UUID
    email: str
    role: Role
    display_name: str | None = None

    @property
    def is_admin(self) -> bool:
        return self.role == Role.ADMIN


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    role: Role
    status: UserStatus
    display_name: str | None
    created_at: datetime


class SignupIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = PASSWORD
    display_name: str | None = Field(default=None, max_length=120)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class RefreshIn(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=200)


class SocialLoginIn(BaseModel):
    provider: str = Field(min_length=2, max_length=30)
    id_token: str = Field(min_length=1, max_length=4096)


class AcceptInviteIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=10, max_length=200)
    password: str = PASSWORD
    display_name: str | None = Field(default=None, max_length=120)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class InviteCreateIn(BaseModel):
    email: EmailStr


class InviteOut(BaseModel):
    id: uuid.UUID
    email: str
    status: str  # pending | accepted | revoked | expired
    invited_by: uuid.UUID | None
    expires_at: datetime
    accepted_at: datetime | None
    revoked_at: datetime | None
    created_at: datetime


class WriterOut(UserOut):
    last_login_at: datetime | None
