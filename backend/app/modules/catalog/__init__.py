"""catalog module: series records, shelves, covers and listener visibility.

Other modules may import only the names exported here.
"""

from app.modules.catalog.api.routes import get_catalog_service, read_upload
from app.modules.catalog.models import SeriesStatus
from app.modules.catalog.schemas import (
    ListenerSeriesOut,
    ListenerShelfOut,
    SeriesCreate,
    SeriesOut,
    SeriesUpdate,
)
from app.modules.catalog.service import COVER_MAX_BYTES, CatalogService

__all__ = [
    "COVER_MAX_BYTES",
    "CatalogService",
    "ListenerSeriesOut",
    "ListenerShelfOut",
    "SeriesCreate",
    "SeriesOut",
    "SeriesStatus",
    "SeriesUpdate",
    "get_catalog_service",
    "read_upload",
]
