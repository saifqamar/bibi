# Plan 08: Review and Approval

Spec: [08-review-and-approval.md](../08-review-and-approval.md) · Order: 10 · Depends on: plans 02, 06, 07

## Goal
Submit, review, approve, request changes, reject, publish and unpublish episodes, with every decision recorded, and expose published episodes to listeners.

## Design
- **Module:** `admin` (review queue) using `writing` (status machine), `catalog` (series status), `audio`, `ai` (costs, continuity) public services.
- **Tables:** `review_items(id, episode_id, draft_version, audio_asset_id, status [pending|approved|changes_requested|rejected], submitted_by, submitted_at, reviewer_id, comments, decided_at)`, `writer_notifications(id, user_id, kind, episode_id, review_item_id, message, read_at)`.
- **Submit:** episode must be `audio_ready`, no open continuity errors, audio asset matches current draft. Creates a pending review item; episode → `in_review`.
- **Decisions:** approve → episode `approved`, optional `publish_now`; request changes (comments required) → `changes_requested`; reject (reason required) → back to `ready_for_audio` (stays unpublished). Each writes `review_items`, audit log, and a writer notification.
- **Publish:** only from `approved` with an approved review item for the current draft; sets `published_at`; series → `published` on its first published episode. Unpublish → `approved`. A series stays `published` only while at least one of its episodes is published; unpublishing the last one sets it back to `draft`, which hides it from listeners.
- **Scheduling [OPEN]:** default publish-now only.
- **Auto-publish hook:** `can_auto_publish(writer)` from plan 04 (always false); submit checks it so a later flag needs no flow change.
- **Listener episodes:** `GET /series/{id}/episodes` (published only, with `is_free` = episode override or number ≤ `free_episode_count`), `GET /episodes/{id}` (published only).
- **Offline downloads after unpublish [OPEN]:** API stops listing it; the app removes it on next sync (plan 11).

## API
- Writer: `POST /studio/episodes/{id}/submit`, `GET /studio/episodes/{id}/reviews`, `GET /studio/notifications`, `POST /studio/notifications/{id}/read`
- Admin: `GET /admin/review-queue?series_id=&writer_id=`, `GET /admin/review-items/{id}` (episode text, audio URL, bible link, continuity report, cost, versions), `POST /admin/review-items/{id}/approve|request-changes|reject`, `POST /admin/episodes/{id}/publish|unpublish`
- Listener: `GET /series/{id}/episodes`, `GET /episodes/{id}`

## Studio UI
- Writer: submit button with pre-check messages; review history and notifications list with unread badge.
- Admin: review queue table with filters; review screen (player, text, continuity report, cost, versions, bible link) with approve (+ publish now), request changes, reject dialogs; publish/unpublish buttons.

## Tasks (one commit each)
1. Models and migration.
2. Submit with pre-checks and auto-publish hook.
3. Admin queue and review detail.
4. Decisions with audit and notifications.
5. Publish/unpublish with series status updates.
6. Listener episode endpoints.
7. Studio writer: submit, review history, notifications.
8. Studio admin: queue and review screen.
9. Regenerate API client; tests.

## Tests
- Submit blocked without audio / with open errors / when audio is stale.
- Writer token cannot approve or publish (403).
- Cannot publish without an approved review for the current draft.
- Request changes without comments → 422.
- First publish makes the series visible on `/shelves` and `/series/{id}/episodes`; unpublish hides the episode immediately.
- Audit and notification rows per decision.
- `is_free` computed from count and override.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| FR1 submit from `audio_ready`, no open errors, audio present | Task 2 | ✅ |
| FR2 queue sorted by time, filters | Tasks 3, 8 | ✅ |
| FR3 review screen contents | Tasks 3, 8 | ✅ (text shown alongside audio; word-level sync not built) |
| FR4 approve (+publish/schedule [OPEN]), request changes w/ comments, reject w/ reason | Task 4; publish-now default | ✅ / ⚠️ scheduling open |
| FR5 publish → visible | Tasks 5, 6 | ✅ |
| FR6 state machine supports later auto-publish | Task 2 hook | ✅ |
| FR7 decisions in `review_items` and audit | Task 4 | ✅ |
| FR8 writer notified in-app | Tasks 4, 7 | ✅ |
| Spec 02 listener episodes, series published on first episode | Tasks 5, 6 | ✅ |
| AC writer cannot approve/publish | Test | ✅ |
| AC no publish without approval | Test | ✅ |
| AC request changes needs comments | Test | ✅ |
| AC unpublish removes immediately; downloads [OPEN] | Task 5; app sync in plan 11 | ✅ / ➡️ plan 11 |

Review result: complete. Gap fixed during review: approval must be tied to the reviewed text and audio, otherwise an edit after approval could be published unreviewed; added `draft_version` and `audio_asset_id` to review items and checked them at publish.
