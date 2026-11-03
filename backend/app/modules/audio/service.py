"""Voices, casting and episode audio production."""

import hashlib
import logging
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.modules.ai import (
    Metered,
    ProviderError,
    RunService,
    RunStatus,
    TTSResult,
    UsageContext,
    call_with_retry,
)
from app.modules.audio import processing
from app.modules.audio.models import (
    AudioAsset,
    AudioLine,
    AudioRender,
    LineStatus,
    RenderStatus,
    Voice,
    VoiceAssignment,
)
from app.modules.audio.schemas import (
    AssignmentIn,
    AssignmentsOut,
    AudioAssetOut,
    AudioLineOut,
    CastMember,
    EpisodeAudioOut,
    RenderOut,
    VoiceIn,
    VoiceUpdate,
)
from app.modules.catalog import CatalogService
from app.modules.identity import CurrentUser
from app.modules.writing import (
    BibleService,
    EpisodeService,
    EpisodeStatus,
    register_reference_checker,
)
from app.shared.audit import record_audit
from app.shared.errors import Conflict, NotFound, ValidationFailed
from app.shared.jobs import QUEUE_VOICE, job

if TYPE_CHECKING:
    from app.container import Container

logger = logging.getLogger(__name__)

RENDER_JOB = "audio.render_episode"
PREVIEW_JOB = "audio.voice_preview"
PAUSE_LINE_MS = 350
PAUSE_PARAGRAPH_MS = 700
PAUSE_SCENE_MS = 1500
PROGRESS_EVERY = 10
AUDIO_STATUSES = (EpisodeStatus.READY_FOR_AUDIO, EpisodeStatus.AUDIO_READY)


def line_hash(provider_voice_id: str, language: str, text: str) -> str:
    return hashlib.sha256(f"{provider_voice_id}|{language}|{text}".encode()).hexdigest()


# Voices ------------------------------------------------------------------------------------------


class VoiceService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container

    def get(self, voice_id: uuid.UUID) -> Voice:
        voice = self.db.get(Voice, voice_id)
        if voice is None:
            raise NotFound("Voice not found")
        return voice

    def list(self, *, active_only: bool) -> list[Voice]:
        stmt = select(Voice).order_by(Voice.language, Voice.name)
        if active_only:
            stmt = stmt.where(Voice.is_active.is_(True))
        return list(self.db.scalars(stmt))

    def create(self, admin: CurrentUser, data: VoiceIn) -> Voice:
        values = data.model_dump(exclude_none=True)
        voice = Voice(**values)
        self.db.add(voice)
        self.db.flush()
        record_audit(
            self.db,
            actor_id=admin.id,
            action="voice.create",
            entity_type="voice",
            entity_id=voice.id,
        )
        return voice

    def update(self, admin: CurrentUser, voice_id: uuid.UUID, data: VoiceUpdate) -> Voice:
        voice = self.get(voice_id)
        for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
            setattr(voice, key, value)
        record_audit(
            self.db,
            actor_id=admin.id,
            action="voice.update",
            entity_type="voice",
            entity_id=voice.id,
        )
        return voice

    def preview_key(self, voice: Voice) -> str:
        digest = hashlib.sha256(voice.sample_text.encode()).hexdigest()[:12]
        return f"voices/{voice.id}/preview-{digest}.mp3"

    def preview_url(self, voice_id: uuid.UUID) -> str | None:
        """Signed URL of the cached preview; queues its synthesis the first time."""
        voice = self.get(voice_id)
        key = self.preview_key(voice)
        if self.container.storage.exists(key):
            return self.container.storage.signed_url(key)
        self.container.queue.enqueue(PREVIEW_JOB, voice_id=str(voice.id))
        return None

    def make_preview(self, voice_id: uuid.UUID) -> None:
        voice = self.get(voice_id)
        key = self.preview_key(voice)
        if self.container.storage.exists(key):
            return
        metered = Metered(self.db, self.container, UsageContext(purpose="voice_preview"))
        result = metered.synthesize(
            voice.sample_text, voice.provider_voice_id, language=voice.language
        )
        wav = processing.frames_to_wav(processing.to_standard_pcm(result.audio_wav))
        self.container.storage.put(key, processing.encode_mp3(wav), "audio/mpeg")


# Casting -----------------------------------------------------------------------------------------


@register_reference_checker("characters")
def _voice_assignment_references(db: Session, character_id: uuid.UUID) -> list[str]:
    count = db.scalar(
        select(func.count())
        .select_from(VoiceAssignment)
        .where(VoiceAssignment.character_id == character_id)
    )
    return ["a voice assignment"] if count else []


