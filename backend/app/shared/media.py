"""Serves stored files behind signed, expiring URLs (development storage backend)."""

from fastapi import APIRouter, Query, Request, Response

from app.shared.errors import Forbidden
from app.shared.storage import guess_content_type

router = APIRouter(tags=["media"])


@router.get("/media/{key:path}", include_in_schema=False)
def get_media(
    key: str, request: Request, expires: int = Query(...), sig: str = Query(...)
) -> Response:
    storage = request.app.state.container.storage
    if not storage.verify(key, expires, sig):
        raise Forbidden("Link expired or invalid", code="invalid_signature")
    data = storage.get(key)
    return Response(
        content=data,
        media_type=guess_content_type(key),
        headers={"Cache-Control": "private, max-age=300"},
    )
