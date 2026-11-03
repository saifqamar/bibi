"""FastAPI application factory."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import job_modules  # noqa: F401  (registers background jobs)
from app.container import Container, build_container
from app.modules.admin.api.routes import routers as admin_routers
from app.modules.ai.api.routes import routers as ai_routers
from app.modules.analytics.api.routes import routers as analytics_routers
from app.modules.audio.api.routes import routers as audio_routers
from app.modules.catalog.api.routes import routers as catalog_routers
from app.modules.identity.api.routes import routers as identity_routers
from app.modules.listening.api.routes import routers as listening_routers
from app.modules.writing.api.routes import routers as writing_routers
from app.shared import media
from app.shared.config import Settings, get_settings
from app.shared.errors import install_error_handlers
from app.shared.logging import configure_logging
from app.shared.middleware import BodySizeLimitMiddleware, RequestIdMiddleware
from app.shared.monitoring import init_sentry


def create_app(settings: Settings | None = None, container: Container | None = None) -> FastAPI:
    settings = container.settings if container else (settings or get_settings())
    configure_logging(settings.log_level)
    init_sentry(settings, component="api")
    app = FastAPI(title=f"{settings.app_name} API", version="0.1.0")
    app.state.settings = settings
    app.state.container = container or build_container(settings)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    app.add_middleware(
        BodySizeLimitMiddleware, limits={f"{settings.api_prefix}/events": 256 * 1024}
    )
    app.add_middleware(RequestIdMiddleware)
    install_error_handlers(app)

    api = APIRouter(prefix=settings.api_prefix)

    @api.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    for router in [
        *identity_routers,
        *catalog_routers,
        *writing_routers,
        *ai_routers,
        *audio_routers,
        *admin_routers,
        *listening_routers,
        *analytics_routers,
    ]:
        api.include_router(router)

    app.include_router(api)
    app.include_router(media.router)
    return app


app = create_app()
