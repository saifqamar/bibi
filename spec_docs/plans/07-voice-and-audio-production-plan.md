# Plan 07: Voice and Audio Production

Spec: [07-voice-and-audio-production.md](../07-voice-and-audio-production.md) · Order: 9 · Depends on: plans 04, 14

## Goal
Voice library and assignment, a background job that turns approved text into a stitched, loudness-normalised episode, and writer tools to listen, fix and re-render single lines.

## Design
- **Module:** `audio`. Uses `TTSPort` (metered, plan 14), `StoragePort`, `JobQueuePort` (`voice` queue), and `writing` public service (draft text, script parser, status transitions, characters).
- **Tables:** `voices(id, provider, provider_voice_id, name, language, description, sample_text, is_active)`, `voice_assignments(id, series_id, character_id null [null = narrator], voice_id)` unique `(series_id, character_id)`, `audio_renders(id, episode_id, draft_version, status [queued|running|succeeded|failed], workflow_run_id, lines_total, lines_done, error)`, `audio_lines(id, render_id, position, speaker, character_id null, voice_id, text, text_hash, storage_key, duration_ms, status [pending|done|failed], attempts, error, flagged_unknown_speaker)`, `audio_assets(id, episode_id, render_id, storage_key, format, duration_seconds, loudness_lufs, peak_dbfs, created_at)`.
- **Pipeline (job `render_episode_audio`):**
  1. Parse current draft with the script parser; unknown speakers → narrator voice, `flagged_unknown_speaker=true`.
  2. Create lines; reuse audio from the previous render for lines with the same `text_hash` and voice (so re-rendering does not re-synthesize unchanged lines).
  3. Synthesize pending lines concurrently (thread pool, configurable concurrency) through metered `TTSPort`; each line retried up to 3 times individually; failures do not discard successful lines.
  4. When all lines are done: stitch PCM WAV with pauses (line 350 ms, paragraph 700 ms, scene break 1500 ms), normalise loudness to target (default −16 LUFS integrated, measured with a BS.1770 K-weighted implementation in `audio/loudness.py`; [OPEN] target), encode (WAV always; MP3 via ffmpeg when available), upload, create `audio_assets`, set `current_audio_id`, episode → `audio_ready`.
  5. Otherwise render `failed` listing failing lines; `retry` re-runs only failed lines.
- **Swap point:** `VoiceProductionPort.start(episode_id)`; default implementation is the queue job. A LangGraph version (review-before-stitch) can implement the same port later ([OPEN], default plain job).
- **Line tools:** regenerate one line (same text, new synth), change a line's text (creates a new human draft version with that line replaced and re-renders only that line, then re-stitches), change a character's voice (re-renders that character's lines).
- **Preview:** `GET /studio/voices/{id}/preview` synthesizes `sample_text` once and caches it in storage.
- **Reference checker:** registers with plan 03's delete guard so deleting an assigned character warns.

## API
- `GET /studio/voices`, `GET /studio/voices/{id}/preview`
- `GET/PUT /studio/series/{id}/voice-assignments`
- `POST /studio/episodes/{id}/audio` → `{workflow_run_id, render_id}`; `POST /studio/audio-renders/{id}/retry`
- `GET /studio/episodes/{id}/audio` (latest render, lines with signed URLs, asset with signed URL, duration, loudness)
- `POST /studio/audio-lines/{id}/regenerate`, `PUT /studio/audio-lines/{id}` (text fix)
- Admin voice library: `GET/POST /admin/voices`, `PUT /admin/voices/{id}` (UI in plan 09)

## Studio UI
- Series "Voices" tab: per character (and narrator) voice picker with voice notes shown and preview play.
- Episode "Audio" tab: generate button (enabled at `ready_for_audio`), live progress (lines done/total), full-episode player with duration and loudness, line list with play, regenerate, edit text, unknown-speaker flags.

## Tasks (one commit each)
1. Models and migration.
2. Voice library admin endpoints, studio list and cached preview.
3. Voice assignments with reference checker.
4. WAV utilities: stitch with pauses, loudness measurement and normalisation, optional ffmpeg MP3.
5. Render job: parse, line reuse, concurrent synth with per-line retry, stitch, upload, asset, status; `voice` queue.
6. Retry, regenerate line, edit line text, voice change re-render.
7. Studio voices tab.
8. Studio audio tab.
9. Regenerate API client; tests.

## Tests
- Fake TTS renders a ~16-minute script end to end; asset duration within tolerance; loudness within ±1 LU of target.
- One line forced to fail → others kept; retry renders only the failed line.
- Regenerating one line synthesizes exactly one TTS call; re-render after small text change re-synthesizes only changed lines.
- Unknown speaker uses narrator and is flagged.
- Duration and loudness exposed by the API.
- Voice queue is separate from drafting queue.
- Writer cannot render another writer's episode.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| Voices FR1 library, admin-managed | Task 2 (UI plan 09) | ✅ |
| Voices FR2 per character + narrator per series, voice notes shown | Tasks 3, 7 | ✅ |
| Voices FR3 preview | Task 2 | ✅ |
| Pipeline FR1 split by speaker, unknown → narrator flagged | Task 5 | ✅ |
| FR2 parallel synthesis via TTSPort | Task 5 | ✅ |
| FR3 stitch with configurable pauses | Task 4 | ✅ |
| FR4 loudness normalisation [OPEN target] | Task 4, default −16 LUFS | ⚠️ confirm target |
| FR5 encode, upload, asset row, `current_audio_id`, `audio_ready` | Task 5 (MP3 when ffmpeg present) | ✅ |
| FR6 per-line retry; failed run lists lines | Tasks 5, 6 | ✅ |
| FR7 own queue | Task 5 | ✅ |
| Writer tools: listen, regenerate line, swap voice, edit line text, progress | Tasks 6, 8 | ✅ |
| Implementation switch [OPEN] | `VoiceProductionPort` | ✅ default |
| AC end-to-end render with fake TTS; real-provider smoke test | Task 9 fake test; real smoke test waits for provider choice | ⚠️ provider open |
| AC failing line keeps others | Test | ✅ |
| AC one-line re-render | Test | ✅ |
| AC duration and loudness visible | Tasks 5, 8 | ✅ |
| Open: TTS provider, licensing | Owner/legal | ⚠️ open |

Review result: complete. Gap fixed during review: the spec's line tools needed per-line storage and identity; added `audio_renders` and `audio_lines` with `text_hash` reuse.
