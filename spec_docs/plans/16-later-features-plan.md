# Plan 16: Later Features (no code)

Spec: [16-later-features.md](../16-later-features.md) · Order: after all MVP plans · No implementation PR

## Goal
Keep the MVP open to the later features without building them. This plan only checks that each design hook exists when the MVP plans are done, and states what each later feature would need.

## Hook checklist (verified as part of the owning plan's review)

| Later feature | Hook required in MVP | Owning plan |
| ------------- | -------------------- | ----------- |
| Billing (pass or subscription) | `free_episode_count` + per-episode `is_free`; signed playback URLs; `billing` module folder reserved; entitlement check point in `GET /episodes/{id}/playback` | 02, 09, 11 |
| Personalised recommendations | Listening events with user, episode, series, position; Mem0 kept out of canon | 12, 05 |
| Feedback agent | AI registry accepts new graphs; metered adapters | 05, 14 |
| Writer listener-data panel | Per-episode aggregates queryable by series owner | 12 |
| Earnings and payouts | Usage/cost and play data per series | 12, 14 |
| Ratings and comments | None beyond auth | 01 |
| Push notifications | `notifications` module folder reserved; publish event emitted | 08 |
| Car mode | `PlayerEngine` interface separates UI from playback | 11 |
| Full web player and account | Public + listener APIs reusable from web | 13 |
| Content moderation | Audit log; admin area structure | 09 |
| A/B tests on titles/covers | Cover assets support many per series | 02 |
| Trusted-writer auto-publish | `can_auto_publish(writer)` hook | 04, 08 |
| Voice-line review before stitch | `VoiceProductionPort` swap point | 07 |
| Bible graph view/import | Relationships stored as rows; bible snapshot | 03 |

## Out of scope (must not be built)
Public creator sign-up, user-generated content, video, social features, coin/token economy. Plan 01 tests assert there is no public writer sign-up.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| Every later feature listed with a design hook | Checklist above | ✅ |
| Out-of-scope list respected | Plan 01 test; no plans build these | ✅ |

Review result: complete. A later-feature PR starts with its own spec and plan.
