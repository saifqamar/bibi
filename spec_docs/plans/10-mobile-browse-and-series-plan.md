# Plan 10: Mobile App — Sign-in, Browse and Series Page

Spec: [10-mobile-browse-and-series.md](../10-mobile-browse-and-series.md) · Order: 13 · Depends on: plans 01, 02, 08, 12

## Goal
The Expo listener app shell with auth, home shelves, continue listening, series page, search and library, working from cache when offline.

## Design
- `apps/mobile`: Expo (SDK current at implementation, [CHECK]) with Expo Router, TypeScript, NativeWind + React Native Reusables-style primitives, TanStack Query (persisted to AsyncStorage for offline home/series), Zustand (session, player state later), `expo-secure-store` for tokens. Dev builds (needed by plan 11).
- **Shared packages:** extract `packages/api-client` hooks used by both Studio and mobile into `packages/query-hooks` (TanStack Query hooks over the generated client) and request schemas into `packages/schemas` (zod) — closes the deferred item from plan 15.
- **Screens:** `(auth)/sign-in`, `(auth)/sign-up`, `(tabs)/index` (Home), `(tabs)/search`, `(tabs)/library`, `(tabs)/settings` (sign out, delete account), `series/[id]`.
- **Home:** "Continue listening" first when `/me/progress` has unfinished items, then admin shelves from `/shelves` as horizontal lists of `SeriesCard` (cover, title, AI-assisted badge).
- **Series page:** cover, title, premise, themes, language, play count, AI-assisted badge, play/continue button, episode list (number, title, duration, free/paid marker, progress ring, download state placeholder until plan 11).
- **States:** skeletons, empty states, offline banner (`@react-native-community/netinfo`), error with retry.
- Social login buttons hidden until providers are chosen ([OPEN]).

## Tasks (one commit each)
1. Expo app scaffold, NativeWind, UI primitives, workspace wiring.
2. Shared `query-hooks` and `schemas` packages; Studio switched to them where overlapping.
3. Auth: secure token storage, refresh, sign-in/up screens, guarded routes.
4. Home with continue listening and shelves; offline persistence and banner.
5. Series page and episode list.
6. Search and library tabs.
7. Settings with sign out and account deletion.
8. Jest + React Native Testing Library tests.

## Tests
- Home renders shelves from mocked API and shows continue listening first when progress exists.
- AI-assisted badge on every series card and the series page.
- Offline: cached home renders with offline banner.
- Continue button targets the stored episode and position.
- Only items returned by the API (published) are shown; no client-side status logic needed.
- Account deletion calls `DELETE /me` and signs out.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| FR1 sign-in/up email + social, secure session, account deletion | Tasks 3, 7 (social hidden until providers chosen) | ✅ / ⚠️ providers open |
| FR2 home shelves, AI badge, continue listening first | Task 4 | ✅ |
| FR3 series page contents, play/continue | Task 5 | ✅ |
| FR4 basic search [OPEN scope] | Task 6 title search | ✅ default |
| FR5 library: in-progress and downloaded | Task 6 (downloaded list fills in plan 11) | ✅ / ➡️ plan 11 |
| FR6 states incl. offline banner | Task 4 | ✅ |
| FR7 stack: RN Reusables + NativeWind, TanStack Query, Zustand, generated client | Tasks 1, 2 | ✅ |
| FR8 free episodes playable; paid markers informational | Task 5 | ✅ |
| AC only published shown | Server-enforced (plans 02/08) + test | ✅ |
| AC offline cached home | Test | ✅ |
| AC AI label visible | Test | ✅ |
| AC resume at stored position | Task 5 + plan 11 player | ✅ (split) |

Review result: complete. Gap fixed during review: plan 15 deferred shared hooks/schemas packages; this plan now owns them.
