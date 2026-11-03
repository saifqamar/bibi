"""identity module: users, roles, sessions and writer invites.

Other modules may import only the names exported here.
"""

from app.modules.identity.api.deps import (
    ensure_owner_or_admin,
    get_current_user,
    require_admin,
    require_listener,
    require_roles,
    require_studio,
)
from app.modules.identity.models import Role, UserStatus
from app.modules.identity.schemas import CurrentUser, UserOut
from app.modules.identity.service import lookup_user

__all__ = [
    "CurrentUser",
    "Role",
    "UserOut",
    "UserStatus",
    "ensure_owner_or_admin",
    "get_current_user",
    "lookup_user",
    "require_admin",
    "require_listener",
    "require_roles",
    "require_studio",
]
