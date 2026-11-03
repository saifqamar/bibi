# Plan 11: Mobile App — Player and Offline

Spec: [11-mobile-player-and-offline.md](../11-mobile-player-and-offline.md) · Order: 14 · Depends on: plans 10, 12

## Goal
Background-capable player with lock-screen controls, speed, sleep timer, resume and auto-advance; offline downloads; progress and listening events that survive being offline.

## Design
- **Playback:** `react-native-track-player` ([CHECK] Expo SDK compatibility at implementation; requires dev build, config plugin and `PlaybackService`). Wrapped in `src/player/engine.ts` (`PlayerEngine` interface) so tests use a fake engine.
- **Backend addition:** `GET /episodes/{id}/playback` → `{url (signed, expiring), duration_seconds, series_id, next_episode_id}` (published only).
- **Player store (Zustand):** queue, current episode, position, rate (persisted), sleep timer state.
- **Controls:** play/pause, seek bar, ±15 s, previous/next, speeds 0.75/1/1.25/1.5/1.75/2, sleep timer (15/30/45/60 min, end of episode), auto-advance, AI-assisted label in full player, mini player on all tabs. Remote events (lock screen, headset, Bluetooth) map to the same actions; audio interruptions pause and resume per OS policy.
- **Progress:** saved locally every 5 s and on pause/background/exit; synced with `PUT /me/progress` (debounced, batched on reconnect); latest client timestamp wins; on start, use the later of local and server position.
- **Events:** `src/events/queue.ts` persists events in AsyncStorage with `client_event_id` (uuid), flushes in batches to `POST /events` on connect/foreground; emits play_started, paused, resumed, completed, drop_off (on stop/background before completion), next_episode_started, download_started/completed.
- **Downloads:** `expo-file-system` resumable downloads into app documents; state machine (queued, downloading, paused, done, failed); storage screen with sizes, delete one, delete all; player prefers the local file; sync with `/me/downloads` and remove files for episodes no longer published ([OPEN] default from plan 08: remove on next sync).

## Tasks (one commit each)
1. Backend playback endpoint and tests.
2. Player engine interface, track-player implementation, playback service, fake engine.
3. Player store, mini player and full player screen with controls, speed, sleep timer, auto-advance.
4. Progress persistence and sync.
5. Event queue and emitters.
6. Downloads manager, series-page download buttons, storage screen, sync cleanup; library downloaded list.
7. Tests (Jest with fake engine and mocked file system/network).

## Tests
- Resume starts within 5 s of the saved position (local or server, later wins).
- Sleep timer pauses at expiry; "end of episode" pauses at the end instead of advancing.
- Speed persists across episodes.
- Auto-advance plays the next episode and emits `next_episode_started`.
- Offline: downloaded episode plays from local file; events queued offline flush after reconnect with original timestamps.
- Unpublished downloaded episode is deleted on sync.
- Background/lock-screen: verified manually on device builds (checklist in the plan's PR), since it cannot run in Jest.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| Player FR1 controls | Task 3 | ✅ |
| FR2 speed 0.75–2x | Task 3 | ✅ |
| FR3 sleep timer incl. end of episode | Task 3 | ✅ |
| FR4 resume, local + server sync | Task 4 | ✅ |
| FR5 background + lock-screen via track-player, dev builds [CHECK] | Task 2 | ✅ / manual device check |
| FR6 interruptions, headset, Bluetooth | Task 2 remote events | ✅ / manual device check |
| FR7 auto-advance, AI label in full player | Task 3 | ✅ |
| FR8 signed URLs | Task 1 | ✅ |
| Offline FR1–3 download states, offline play, storage screen | Task 6 | ✅ |
| FR4 download events and `downloads` sync | Tasks 5, 6 | ✅ |
| FR5 removed episodes cleaned [OPEN] | Task 6 default | ⚠️ confirm |
| Progress sync rules | Task 4 | ✅ |
| Spec 12 FR2 offline event queue | Task 5 | ✅ |
| AC background play on iOS/Android | Manual device checklist | ⚠️ manual |
| AC airplane-mode play and later sync | Test | ✅ |
| AC resume within 5 s | Test | ✅ |
| AC sleep timer, speed persistence | Tests | ✅ |

Review result: complete. Gap found during review: the spec has no API that returns a playable URL plus next episode; added `GET /episodes/{id}/playback`. Background audio cannot be proven in CI; recorded as a manual device check.
