import uuid

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.modules.catalog.models import SeriesStatus
from app.modules.catalog.schemas import (
    AdminSeriesUpdate,
    AdminShelfOut,
    ListenerSeriesOut,
    ListenerShelfOut,
    SeriesOut,
    ShelfCreate,
    ShelfItemsIn,
    ShelfOrderIn,
    ShelfUpdate,
)
from app.modules.catalog.service import COVER_MAX_BYTES, CatalogService
from app.modules.identity import CurrentUser, require_admin, require_listener
from app.shared.db import get_db
from app.shared.errors import ValidationFailed
from app.shared.pagination import Page, PageParams, make_page, page_params, paginate

listener_router = APIRouter(tags=["catalog"])
admin_router = APIRouter(prefix="/admin", tags=["admin: catalog"])


def get_catalog_service(request: Request, db: Session = Depends(get_db)) -> CatalogService:
    return CatalogService(db, request.app.state.container)


async def read_upload(file: UploadFile, max_bytes: int) -> bytes:
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ValidationFailed("File is too large", code="file_too_large")
    return data


# Listener --------------------------------------------------------------------------------------


@listener_router.get("/shelves", response_model=Page[ListenerShelfOut])
def list_shelves(
    items_per_shelf: int = Query(20, ge=1, le=50),
    params: PageParams = Depends(page_params),
    _: CurrentUser = Depends(require_listener),
    service: CatalogService = Depends(get_catalog_service),
) -> Page[ListenerShelfOut]:
    shelves, total = service.listener_shelves(params, items_per_shelf)
    return make_page(shelves, total, params)


@listener_router.get("/series/{series_id}", response_model=ListenerSeriesOut)
def get_series(
    series_id: uuid.UUID,
    _: CurrentUser = Depends(require_listener),
    service: CatalogService = Depends(get_catalog_service),
) -> ListenerSeriesOut:
    return service.get_listener_series(series_id)


@listener_router.get("/search", response_model=Page[ListenerSeriesOut])
def search(
    q: str = Query(min_length=1, max_length=100),
    params: PageParams = Depends(page_params),
    _: CurrentUser = Depends(require_listener),
    service: CatalogService = Depends(get_catalog_service),
) -> Page[ListenerSeriesOut]:
    items, total = service.search(q, params)
    return make_page(items, total, params)


# Admin: shelves --------------------------------------------------------------------------------


@admin_router.get("/shelves", response_model=list[AdminShelfOut])
def admin_list_shelves(
    _: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> list[AdminShelfOut]:
    return service.list_admin_shelves()


@admin_router.post("/shelves", response_model=AdminShelfOut, status_code=status.HTTP_201_CREATED)
def admin_create_shelf(
    body: ShelfCreate,
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> AdminShelfOut:
    return service.admin_shelf_out(service.create_shelf(admin, body))


@admin_router.put("/shelves/order", status_code=status.HTTP_204_NO_CONTENT)
def admin_reorder_shelves(
    body: ShelfOrderIn,
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> Response:
    service.reorder_shelves(admin, body.shelf_ids)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.put("/shelves/{shelf_id}", response_model=AdminShelfOut)
def admin_update_shelf(
    shelf_id: uuid.UUID,
    body: ShelfUpdate,
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> AdminShelfOut:
    return service.admin_shelf_out(service.update_shelf(admin, shelf_id, body))


@admin_router.delete("/shelves/{shelf_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_shelf(
    shelf_id: uuid.UUID,
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> Response:
    service.delete_shelf(admin, shelf_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_router.put("/shelves/{shelf_id}/items", response_model=AdminShelfOut)
def admin_set_shelf_items(
    shelf_id: uuid.UUID,
    body: ShelfItemsIn,
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> AdminShelfOut:
    return service.admin_shelf_out(service.set_shelf_items(admin, shelf_id, body.series_ids))


# Admin: series ---------------------------------------------------------------------------------


@admin_router.get("/series", response_model=Page[SeriesOut])
def admin_list_series(
    status_filter: SeriesStatus | None = Query(None, alias="status"),
    q: str | None = Query(None, max_length=100),
    params: PageParams = Depends(page_params),
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
    db: Session = Depends(get_db),
) -> Page[SeriesOut]:
    rows, total = paginate(
        db, service.studio_series_query(admin, status=status_filter, q=q), params
    )
    return make_page(service.studio_out_many(list(rows)), total, params)


@admin_router.put("/series/{series_id}", response_model=SeriesOut)
def admin_update_series(
    series_id: uuid.UUID,
    body: AdminSeriesUpdate,
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> SeriesOut:
    return service.studio_out(service.admin_update_series(admin, series_id, body))


@admin_router.post("/series/{series_id}/cover", response_model=SeriesOut)
async def admin_upload_cover(
    series_id: uuid.UUID,
    file: UploadFile = File(...),
    admin: CurrentUser = Depends(require_admin),
    service: CatalogService = Depends(get_catalog_service),
) -> SeriesOut:
    data = await read_upload(file, COVER_MAX_BYTES)
    series = service.upload_cover(admin, series_id, data, file.content_type)
    return service.studio_out(series)


routers = [listener_router, admin_router]
