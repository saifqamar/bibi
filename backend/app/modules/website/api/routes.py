"""Public website API: no sign-in, published content only, short shared caching."""

import uuid

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy.orm import Session

from app.modules.audio import AudioService, SampleOut
from app.modules.catalog import CatalogService, ListenerSeriesOut, ListenerShelfOut
from app.modules.website.schemas import PublicSeriesDetail, SitemapEntry
from app.modules.website.service import WebsiteService
from app.shared.db import get_db
from app.shared.pagination import Page, PageParams, make_page, page_params
from app.shared.ratelimit import rate_limit

# Pages stay fresh within the website's 5-minute revalidation window; an unpublished series
# disappears from caches within that window too.
PUBLIC_CACHE = "public, max-age=60, s-maxage=300"

router = APIRouter(
    prefix="/public",
    tags=["public website"],
    dependencies=[Depends(rate_limit("public", limit=300, window_seconds=60))],
)


def _cache(response: Response, value: str = PUBLIC_CACHE) -> None:
    response.headers["Cache-Control"] = value


def get_website_service(request: Request, db: Session = Depends(get_db)) -> WebsiteService:
    return WebsiteService(db, request.app.state.container)


def get_catalog(request: Request, db: Session = Depends(get_db)) -> CatalogService:
    return CatalogService(db, request.app.state.container)


@router.get("/series", response_model=Page[ListenerSeriesOut])
def list_series(
    response: Response,
    params: PageParams = Depends(page_params),
    catalog: CatalogService = Depends(get_catalog),
) -> Page[ListenerSeriesOut]:
    _cache(response)
    items, total = catalog.public_series(params)
    return make_page(items, total, params)


@router.get("/series/{series_id}", response_model=PublicSeriesDetail)
def get_series(
    series_id: uuid.UUID,
    response: Response,
    service: WebsiteService = Depends(get_website_service),
) -> PublicSeriesDetail:
    _cache(response)
    return service.series_detail(series_id)


@router.get("/series/{series_id}/sample", response_model=SampleOut)
def get_sample(
    series_id: uuid.UUID,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> SampleOut:
    # The URL is signed and short-lived, so the answer must not be cached for long.
    _cache(response, "public, max-age=60")
    container = request.app.state.container
    CatalogService(db, container).get_public_series(series_id)
    return AudioService(db, container).public_sample(series_id)


@router.get("/shelves", response_model=Page[ListenerShelfOut])
def list_shelves(
    response: Response,
    items_per_shelf: int = Query(12, ge=1, le=50),
    params: PageParams = Depends(page_params),
    catalog: CatalogService = Depends(get_catalog),
) -> Page[ListenerShelfOut]:
    _cache(response)
    shelves, total = catalog.listener_shelves(params, items_per_shelf)
    return make_page(shelves, total, params)


@router.get("/shelves/{shelf_id}", response_model=ListenerShelfOut)
def get_shelf(
    shelf_id: uuid.UUID,
    response: Response,
    limit: int = Query(50, ge=1, le=100),
    catalog: CatalogService = Depends(get_catalog),
) -> ListenerShelfOut:
    _cache(response)
    return catalog.public_shelf(shelf_id, limit)


@router.get("/sitemap", response_model=list[SitemapEntry])
def sitemap(
    response: Response, service: WebsiteService = Depends(get_website_service)
) -> list[SitemapEntry]:
    _cache(response)
    return service.sitemap()


routers = [router]
