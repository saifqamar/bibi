# Bibi Feature Specs

Feature-level specifications derived from `BIBI_SPEC.md` (v1.1 draft). Each file covers one feature area: goal, users, requirements, data, API, acceptance criteria and open items.

Conventions (same as the master spec):
- **[OPEN]**: undecided; use the stated default until the owner decides.
- **[CHECK]**: depends on library behavior; verify against current official docs before implementing.
- **MVP** / **Later** mark release scope.
- All endpoints live under `/api/v1`, are role-protected on the server, and are paginated when they return lists.

## Index

| # | Spec | Component | Scope |
| - | ---- | --------- | ----- |
| 01 | [Identity, auth and roles](01-identity-auth-roles.md) | Backend | MVP |
| 02 | [Catalog and publishing](02-catalog-and-publishing.md) | Backend, Studio | MVP |
| 03 | [Series setup and story bible](03-series-setup-and-story-bible.md) | Studio (writer) | MVP |
| 04 | [Episode planning, editor and versions](04-episode-planning-and-editor.md) | Studio (writer) | MVP |
| 05 | [AI drafting workflow](05-ai-drafting-workflow.md) | Backend (ai) | MVP |
| 06 | [Continuity check](06-continuity-check.md) | Backend (ai) | MVP |
| 07 | [Voice and audio production](07-voice-and-audio-production.md) | Backend, Studio | MVP |
| 08 | [Review and approval](08-review-and-approval.md) | Studio (admin) | MVP |
| 09 | [Studio admin area](09-studio-admin-area.md) | Studio (admin) | MVP |
| 10 | [Mobile app: browse and series](10-mobile-browse-and-series.md) | Mobile | MVP |
| 11 | [Mobile app: player and offline](11-mobile-player-and-offline.md) | Mobile | MVP |
| 12 | [Listening events and analytics](12-listening-events-and-analytics.md) | Backend, Studio | MVP |
| 13 | [Public website](13-public-website.md) | Website | MVP (after pilot) |
| 14 | [AI cost tracking and observability](14-ai-cost-and-observability.md) | Backend | MVP |
| 15 | [Platform, API and non-functional](15-platform-and-nfr.md) | All | MVP |
| 16 | [Later features](16-later-features.md) | All | Later |

## Build order

Follows the master spec milestones: foundation (01, 15) → writer core (03, 04, 05, 06, 14) → audio and review (07, 08, 09, 02) → listener app (10, 11, 12) → pilot → website (13) → later (16).

## Rules that apply to every spec

- Modules talk only through public service interfaces; no vendor SDK outside an adapter; wiring lives in `container.py`.
- AI and TTS work runs in background workers, never in the request cycle.
- The AI never changes story canon without writer confirmation.
- No public writer sign-up. One Studio app for writers and admins; admin routes are protected on client and server.
- Every story shows the "AI-assisted" label.
