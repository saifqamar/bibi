import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.modules.catalog import (
    COVER_MAX_BYTES,
    CatalogService,
    SeriesCreate,
    SeriesOut,
    SeriesStatus,
    SeriesUpdate,
    get_catalog_service,
    read_upload,
)
from app.modules.identity import CurrentUser, require_studio
from app.modules.writing.models import ProposalStatus
from app.modules.writing.schemas import BibleOut, ProposalAcceptIn, ProposalOut
from app.modules.writing.service import ENTITIES, BibleService, EntitySpec
from app.shared.db import get_db
from app.shared.pagination import Page, PageParams, make_page, page_params, paginate

router = APIRouter(prefix="/studio", tags=["studio: series and bible"])


def get_bible_service(request: Request, db: Session = Depends(get_db)) -> BibleService:
    return BibleService(db, request.app.state.container)


# Series ----------------------------------------------------------------------------------------


@router.get("/series", response_model=Page[SeriesOut])
def list_series(
    status_filter: SeriesStatus | None = Query(None, alias="status"),
    q: str | None = Query(None, max_length=100),
    params: PageParams = Depends(page_params),
    user: CurrentUser = Depends(require_studio),
    catalog: CatalogService = Depends(get_catalog_service),
    db: Session = Depends(get_db),
) -> Page[SeriesOut]:
    stmt = catalog.studio_series_query(user, status=status_filter, q=q)
    rows, total = paginate(db, stmt, params)
    return make_page(catalog.studio_out_many(list(rows)), total, params)


@router.post("/series", response_model=SeriesOut, status_code=status.HTTP_201_CREATED)
def create_series(
    body: SeriesCreate,
    user: CurrentUser = Depends(require_studio),
    catalog: CatalogService = Depends(get_catalog_service),
) -> SeriesOut:
    return catalog.studio_out(catalog.create_series(user, body))


@router.get("/series/{series_id}", response_model=SeriesOut)
def get_series(
    series_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    catalog: CatalogService = Depends(get_catalog_service),
) -> SeriesOut:
    return catalog.studio_out(catalog.get_series_for_user(user, series_id))


@router.put("/series/{series_id}", response_model=SeriesOut)
def update_series(
    series_id: uuid.UUID,
    body: SeriesUpdate,
    user: CurrentUser = Depends(require_studio),
    catalog: CatalogService = Depends(get_catalog_service),
) -> SeriesOut:
    return catalog.studio_out(catalog.update_series(user, series_id, body))


@router.post("/series/{series_id}/cover", response_model=SeriesOut)
async def upload_cover(
    series_id: uuid.UUID,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(require_studio),
    catalog: CatalogService = Depends(get_catalog_service),
) -> SeriesOut:
    data = await read_upload(file, COVER_MAX_BYTES)
    return catalog.studio_out(catalog.upload_cover(user, series_id, data, file.content_type))


# Bible -----------------------------------------------------------------------------------------


@router.get("/series/{series_id}/bible", response_model=BibleOut)
def get_bible(
    series_id: uuid.UUID,
    q: str | None = Query(None, max_length=100),
    user: CurrentUser = Depends(require_studio),
    service: BibleService = Depends(get_bible_service),
) -> BibleOut:
    return service.bible(user, series_id, q)


def _add_entity_routes(entity_type: str, spec: EntitySpec) -> None:
    create_model: Any = spec.create
    update_model: Any = spec.update
    out_model: Any = spec.out
    name = entity_type.replace("-", "_")
    base = f"/series/{{series_id}}/{entity_type}"

    def list_entities(
        series_id: uuid.UUID,
        q: str | None = Query(None, max_length=100),
        user: CurrentUser = Depends(require_studio),
        service: BibleService = Depends(get_bible_service),
    ) -> list[BaseModel]:
        return service.list_entries(user, series_id, entity_type, q)

    def create_entity(
        series_id: uuid.UUID,
        body: create_model,
        user: CurrentUser = Depends(require_studio),
        service: BibleService = Depends(get_bible_service),
    ) -> BaseModel:
        return service.create(user, series_id, entity_type, body)

    def get_entity(
        series_id: uuid.UUID,
        entity_id: uuid.UUID,
        user: CurrentUser = Depends(require_studio),
        service: BibleService = Depends(get_bible_service),
    ) -> BaseModel:
        return service.get(user, series_id, entity_type, entity_id)

    def update_entity(
        series_id: uuid.UUID,
        entity_id: uuid.UUID,
        body: update_model,
        user: CurrentUser = Depends(require_studio),
        service: BibleService = Depends(get_bible_service),
    ) -> BaseModel:
        return service.update(user, series_id, entity_type, entity_id, body)

    def delete_entity(
        series_id: uuid.UUID,
        entity_id: uuid.UUID,
        force: bool = Query(False, description="Delete even if other entries use it"),
        user: CurrentUser = Depends(require_studio),
        service: BibleService = Depends(get_bible_service),
    ) -> Response:
        service.delete(user, series_id, entity_type, entity_id, force=force)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    router.add_api_route(
        base, list_entities, methods=["GET"], response_model=list[out_model], name=f"list_{name}"
    )
    router.add_api_route(
        base,
        create_entity,
        methods=["POST"],
        response_model=out_model,
        status_code=status.HTTP_201_CREATED,
        name=f"create_{name}",
    )
    router.add_api_route(
        f"{base}/{{entity_id}}",
        get_entity,
        methods=["GET"],
        response_model=out_model,
        name=f"get_{name}",
    )
    router.add_api_route(
        f"{base}/{{entity_id}}",
        update_entity,
        methods=["PUT"],
        response_model=out_model,
        name=f"update_{name}",
    )
    router.add_api_route(
        f"{base}/{{entity_id}}",
        delete_entity,
        methods=["DELETE"],
        status_code=status.HTTP_204_NO_CONTENT,
        response_class=Response,
        name=f"delete_{name}",
    )


for _entity_type, _spec in ENTITIES.items():
    _add_entity_routes(_entity_type, _spec)


# Canon proposals -------------------------------------------------------------------------------


@router.get("/series/{series_id}/canon-proposals", response_model=list[ProposalOut])
def list_proposals(
    series_id: uuid.UUID,
    status_filter: ProposalStatus | None = Query(None, alias="status"),
    user: CurrentUser = Depends(require_studio),
    service: BibleService = Depends(get_bible_service),
) -> list[ProposalOut]:
    return service.list_proposals(user, series_id, status_filter)


@router.post("/canon-proposals/{proposal_id}/accept", response_model=ProposalOut)
def accept_proposal(
    proposal_id: uuid.UUID,
    body: ProposalAcceptIn | None = None,
    user: CurrentUser = Depends(require_studio),
    service: BibleService = Depends(get_bible_service),
) -> ProposalOut:
    return service.accept(user, proposal_id, body.payload if body else None)


@router.post("/canon-proposals/{proposal_id}/reject", response_model=ProposalOut)
def reject_proposal(
    proposal_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: BibleService = Depends(get_bible_service),
) -> ProposalOut:
    return service.reject(user, proposal_id)


from app.modules.writing.api.episodes import router as episodes_router  # noqa: E402

routers = [router, episodes_router]
