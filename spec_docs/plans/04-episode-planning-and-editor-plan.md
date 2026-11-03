# Plan 04: Episode Planning, Editor and Versions

Spec: [04-episode-planning-and-editor.md](../04-episode-planning-and-editor.md) · Order: 5 · Depends on: plan 03

## Goal
Writers plan episodes with beats, edit text in an editor with speaker tags, keep full version history, and move episodes through an enforced status machine.

## Design
- **Tables:** `episodes(id, series_id, number, title, status, current_draft_id, current_audio_id, is_free null, published_at)`, unique `(series_id, number)`; `episode_plans(id, episode_id unique, beats jsonb [{id, text}], notes)`; `episode_drafts(id, episode_id, version, text, source [ai|human], created_by null, note)`, unique `(episode_id, version)`.
- **Status machine** (`writing/status.py`): allowed transitions
  `planned→drafting`, `drafting→planned` (cancel), `drafting→ready_for_audio`, `ready_for_audio→drafting`, `ready_for_audio→audio_ready`, `audio_ready→ready_for_audio` (text changed), `audio_ready→in_review`, `in_review→changes_requested|approved`, `in_review→ready_for_audio` (rejected), `changes_requested→ready_for_audio|drafting|in_review`, `approved→published`, `published→approved` (unpublish), and `approved|published→drafting` when text is edited after approval. Invalid → `409 invalid_status_transition`. A hook `can_auto_publish(writer)` returns false (spec 08 later flag).
- **Script format:** plain text; lines starting `Name:` (name matches a character, case-insensitive) are dialogue, everything else is narration; blank lines separate paragraphs; `[[scene]]` marks a scene break. Parser in `writing/script.py` returns `[{speaker, text, kind}]` (used by plan 07).
- **Versions:** saving text creates a new draft version only if the text changed; optimistic concurrency via `base_version` (409 `version_conflict` if stale) — chosen default for the [OPEN] lock-vs-check item.
- **Compare:** server-side diff (`difflib`) returning line ops for side-by-side view.
- **Duration estimate:** words / 150 wpm, returned with each draft and computed live in the editor.
- **Edit after approval:** saving a new version on an `approved` or `published` episode moves it back to `drafting` (published audio stays live until a new version is published).

## API (writer-scoped)
- `GET/POST /studio/series/{id}/episodes`, `GET/PUT/DELETE /studio/episodes/{id}` (delete only when `planned`)
- `PUT /studio/episodes/{id}/plan`
- `GET /studio/episodes/{id}/drafts`, `GET /studio/episodes/{id}/drafts/{version}`, `POST /studio/episodes/{id}/drafts` (`text`, `base_version`, `note`), `POST /studio/episodes/{id}/drafts/{version}/restore`
- `GET /studio/episodes/{id}/drafts/compare?a=&b=`
- `POST /studio/episodes/{id}/status` (writer-allowed manual transitions, e.g. `drafting→ready_for_audio` when no AI run)

## Studio UI
- Episode list per series (number, title, status badge, duration).
- Episode page: Plan tab (ordered beats editor, notes), Editor tab (textarea editor with speaker highlighting, live word count and duration vs. target, save with note), History tab (versions with source, view, restore, compare side by side).

## Tasks (one commit each)
1. Models and migration.
2. Status machine module with exhaustive tests.
3. Episode and plan endpoints.
4. Drafts: create with optimistic check, list, get, restore; duration estimate.
5. Compare endpoint.
6. Script parser.
7. Studio: episode list and plan tab.
8. Studio: editor tab with live duration.
9. Studio: history tab with compare and restore.
10. Regenerate API client; Studio tests.

## Tests
- Every allowed transition succeeds and every other pair fails with `invalid_status_transition`.
- Saving identical text does not create a version; stale `base_version` → 409.
- Restore creates a new version (source human, note "restored from vN").
- Draft records keep `source`.
- Compare returns expected ops; parser handles dialogue, narration, unknown names, scene breaks.
- Editing an approved episode moves it to `drafting`.
- Studio: duration updates while typing.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| Plan FR1 create/order episodes | Task 3 | ✅ |
| Plan FR2 ordered beats + notes | Tasks 1, 3, 7 | ✅ |
| Plan FR3 plan editable; changes apply to next regeneration | Task 3 (plan editable any time; drafting reads it at run time) | ✅ |
| Status flow enforced | Task 2 | ✅ |
| Editor FR1 speaker-tagged dialogue | Tasks 6, 8 | ✅ |
| Editor FR2 regenerate selected section | Plan 05 (needs AI) | ➡️ plan 05 |
| Editor FR3 versions with source/author, view, restore, compare | Tasks 4, 5, 9 | ✅ |
| Editor FR4 lock vs optimistic [OPEN] | Optimistic check chosen | ⚠️ confirm with owner |
| Editor FR5 word count + estimated time vs target | Tasks 4, 8 | ✅ |
| Editor FR6 editing approved/published → new draft, back through review | Tasks 2, 4 | ✅ |
| AC every change recoverable | Task 4 | ✅ |
| AC versions show AI vs human | Task 4 | ✅ |
| AC invalid transitions → machine-readable error | Task 2 | ✅ |
| AC duration shown and updates | Task 8 | ✅ |

Review result: complete. Gaps fixed during review: the spec flow had no way back from `in_review` on rejection and no unpublish path; added `in_review→ready_for_audio` and `published→approved`. Added a `can_auto_publish` hook so the later trusted-writer flag needs no flow change.