class CastingService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.catalog = CatalogService(db, container)

    def _assignments(self, series_id: uuid.UUID) -> dict[uuid.UUID | None, uuid.UUID]:
        rows = self.db.scalars(
            select(VoiceAssignment).where(VoiceAssignment.series_id == series_id)
        )
        return {row.character_id: row.voice_id for row in rows}

    def cast(self, user: CurrentUser, series_id: uuid.UUID) -> AssignmentsOut:
        self.catalog.get_series_for_user(user, series_id)
        assigned = self._assignments(series_id)
        characters = BibleService(self.db, self.container).snapshot(series_id)["characters"]
        members = [
            CastMember(
                character_id=None, name="Narrator", voice_notes="", voice_id=assigned.get(None)
            )
        ]
        members += [
            CastMember(
                character_id=uuid.UUID(c["id"]),
                name=c["name"],
                voice_notes=c["voice_notes"],
                voice_id=assigned.get(uuid.UUID(c["id"])),
            )
            for c in characters
            if not c["is_narrator"]
        ]
        return AssignmentsOut(cast=members)

    def set(self, user: CurrentUser, series_id: uuid.UUID, items: list[AssignmentIn]) -> None:
        self.catalog.get_series_for_user(user, series_id)
        characters = {
            uuid.UUID(c["id"])
            for c in BibleService(self.db, self.container).snapshot(series_id)["characters"]
        }
        seen: set[uuid.UUID | None] = set()
        for item in items:
            if item.character_id in seen:
                raise ValidationFailed("Each character gets one voice", code="duplicate_assignment")
            seen.add(item.character_id)
            if item.character_id is not None and item.character_id not in characters:
                raise ValidationFailed("Unknown character", code="unknown_character")
            voice = self.db.get(Voice, item.voice_id)
            if voice is None or not voice.is_active:
                raise ValidationFailed("Unknown or inactive voice", code="unknown_voice")
        self.db.execute(delete(VoiceAssignment).where(VoiceAssignment.series_id == series_id))
        self.db.flush()
        for item in items:
            self.db.add(
                VoiceAssignment(
                    series_id=series_id, character_id=item.character_id, voice_id=item.voice_id
                )
            )
        record_audit(
            self.db,
            actor_id=user.id,
            action="voice.assignments",
            entity_type="series",
            entity_id=series_id,
            metadata={"count": len(items)},
        )
        self.db.flush()


# Production --------------------------------------------------------------------------------------


class QueuedVoiceProduction:
    """Default VoiceProductionPort: a job on the voice queue."""

    def __init__(self, container: "Container") -> None:
        self.container = container

    def start(self, render_id: uuid.UUID, workflow_run_id: uuid.UUID) -> None:
        self.container.queue.enqueue(RENDER_JOB, render_id=str(render_id))


