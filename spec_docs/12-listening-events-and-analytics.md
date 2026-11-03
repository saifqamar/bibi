# 12. Listening Events and Analytics

**Modules:** `listening`, `analytics` · **Scope:** MVP

## Goal
Capture listening behaviour from day one to learn whether depth works for this audience, and show it to admins.

## Events
Sent by mobile (and later web) in batches:
| Event | Notes |
| ----- | ----- |
| `play_started` | episode, position, device, session |
| `play_paused` | position |
| `play_resumed` | position |
| `play_completed` | episode finished |
| `drop_off` | position in seconds where listener stopped |
| `next_episode_started` | from episode → to episode |
| `download_started`, `download_completed` | |

Every event carries `user_id`, `episode_id`, `position_seconds`, `device`, `session_id`, client timestamp.

## Functional requirements
1. `POST /events` accepts a batch; idempotent by client event id; validates episode exists and is published.
2. Mobile queues events offline and flushes on reconnect.
3. Rate limits on the endpoint; payload size limits.
4. **Aggregates** (nightly or incremental jobs):
   - Episode completion rate
   - Next-episode rate
   - Drop-off minute distribution per episode
   - Day-1, day-7, day-30 return rate
   - Play counts per series and episode (feeds public play counts)
5. **Admin dashboard:** charts per series and episode with date filters; drop-off histogram highlights where listeners leave. Chart design follows the project's dataviz guidance.
6. Per-episode listener-data panel for writers is **Later**.
7. Privacy: collect only needed data; events deleted or anonymised on account deletion.

## Data
`listening_events`, `playback_progress`, `downloads`, plus aggregate tables owned by `analytics`.

## Acceptance criteria
- Sending the same event batch twice does not double-count.
- Completion and drop-off numbers match a seeded test dataset.
- Events from offline sessions appear with correct client timestamps.
- Deleting an account removes or anonymises its events.

## Open items
- Raw event retention period; define "completed" threshold (default: reaches 95% of duration).
