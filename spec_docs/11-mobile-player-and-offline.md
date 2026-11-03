# 11. Mobile App: Player and Offline

**Component:** Expo React Native app · **Module:** `listening` · **Scope:** MVP

## Goal
A dependable audio player that works in the background and offline.

## Functional requirements

### Player
1. Play/pause, seek bar, skip back/forward (default 15 s), previous/next episode.
2. Speed control (0.75x to 2x).
3. Sleep timer (preset durations and "end of episode").
4. **Resume:** position saved locally and synced to backend (`playback_progress`); resumes on any device from the latest position.
5. **Background play** and **lock-screen / notification controls** with cover, title and episode. Uses `react-native-track-player` with Expo dev builds (not Expo Go). **[CHECK]** current Expo and library compatibility.
6. Handles audio interruptions (calls, other apps), headphone disconnect and Bluetooth controls.
7. Auto-advance to the next episode; "AI-assisted" label shown in the full-screen player.
8. Streams from CDN via signed URLs where required.

### Offline downloads
1. Download an episode from the series page or player; progress, pause/resume, cancel, delete.
2. Downloads stored on device; play offline without network.
3. Storage management screen: list, size, delete all.
4. Download events recorded (spec 12); `downloads` synced when online.
5. Unpublished or removed episodes are cleaned up on next sync. **[OPEN]**

### Progress sync
- Position written locally every few seconds and on pause/exit; synced in batches; latest timestamp wins.

## API (sketch)
- `GET /episodes/{id}/playback` (signed URL, duration)
- `PUT /me/progress/{episode_id}`, `GET /me/progress`
- `POST /me/downloads`, `DELETE /me/downloads/{episode_id}`

## Acceptance criteria
- Audio continues with screen locked and app backgrounded on iOS and Android.
- A downloaded episode plays in airplane mode and its progress syncs after reconnect.
- Position after resuming is within 5 seconds of where playback stopped.
- Sleep timer pauses playback at expiry; speed persists across episodes.

## Later
Car mode.
