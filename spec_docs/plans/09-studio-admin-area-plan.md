# Plan 09: Studio Admin Area

Spec: [09-studio-admin-area.md](../09-studio-admin-area.md) · Order: 11 · Depends on: plans 01, 02, 07, 08, 14

## Goal
Complete the lazily loaded `/admin/*` area of the single Studio app on top of the admin APIs from earlier plans, and add the audit log viewer.

## Design
- Admin pages in `apps/studio/src/admin/*`, loaded with `React.lazy` from one entry so the writer bundle does not include them.
- Shared layout, tables, forms and dialogs with the writer area (`src/components`).
- Admin navigation: Review queue (plan 08 page), Writers, Catalog (Series, Shelves), Voices, Costs, Analytics (placeholder until plan 12), Audit log.
- Server checks already exist on every `/admin/*` endpoint; this plan adds tests that sweep all admin routes with writer and listener tokens.

## New backend
- `GET /admin/audit-log?actor_id=&entity_type=&entity_id=&from=&to=` (paginated).
- `PUT /admin/episodes/{id}/access` (`is_free: true|false|null`) for per-episode free/paid override.
- Router sweep test: enumerate every route under `/api/v1/admin` from the app and assert 403 for writer and listener tokens.

## Pages
1. **Writers:** list (email, status, series count, last login), invite dialog, pending invites with resend/revoke, deactivate/reactivate.
2. **Series:** all series table (status, writer, episodes, published), edit metadata, reassign owner, archive, cover upload, free episode count, per-episode free/paid toggles.
3. **Shelves:** create/rename/delete, reorder shelves, add/remove/reorder series in a shelf.
4. **Voices:** list, add, edit, deactivate, preview.
5. **Costs:** totals by date range, by series and episode, split by purpose; budgets.
6. **Audit log:** filters by actor, entity and date; metadata detail.

## Tasks (one commit each)
1. Audit log endpoint; episode access override endpoint; admin route sweep test.
2. Admin layout, navigation and lazy entry; bundle test (writer chunk excludes admin code).
3. Writers page.
4. Series and per-episode access pages.
5. Shelves page.
6. Voices page.
7. Costs page.
8. Audit log page.
9. Regenerate API client; Vitest tests for each page's main action.

## Tests
- Every `/admin/*` route → 403 for writer and listener tokens.
- Admin `GET /admin/series` returns all; writer `/studio/series` returns only own (re-asserted).
- Client guard: writer navigating to `/admin/...` is redirected.
- Build output: admin chunk is separate and not imported by the writer entry.
- Page tests: invite dialog posts; shelf reorder sends new order; episode free toggle calls endpoint; audit filters build the right query.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| One app, one login, role landing, admins use both areas | Plan 15 shell + task 2 | ✅ |
| Admin area lazy-loaded | Task 2 + bundle test | ✅ |
| Shared components | Design | ✅ |
| Client guards and server checks | Plan 15 guard + task 1 sweep | ✅ |
| FR1 writer management | Task 3 (+ plan 01 API) | ✅ |
| FR2 review queue | Plan 08 | ✅ |
| FR3 catalog management (metadata, shelves, covers) | Tasks 4, 5 | ✅ |
| FR4 free/paid per series and per episode | Tasks 1, 4 | ✅ |
| FR5 basic listening analytics | Plan 12 | ➡️ plan 12 |
| FR6 AI cost tracking views | Task 7 (+ plan 14 API) | ✅ |
| FR7 voice library management | Task 6 (+ plan 07 API) | ✅ |
| FR8 audit log viewer | Tasks 1, 8 | ✅ |
| AC writer cannot load `/admin/*`; every admin endpoint 403 | Tasks 1, 2 | ✅ |
| AC writer bundle excludes admin chunk | Task 2 | ✅ |
| AC admin sees all series; writer own | Task 1 test | ✅ |

Review result: complete. Gap fixed during review: spec 09 FR4 needs per-episode free/paid, which no earlier API provided; added the access override endpoint.
