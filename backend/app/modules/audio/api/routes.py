import uuid

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.modules.audio.models import AudioRender
from app.modules.audio.schemas import (
    AssignmentsIn,
    AssignmentsOut,
    EpisodeAudioOut,
    LineTextIn,
    PlaybackOut,
    StartRenderOut,
    VoiceIn,
    VoiceOut,
    VoicePreviewOut,
    VoiceUpdate,
)
from app.modules.audio.service import AudioService, CastingService, VoiceService
from app.modules.identity import CurrentUser, require_admin, require_listener, require_studio
from app.shared.db import get_db
from app.shared.ratelimit import rate_limit

studio_router = APIRouter(prefix="/studio", tags=["studio: voices and audio"])
admin_router = APIRouter(prefix="/admin", tags=["admin: voices"])
listener_router = APIRouter(tags=["listening"])
_audio_limit = rate_limit("audio", limit=30, window_seconds=60)


def get_audio_service(request: Request, db: Session = Depends(get_db)) -> AudioService:
    return AudioService(db, request.app.state.container)


def get_voice_service(request: Request, db: Session = Depends(get_db)) -> VoiceService:
    return VoiceService(db, request.app.state.container)


def get_casting_service(request: Request, db: Session = Depends(get_db)) -> CastingService:
    return CastingService(db, request.app.state.container)


@studio_router.get("/voices", response_model=list[VoiceOut])
def list_voices(
    _: CurrentUser = Depends(require_studio), voices: VoiceService = Depends(get_voice_service)
) -> list[VoiceOut]:
    return [VoiceOut.model_validate(v) for v in voices.list(active_only=True)]


@studio_router.get(
    "/voices/{voice_id}/preview",
    response_model=VoicePreviewOut,
    responses={202: {"model": VoicePreviewOut, "description": "Preview is being generated"}},
)
def voice_preview(
    voice_id: uuid.UUID,
    response: Response,
    _: CurrentUser = Depends(require_studio),
    voices: VoiceService = Depends(get_voice_service),
) -> VoicePreviewOut:
    url = voices.preview_url(voice_id)
    if url is None:
        response.status_code = status.HTTP_202_ACCEPTED
    return VoicePreviewOut(url=url)


@studio_router.get("/series/{series_id}/voice-assignments", response_model=AssignmentsOut)
def get_cast(
    series_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    casting: CastingService = Depends(get_casting_service),
) -> AssignmentsOut:
    return casting.cast(user, series_id)


@studio_router.put("/series/{series_id}/voice-assignments", response_model=AssignmentsOut)
def set_cast(
    series_id: uuid.UUID,
    body: AssignmentsIn,
    user: CurrentUser = Depends(require_studio),
    casting: CastingService = Depends(get_casting_service),
) -> AssignmentsOut:
    casting.set(user, series_id, body.assignments)
    return casting.cast(user, series_id)


def _started(service: AudioService, render: AudioRender) -> StartRenderOut:
    assert render.workflow_run_id is not None
    return StartRenderOut(render_id=render.id, workflow_run_id=render.workflow_run_id)


@studio_router.post(
    "/episodes/{episode_id}/audio",
    response_model=StartRenderOut,
    status_code=202,
    dependencies=[Depends(_audio_limit)],
)
def start_render(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: AudioService = Depends(get_audio_service),
) -> StartRenderOut:
    return _started(service, service.start(user, episode_id))


@studio_router.get("/episodes/{episode_id}/audio", response_model=EpisodeAudioOut)
def episode_audio(
    episode_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: AudioService = Depends(get_audio_service),
) -> EpisodeAudioOut:
    return service.episode_audio(user, episode_id)


@studio_router.post(
    "/audio-renders/{render_id}/retry",
    response_model=StartRenderOut,
    status_code=202,
    dependencies=[Depends(_audio_limit)],
)
def retry_render(
    render_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: AudioService = Depends(get_audio_service),
) -> StartRenderOut:
    return _started(service, service.retry(user, render_id))


@studio_router.post(
    "/audio-lines/{line_id}/regenerate",
    response_model=StartRenderOut,
    status_code=202,
    dependencies=[Depends(_audio_limit)],
)
def regenerate_line(
    line_id: uuid.UUID,
    user: CurrentUser = Depends(require_studio),
    service: AudioService = Depends(get_audio_service),
) -> StartRenderOut:
    return _started(service, service.regenerate_line(user, line_id))


@studio_router.put(
    "/audio-lines/{line_id}",
    response_model=StartRenderOut,
    status_code=202,
    dependencies=[Depends(_audio_limit)],
)
def edit_line(
    line_id: uuid.UUID,
    body: LineTextIn,
    user: CurrentUser = Depends(require_studio),
    service: AudioService = Depends(get_audio_service),
) -> StartRenderOut:
    return _started(service, service.edit_line(user, line_id, body.text))


@admin_router.get("/voices", response_model=list[VoiceOut])
def admin_list_voices(
    _: CurrentUser = Depends(require_admin), voices: VoiceService = Depends(get_voice_service)
) -> list[VoiceOut]:
    return [VoiceOut.model_validate(v) for v in voices.list(active_only=False)]


@admin_router.post("/voices", response_model=VoiceOut, status_code=201)
def admin_create_voice(
    body: VoiceIn,
    admin: CurrentUser = Depends(require_admin),
    voices: VoiceService = Depends(get_voice_service),
) -> VoiceOut:
    return VoiceOut.model_validate(voices.create(admin, body))


@admin_router.put("/voices/{voice_id}", response_model=VoiceOut)
def admin_update_voice(
    voice_id: uuid.UUID,
    body: VoiceUpdate,
    admin: CurrentUser = Depends(require_admin),
    voices: VoiceService = Depends(get_voice_service),
) -> VoiceOut:
    return VoiceOut.model_validate(voices.update(admin, voice_id, body))


@listener_router.get("/episodes/{episode_id}/playback", response_model=PlaybackOut)
def get_playback(
    episode_id: uuid.UUID,
    _: CurrentUser = Depends(require_listener),
    service: AudioService = Depends(get_audio_service),
) -> PlaybackOut:
    return service.playback(episode_id)


routers = [studio_router, admin_router, listener_router]
