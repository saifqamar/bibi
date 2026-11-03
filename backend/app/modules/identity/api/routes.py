import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.modules.identity import repository as repo
from app.modules.identity.api.deps import (
    get_current_user,
    get_identity_service,
    require_admin,
)
from app.modules.identity.schemas import (
    AcceptInviteIn,
    CurrentUser,
    InviteCreateIn,
    InviteOut,
    LoginIn,
    RefreshIn,
    SignupIn,
    SocialLoginIn,
    TokenPair,
    UserOut,
    WriterOut,
)
from app.modules.identity.service import IdentityService, invite_out, invite_status
from app.shared.db import get_db
from app.shared.pagination import Page, PageParams, make_page, page_params, paginate
from app.shared.ratelimit import rate_limit

auth_router = APIRouter(prefix="/auth", tags=["auth"])
me_router = APIRouter(prefix="/me", tags=["account"])
admin_router = APIRouter(prefix="/admin", tags=["admin: writers"])

_auth_limit = rate_limit("auth", limit=10, window_seconds=60)


@auth_router.post(
    "/signup",
    response_model=TokenPair,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_auth_limit)],
)
def signup(body: SignupIn, service: IdentityService = Depends(get_identity_service)) -> TokenPair:
    return service.signup(body.email, body.password, body.display_name)


@auth_router.post("/login", response_model=TokenPair, dependencies=[Depends(_auth_limit)])
def login(body: LoginIn, service: IdentityService = Depends(get_identity_service)) -> TokenPair:
    return service.login(body.email, body.password)


@auth_router.post(
    "/refresh",
    response_model=TokenPair,
    dependencies=[Depends(rate_limit("auth-refresh", limit=30, window_seconds=60))],
)
def refresh(body: RefreshIn, service: IdentityService = Depends(get_identity_service)) -> TokenPair:
    return service.refresh(body.refresh_token)


@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(body: RefreshIn, service: IdentityService = Depends(get_identity_service)) -> Response:
    service.logout(body.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@auth_router.post("/social", response_model=TokenPair, dependencies=[Depends(_auth_limit)])
def social_login(
    body: SocialLoginIn, service: IdentityService = Depends(get_identity_service)
) -> TokenPair:
    return service.social_login(body.provider, body.id_token)


@auth_router.post("/accept-invite", response_model=TokenPair, dependencies=[Depends(_auth_limit)])
def accept_invite(
    body: AcceptInviteIn, service: IdentityService = Depends(get_identity_service)
) -> TokenPair:
    return service.accept_invite(body.token, body.password, body.display_name)


@me_router.get("", response_model=CurrentUser)
def me(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return user


@me_router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    user: CurrentUser = Depends(get_current_user),
    service: IdentityService = Depends(get_identity_service),
) -> Response:
    service.delete_account(user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.post("/invites", response_model=InviteOut, status_code=status.HTTP_201_CREATED)
def create_invite(
    body: InviteCreateIn,
    admin: CurrentUser = Depends(require_admin),
    service: IdentityService = Depends(get_identity_service),
) -> InviteOut:
    return service.create_invite(admin, body.email)


@admin_router.get("/invites", response_model=Page[InviteOut])
def list_invites(
    status_filter: str | None = Query(
        None, alias="status", pattern="^(pending|accepted|revoked|expired)$"
    ),
    params: PageParams = Depends(page_params),
    _: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Page[InviteOut]:
    if status_filter is None:
        rows, total = paginate(db, repo.invites_query(), params)
        return make_page([invite_out(r) for r in rows], total, params)
    # Status is derived from timestamps; filter in Python (invite volume is small).
    matching = [
        invite_out(r) for r in db.scalars(repo.invites_query()) if invite_status(r) == status_filter
    ]
    window = matching[params.offset : params.offset + params.limit]
    return make_page(window, len(matching), params)


@admin_router.delete("/invites/{invite_id}", response_model=InviteOut)
def revoke_invite(
    invite_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: IdentityService = Depends(get_identity_service),
) -> InviteOut:
    return service.revoke_invite(admin, invite_id)


@admin_router.post("/invites/{invite_id}/resend", response_model=InviteOut)
def resend_invite(
    invite_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: IdentityService = Depends(get_identity_service),
) -> InviteOut:
    return service.resend_invite(admin, invite_id)


@admin_router.get("/writers", response_model=Page[WriterOut])
def list_writers(
    params: PageParams = Depends(page_params),
    _: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Page[WriterOut]:
    rows, total = paginate(db, repo.writers_query(), params)
    return make_page([WriterOut.model_validate(r) for r in rows], total, params)


@admin_router.post("/writers/{user_id}/deactivate", response_model=UserOut)
def deactivate_writer(
    user_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: IdentityService = Depends(get_identity_service),
) -> UserOut:
    return UserOut.model_validate(service.deactivate_writer(admin, user_id))


@admin_router.post("/writers/{user_id}/reactivate", response_model=UserOut)
def reactivate_writer(
    user_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: IdentityService = Depends(get_identity_service),
) -> UserOut:
    return UserOut.model_validate(service.reactivate_writer(admin, user_id))


routers = [auth_router, me_router, admin_router]
