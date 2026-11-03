import uuid
from datetime import datetime

from pydantic import BaseModel

from app.modules.catalog import ListenerSeriesOut
from app.modules.writing import ListenerEpisodeOut


class PublicSeriesDetail(BaseModel):
    series: ListenerSeriesOut
    episodes: list[ListenerEpisodeOut]
    has_sample: bool


class SitemapEntry(BaseModel):
    id: uuid.UUID
    title: str
    updated_at: datetime | None
