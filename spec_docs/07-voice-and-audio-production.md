# 07. Voice and Audio Production

**Modules:** `audio`, `ai/adapters` · **Component:** Studio writer area · **Scope:** MVP

## Goal
Turn approved episode text into a finished, loudness-normalised audio file using assigned voices.

## Functional requirements

### Voices and assignment
1. Voice library (`voices`): provider, provider voice id, name, language, description. Admin-managed; writers pick from it.
2. Writer assigns a voice per character, plus a **narrator** voice, per series (`voice_assignments`). Character voice notes are shown while choosing.
3. Voice preview: play a short sample of any voice with sample text.

### Production pipeline
1. Split approved text into lines by speaker (using speaker tags); unknown speakers fall back to narrator and are flagged.
2. Map speakers to voices; synthesize lines in parallel via `TTSPort`.
3. Stitch lines with configurable pauses (between lines, scenes).
4. Normalise loudness to a target. **[OPEN]** target value, e.g. a common podcast level.
5. Encode, upload via `StoragePort`, create `audio_assets` row with duration and loudness info; set `current_audio_id`; status → `audio_ready`.
6. Failed lines are retried individually; the job finishes only when all lines succeed or a retry limit marks the run failed with the failing lines listed.
7. Runs on its **own queue and workers** so it never blocks drafting.

### Writer tools
- Listen to the full episode or any line; regenerate a single line; swap a character's voice and re-render affected lines.
- Per-line text fix: edit the line text, which creates a new draft version and re-synthesizes that line.
- Progress shown live (lines done / total).

### Implementation switch
- Default: plain background queue job. **[OPEN]** if writers must review lines before stitching, implement as a LangGraph graph (`graphs/voice`) with an interrupt. Keep the job interface and `TTSPort` stable so either can be swapped.

## Data
`voices`, `voice_assignments`, `audio_assets`, `workflow_runs`, `ai_usage` (TTS characters, cost).

## API (sketch)
- `GET /voices`, `GET /voices/{id}/preview`
- `PUT /series/{id}/voice-assignments`
- `POST /episodes/{id}/audio` → `{workflow_run_id}`; `GET /workflow-runs/{id}`
- `POST /episodes/{id}/audio/lines/{line_id}/regenerate`
- `GET /episodes/{id}/audio` (asset metadata and signed URL)

## Acceptance criteria
- A 15-20 minute episode renders end to end with fake TTS in tests and a real provider in a smoke test.
- One failing line does not discard the other lines' results.
- Re-rendering one line does not re-synthesize the others.
- Output duration and loudness are stored and visible in Studio.

## Open items
- TTS provider and voice quality evaluation with real listeners.
- Voice licensing and legal terms.
- Loudness target; review-before-stitch decision.
