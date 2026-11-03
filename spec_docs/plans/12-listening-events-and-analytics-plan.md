# Plan 12: Listening Events and Analytics

Spec: [12-listening-events-and-analytics.md](../12-listening-events-and-analytics.md) · Order: 12 · Depends on: plans 08, 09, 14

## Goal
Ingest listening events, keep playback progress and downloads, compute the key metrics, update play counts, and show an admin analytics dashboard.

## Design
- **Module `listening`:** `listening_events(id, client_event_id unique per user, user_id null, episode_id, series_id, event_type, position_seconds, device jsonb, session_id, client_ts, received_at, to_episode_id null)`, `playback_progress(user_id, episode_id, position_seconds, completed, updated_at)` PK `(user_id, episode_id)`, `downloads(user_id, episode_id, downloaded_at, removed_at)`.
- **Ingestion:** `POST /events` batch ≤ 200 events, ≤ 256 KB; idempotent by `(user_id, client_event_id)` via `ON CONFLICT DO NOTHING`; only published episodes; unknown types → 422 for that item (batch returns accepted/rejected counts). Rate limited.
- **Progress:** `PUT /me/progress/{episode_id}` with `position_seconds` and `client_ts`; latest `client_ts` wins. `GET /me/progress` (with "continue listening" ordering). `completed` set when position ≥ 95% of duration or a `play_completed` event arrives ([OPEN] threshold default 95%).
- **Downloads:** `POST /me/downloads`, `DELETE /me/downloads/{episode_id}`, `GET /me/downloads` (also tells the app which downloaded episodes are no longer published).
- **Account deletion:** subscriber to `user_deleted` sets `user_id = null` on events (anonymise) and deletes progress and downloads.
- **Module `analytics`:** `episode_daily_stats(episode_id, day, plays, completions, next_episode_starts, listeners)`, `episode_dropoff_minutes(episode_id, minute, count)`, `user_activity_days(user_id, day)` (for return rates). Arq cron job `aggregate_listening` every 15 minutes processes events since a watermark (`analytics_watermarks`), idempotent; also increments `series.play_count` through `CatalogService.increment_play_count`.
- **Metrics:** completion rate = completions / plays; next-episode rate = next_episode_started / completions; drop-off distribution per minute; day-1/7/30 return = share of users first active on day D who are active on D+1 / D+7 / D+30.
- **Retention [OPEN]:** raw events kept 13 months by default (cleanup job).
- **Cost per finished listening minute:** plan 14 `/admin/costs` now uses completed minutes from `episode_daily_stats`.

## API
- Listener: `POST /events`, `GET /me/progress`, `PUT /me/progress/{episode_id}`, `GET/POST /me/downloads`, `DELETE /me/downloads/{episode_id}`
- Admin: `GET /admin/analytics/overview?from=&to=`, `GET /admin/analytics/series/{id}`, `GET /admin/analytics/episodes/{id}` (incl. drop-off histogram), `GET /admin/analytics/retention`
- (Writer listener-data panel is Later.)

## Studio UI
- Admin Analytics page: KPI tiles (plays, completion rate, next-episode rate, D1/D7/D30), per-series table, episode detail with drop-off histogram highlighting the steepest minute. Follows the dataviz guidance (accessible palette, light/dark).

## Tasks (one commit each)
1. Listening models and migration.
2. Event ingestion with idempotency, validation, limits.
3. Progress and downloads endpoints.
4. Account deletion subscriber.
5. Analytics tables, aggregation job with watermark, play count updates, retention cleanup.
6. Metrics queries and admin endpoints; cost-per-minute hook.
7. Studio analytics page.
8. Regenerate API client; tests with seeded dataset.

## Tests
- Same batch twice → counted once.
- Seeded dataset → expected completion, next-episode, drop-off and return numbers.
- Offline events with old `client_ts` stored with that timestamp; progress uses latest `client_ts`.
- Events for unpublished episodes rejected.
- Account deletion anonymises events and deletes progress/downloads.
- Play count on `/series/{id}` increases after aggregation.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| Event types and fields | Tasks 1, 2 | ✅ |
| FR1 batch, idempotent, published only | Task 2 | ✅ |
| FR2 offline queue/flush | Plan 11 (app) | ➡️ plan 11 |
| FR3 rate and size limits | Task 2 | ✅ |
| FR4 aggregates: completion, next-episode, drop-off, D1/D7/D30, play counts | Tasks 5, 6 | ✅ |
| FR5 admin dashboard with drop-off histogram | Task 7 | ✅ |
| FR6 writer panel Later | Not built | ✅ (Later) |
| FR7 privacy, delete/anonymise | Task 4 | ✅ |
| Progress, downloads tables (spec 9) | Tasks 1, 3 | ✅ |
| AC duplicates not double-counted | Test | ✅ |
| AC numbers match seeded dataset | Test | ✅ |
| AC offline client timestamps | Test | ✅ |
| AC deletion anonymises | Test | ✅ |
| Open: retention, completion threshold | Defaults 13 months, 95% | ⚠️ confirm with owner |

Review result: complete. Gap fixed during review: return-rate metrics need per-user activity days that raw events alone make expensive to query; added `user_activity_days`.
