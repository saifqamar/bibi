"""Route dependencies used by every module to authenticate and authorise requests."""

import uuid
from collections.abc import Callable

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.modules.identity.models import Role
from app.modules.identity.schemas import CurrentUser
from app.modules.identity.security import decode_access_token
from app.modules.identity.service import IdentityService
from app.shared.db import get_db
from app.shared.errors import Forbidden, NotFound, Unauthorized

_bearer = HTTPBearer(auto_error=False)


def get_identity_service(request: Request, db: Session = Depends(get_db)) -> IdentityService:
    return IdentityService(db, request.app.state.container)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """Decodes the bearer token and loads the user; deactivated accounts are rejected at once."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise Unauthorized("Sign in required", code="not_authenticated")
    claims = decode_access_token(
        credentials.credentials, secret=request.app.state.container.settings.secret_key
    )
    service = IdentityService(db, request.app.state.container)
    try:
        return service.current_user(claims.user_id)
    except Forbidden as exc:
        raise Unauthorized(exc.message, code=exc.code) from exc


def require_roles(*roles: Role) -> Callable[..., CurrentUser]:
    allowed = set(roles)

    def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed:
            raise Forbidden("You do not have access to this resource")
        return user

    return dependency


require_admin = require_roles(Role.ADMIN)
require_studio = require_roles(Role.WRITER, Role.ADMIN)
require_listener = require_roles(Role.LISTENER, Role.WRITER, Role.ADMIN)


def ensure_owner_or_admin(user: CurrentUser, owner_id: uuid.UUID | None) -> None:
    """Writers only see their own resources; others' resources look like they do not exist."""
    if user.role == Role.ADMIN:
        return
    if owner_id is None or owner_id != user.id:
        raise NotFound("Not found")
