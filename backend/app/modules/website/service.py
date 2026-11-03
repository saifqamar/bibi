import uuid
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from app.modules.audio import AudioService
from app.modules.catalog import CatalogService
from app.modules.website.schemas import PublicSeriesDetail, SitemapEntry
from app.modules.writing import EpisodeService, listener_episode
from app.shared.errors import NotFound
from app.shared.pagination import PageParams

if TYPE_CHECKING:
    from app.container import Container

SITEMAP_LIMIT = 50_000  # the sitemap protocol's per-file maximum


class WebsiteService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.catalog = CatalogService(db, container)
        self.episodes = EpisodeService(db, container)
        self.audio = AudioService(db, container)

    def series_detail(self, series_id: uuid.UUID) -> PublicSeriesDetail:
        series = self.catalog.get_public_series(series_id)
        episodes = [
            listener_episode(e, series.free_episode_count)
            for e in self.episodes.live_episodes(series_id)
        ]
        try:
            self.audio.public_sample(series_id)
            has_sample = True
        except NotFound:
            has_sample = False
        return PublicSeriesDetail(series=series, episodes=episodes, has_sample=has_sample)

    def sitemap(self) -> list[SitemapEntry]:
        items, _ = self.catalog.public_series(PageParams(limit=SITEMAP_LIMIT, offset=0))
        return [SitemapEntry(id=s.id, title=s.title, updated_at=s.published_at) for s in items]