class AudioService:
    def __init__(self, db: Session, container: "Container") -> None:
        self.db = db
        self.container = container
        self.episodes = EpisodeService(db, container)
        self.runs = RunService(db)
        self.production = QueuedVoiceProduction(container)

    # Preparing a render ----------------------------------------------------------------------

    def _latest_render(self, episode_id: uuid.UUID) -> AudioRender | None:
        return self.db.scalar(
            select(AudioRender)
            .where(AudioRender.episode_id == episode_id)
            .order_by(AudioRender.created_at.desc())
            .limit(1)
        )

    def _reusable(self, episode_id: uuid.UUID, text_hash: str) -> AudioLine | None:
        return self.db.scalar(
            select(AudioLine)
            .join(AudioRender, AudioRender.id == AudioLine.render_id)
            .where(
                AudioRender.episode_id == episode_id,
                AudioLine.text_hash == text_hash,
                AudioLine.status == LineStatus.DONE,
                AudioLine.storage_key.is_not(None),
            )
            .order_by(AudioLine.created_at.desc())
            .limit(1)
        )

    def start(
        self, user: CurrentUser, episode_id: uuid.UUID, *, force_positions: set[int] | None = None
    ) -> AudioRender:
        episode = self.episodes.get_for_user(user, episode_id)
        if episode.status not in AUDIO_STATUSES:
            raise Conflict(
                "Audio can be produced once the episode is ready for audio",
                code="episode_not_ready_for_audio",
            )
        latest = self._latest_render(episode_id)
        if latest and latest.status in (RenderStatus.QUEUED, RenderStatus.RUNNING):
            raise Conflict("Audio is already being produced", code="render_in_progress")
        series = CatalogService(self.db, self.container).get_series(episode.series_id)
        assigned = {
            row.character_id: row.voice_id
            for row in self.db.scalars(
                select(VoiceAssignment).where(VoiceAssignment.series_id == episode.series_id)
            )
        }
        narrator = assigned.get(None)
        if narrator is None:
            raise Conflict("Choose a narrator voice first", code="narrator_voice_missing")
        voices = {v.id: v for v in self.db.scalars(select(Voice))}
        characters = {
            c["name"]: uuid.UUID(c["id"])
            for c in BibleService(self.db, self.container).snapshot(episode.series_id)["characters"]
        }
        version, _ = self.episodes.current_text(episode_id)
        render = AudioRender(episode_id=episode_id, draft_version=version or 0)
        self.db.add(render)
        self.db.flush()

        total = done = 0
        for line in self.episodes.script_for(episode_id):
            row = AudioLine(
                render_id=render.id,
                position=line.index,
                kind=line.kind,
                source_line=line.source_line,
                paragraph=line.paragraph,
                speaker=line.speaker or line.unknown_speaker,
                text=line.text,
                text_hash="",
            )
            if line.kind == "scene_break":
                row.status = LineStatus.DONE
                self.db.add(row)
                continue
            character_id = characters.get(line.speaker) if line.speaker else None
            voice_id = assigned.get(character_id) if character_id else None
            if line.unknown_speaker:
                row.flag = "unknown_speaker"
            elif character_id and voice_id is None:
                row.flag = "no_voice_assigned"
            row.character_id = character_id
            row.voice_id = voice_id or narrator
            voice = voices[row.voice_id]
            row.text_hash = line_hash(voice.provider_voice_id, series.language, line.text)
            total += 1
            reusable = (
                None
                if line.index in (force_positions or set())
                else self._reusable(episode_id, row.text_hash)
            )
            if reusable is not None:
                row.storage_key = reusable.storage_key
                row.duration_ms = reusable.duration_ms
                row.status = LineStatus.DONE
                done += 1
            self.db.add(row)
        if total == 0:
            raise Conflict("The episode has no lines to record", code="episode_has_no_text")
        render.lines_total, render.lines_done = total, done
        run = self.runs.create(
            workflow="voice",
            thread_id=f"episode-{episode_id}:voice:{render.id.hex[:12]}",
            episode_id=episode_id,
            series_id=episode.series_id,
            requested_by=user.id,
            input={"render_id": str(render.id)},
        )
        render.workflow_run_id = run.id
        record_audit(
            self.db,
            actor_id=user.id,
            action="audio.render",
            entity_type="episode",
            entity_id=episode_id,
            metadata={"render_id": str(render.id)},
        )
        self.db.commit()  # the worker must see the render
        self.production.start(render.id, run.id)
        return render

    def retry(self, user: CurrentUser, render_id: uuid.UUID) -> AudioRender:
        render = self._render_for_user(user, render_id)
        if render.status != RenderStatus.FAILED:
            raise Conflict("Only failed renders can be retried", code="render_not_failed")
        for line in self.db.scalars(
            select(AudioLine).where(
                AudioLine.render_id == render.id, AudioLine.status == LineStatus.FAILED
            )
        ):
            line.status, line.error = LineStatus.PENDING, None
        render.status, render.error = RenderStatus.QUEUED, None
        if render.workflow_run_id:
            self.runs.set_status(self.runs.get(render.workflow_run_id), RunStatus.QUEUED)
        self.db.commit()
        self.production.start(render.id, render.workflow_run_id)  # type: ignore[arg-type]
        return render

    def _line_for_user(
        self, user: CurrentUser, line_id: uuid.UUID
    ) -> tuple[AudioLine, AudioRender]:
        line = self.db.get(AudioLine, line_id)
        if line is None:
            raise NotFound("Line not found")
        render = self._render_for_user(user, line.render_id)
        if self._latest_render(render.episode_id) != render:
            raise Conflict("Work on the latest render", code="render_outdated")
        if line.kind == "scene_break":
            raise ValidationFailed("Scene breaks have no audio", code="invalid_line")
        return line, render

    def regenerate_line(self, user: CurrentUser, line_id: uuid.UUID) -> AudioRender:
        line, render = self._line_for_user(user, line_id)
        return self.start(user, render.episode_id, force_positions={line.position})

    def edit_line(self, user: CurrentUser, line_id: uuid.UUID, text: str) -> AudioRender:
        line, render = self._line_for_user(user, line_id)
        new_line = f"{line.speaker}: {text.strip()}" if line.kind == "dialogue" else text.strip()
        self.episodes.replace_script_line(user, render.episode_id, line.source_line, new_line)
        self.db.flush()
        return self.start(user, render.episode_id)

    # Producing (worker) ----------------------------------------------------------------------

    def _store_line(self, line: AudioLine, result: TTSResult, episode_id: uuid.UUID) -> None:
        frames = processing.to_standard_pcm(result.audio_wav)
        key = f"audio/{episode_id}/lines/{line.text_hash}.wav"
        self.container.storage.put(key, processing.frames_to_wav(frames), "audio/wav")
        line.storage_key = key
        line.duration_ms = processing.duration_ms(frames)
        line.status = LineStatus.DONE
        line.error = None

    def execute(self, render_id: uuid.UUID) -> None:
        render = self.db.get(AudioRender, render_id)
        if render is None or render.status not in (RenderStatus.QUEUED, RenderStatus.RUNNING):
            return
        episode = self.episodes.get(render.episode_id)
        run = self.runs.get(render.workflow_run_id) if render.workflow_run_id else None
        render.status = RenderStatus.RUNNING
        if run:
            self.runs.set_status(run, RunStatus.RUNNING)
            self.runs.step(run, "synthesize", f"{render.lines_done}/{render.lines_total} lines")
        self.db.commit()

        series = CatalogService(self.db, self.container).get_series(episode.series_id)
        voices = {v.id: v for v in self.db.scalars(select(Voice))}
        pending = list(
            self.db.scalars(
                select(AudioLine)
                .where(AudioLine.render_id == render.id, AudioLine.status == LineStatus.PENDING)
                .order_by(AudioLine.position)
            )
        )
        metered = Metered(
            self.db,
            self.container,
            UsageContext(
                purpose="tts",
                workflow_run_id=run.id if run else None,
                episode_id=episode.id,
                series_id=episode.series_id,
            ),
        )
        sleep = self.container.retry_sleep

        def synthesize(line: AudioLine) -> TTSResult:
            voice = voices[line.voice_id]  # type: ignore[index]
            return call_with_retry(
                lambda: self.container.tts.synthesize(
                    line.text, voice.provider_voice_id, language=series.language
                ),
                sleep=sleep,
            )

        # Lines are synthesized in parallel threads; the database is only touched here.
        workers = max(1, self.container.settings.tts_concurrency)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(synthesize, line): line for line in pending}
            for count, future in enumerate(as_completed(futures), start=1):
                line = futures[future]
                line.attempts += 1
                try:
                    result = future.result()
                    metered.record_tts(result)
                    self._store_line(line, result, episode.id)
                    render.lines_done += 1
                except (ProviderError, processing.AudioProcessingError) as exc:
                    line.status, line.error = LineStatus.FAILED, str(exc)[:500]
                if run and (count % PROGRESS_EVERY == 0 or count == len(pending)):
                    self.runs.event(
                        run,
                        "info",
                        step="synthesize",
                        message=f"{render.lines_done}/{render.lines_total} lines",
                        data={"done": render.lines_done, "total": render.lines_total},
                    )
                    self.db.commit()

        failed = [line.position for line in pending if line.status == LineStatus.FAILED]
        if failed:
            self._fail(render, run, f"{len(failed)} line(s) failed: positions {failed[:20]}")
            return
        try:
            asset = self._assemble(render, episode.id)
        except processing.AudioProcessingError as exc:
            self._fail(render, run, f"Assembling the episode failed: {exc}")
            return
        self.episodes.set_current_audio(episode.id, asset.id)
        if episode.status == EpisodeStatus.READY_FOR_AUDIO:
            self.episodes.set_status(episode.id, EpisodeStatus.AUDIO_READY)
        render.status = RenderStatus.SUCCEEDED
        if run:
            self.runs.step(run, "stitched", f"{float(asset.duration_seconds):.0f} seconds")
            self.runs.set_status(run, RunStatus.SUCCEEDED)
        self.db.commit()

    def _fail(self, render: AudioRender, run: Any, error: str) -> None:
        render.status, render.error = RenderStatus.FAILED, error
        if run:
            self.runs.set_status(run, RunStatus.FAILED, error=error)
        self.db.commit()

    def _assemble(self, render: AudioRender, episode_id: uuid.UUID) -> AudioAsset:
        lines = list(
            self.db.scalars(
                select(AudioLine)
                .where(AudioLine.render_id == render.id)
                .order_by(AudioLine.position)
            )
        )
        segments: list[tuple[bytes, int]] = []
        for index, line in enumerate(lines):
            if line.kind == "scene_break":
                if segments:
                    segments[-1] = (segments[-1][0], PAUSE_SCENE_MS)
                continue
            assert line.storage_key is not None
            frames = processing.to_standard_pcm(self.container.storage.get(line.storage_key))
            following = lines[index + 1] if index + 1 < len(lines) else None
            pause = 0
            if following is not None:
                pause = (
                    PAUSE_PARAGRAPH_MS if following.paragraph != line.paragraph else PAUSE_LINE_MS
                )
            segments.append((frames, pause))
        settings = self.container.settings
        wav, loudness = processing.normalize(
            processing.stitch(segments), settings.audio_target_lufs, settings.audio_true_peak
        )
        mp3 = processing.encode_mp3(wav, settings.audio_mp3_bitrate)
        key = f"audio/{episode_id}/{render.id}.mp3"
        self.container.storage.put(key, mp3, "audio/mpeg")
        asset = AudioAsset(
            episode_id=episode_id,
            render_id=render.id,
            storage_key=key,
            format="mp3",
            duration_seconds=Decimal(processing.duration_ms(processing.to_standard_pcm(wav)))
            / 1000,
            loudness_lufs=Decimal(str(loudness.integrated_lufs)),
            peak_dbfs=Decimal(str(loudness.true_peak_dbtp)),
        )
        self.db.add(asset)
        self.db.flush()
        return asset

    # Reading ---------------------------------------------------------------------------------

    def _render_for_user(self, user: CurrentUser, render_id: uuid.UUID) -> AudioRender:
        render = self.db.get(AudioRender, render_id)
        if render is None:
            raise NotFound("Render not found")
        self.episodes.get_for_user(user, render.episode_id)
        return render

    def asset_out(self, asset: AudioAsset) -> AudioAssetOut:
        return AudioAssetOut(
            id=asset.id,
            url=self.container.storage.signed_url(asset.storage_key),
            format=asset.format,
            duration_seconds=asset.duration_seconds,
            loudness_lufs=asset.loudness_lufs,
            peak_dbfs=asset.peak_dbfs,
            created_at=asset.created_at,
        )

    def current_asset(self, episode_id: uuid.UUID) -> AudioAsset | None:
        episode = self.episodes.get(episode_id)
        return (
            self.db.get(AudioAsset, episode.current_audio_id) if episode.current_audio_id else None
        )

    def episode_audio(self, user: CurrentUser, episode_id: uuid.UUID) -> EpisodeAudioOut:
        self.episodes.get_for_user(user, episode_id)
        render = self._latest_render(episode_id)
        asset = self.current_asset(episode_id)
        storage = self.container.storage
        lines = []
        if render:
            for line in self.db.scalars(
                select(AudioLine)
                .where(AudioLine.render_id == render.id)
                .order_by(AudioLine.position)
            ):
                lines.append(
                    AudioLineOut(
                        id=line.id,
                        position=line.position,
                        kind=line.kind,
                        source_line=line.source_line,
                        speaker=line.speaker,
                        voice_id=line.voice_id,
                        text=line.text,
                        status=line.status.value,
                        duration_ms=line.duration_ms,
                        flag=line.flag,
                        error=line.error,
                        url=storage.signed_url(line.storage_key) if line.storage_key else None,
                    )
                )
        version, _ = self.episodes.current_text(episode_id)
        asset_render = (
            self.db.get(AudioRender, asset.render_id) if asset and asset.render_id else None
        )
        return EpisodeAudioOut(
            render=RenderOut(
                id=render.id,
                draft_version=render.draft_version,
                status=render.status.value,
                workflow_run_id=render.workflow_run_id,
                lines_total=render.lines_total,
                lines_done=render.lines_done,
                error=render.error,
                created_at=render.created_at,
            )
            if render
            else None,
            asset=self.asset_out(asset) if asset else None,
            lines=lines,
            is_current=bool(asset_render and asset_render.draft_version == version),
        )

    def asset_matches_current_draft(self, episode_id: uuid.UUID) -> bool:
        asset = self.current_asset(episode_id)
        if asset is None or asset.render_id is None:
            return False
        render = self.db.get(AudioRender, asset.render_id)
        version, _ = self.episodes.current_text(episode_id)
        return bool(render and render.draft_version == version)


# Jobs ----------------------------------------------------------------------------------------


@job(RENDER_JOB, queue=QUEUE_VOICE)
def render_episode_job(container: Any, *, render_id: str) -> None:
    with container.db.session() as db:
        AudioService(db, container).execute(uuid.UUID(render_id))


@job(PREVIEW_JOB, queue=QUEUE_VOICE)
def voice_preview_job(container: Any, *, voice_id: str) -> None:
    with container.db.session() as db:
        VoiceService(db, container).make_preview(uuid.UUID(voice_id))
        db.commit()
