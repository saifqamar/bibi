# Plan 11: manual device checklist

Background audio, lock-screen controls and audio interruptions cannot run in Jest. Check them on a
development build (`pnpm --filter @bibi/mobile ios` / `android`) on a real device before release.

| # | Check | iOS | Android |
| - | ----- | --- | ------- |
| 1 | Start an episode, lock the phone: audio keeps playing. | ☐ | ☐ |
| 2 | Lock screen / notification shows the episode title, series and cover. | ☐ | ☐ |
| 3 | Lock-screen play/pause and ±15 s seek work; the app shows the new position when reopened. | ☐ | ☐ |
| 4 | Switch to another app for 5 minutes: playback continues; the position is saved. | ☐ | ☐ |
| 5 | Incoming call (or a timer/alarm) pauses playback; it can be resumed afterwards. | ☐ | ☐ |
| 6 | Unplug wired headphones or disconnect Bluetooth: playback pauses. | ☐ | ☐ |
| 7 | Headset / Bluetooth play-pause button toggles playback. | ☐ | ☐ |
| 8 | Silent switch on (iOS): audio still plays. | ☐ | — |
| 9 | Auto-advance to the next episode works while the phone is locked. | ☐ | ☐ |
| 10 | Sleep timer pauses playback while the phone is locked. | ☐ | ☐ |
| 11 | Airplane mode: a downloaded episode plays; after reconnecting, events and progress reach the server. | ☐ | ☐ |
| 12 | Kill the app mid-episode, reopen: it resumes within 5 seconds of where it stopped. | ☐ | ☐ |
