# Plan 02: Catalog and Publishing

Spec: [02-catalog-and-publishing.md](../02-catalog-and-publishing.md) · Order: 3 · Depends on: plans 15, 01

## Goal
The `catalog` module: series records, shelves and covers, listener browse endpoints that only show published content, and admin catalog editing.

## Design
- **Tables:** `series(id, owner_writer_id → users, title, premise, language, tone, themes text[], target_episode_minutes int default 18, status [draft|in_review|published|archived], is_ai_assisted bool default true (no API can set false), free_episode_count int default 1, play_count bigint default 0, published_at)`, `shelves(id, title, kind [mood|theme|genre], position)`, `shelf_items(shelf_id, series_id, position)`, `cover_assets(id, series_id, storage_key, is_active)`.
- **Public service (`CatalogService`):** `create_series(owner, data)`, `get_series_for_user(user, id)` (writer scoped, 404 if not owner), `list_series_for_user`, `update_series(user, id, data)`, `set_status(id, status)`, `increment_play_count(id, n)`, `get_published_series(id)`. Plans 03 (writer series CRUD), 08 (publishing) and 12 (play counts) use it.
- **Listener payload** always includes `is_ai_assisted: true` and the active cover URL.
- **Publishing rules:** listener endpoints filter `status = published`. Series → `published` when its first episode is published (implemented in plan 08 via `set_status`). Archived series are hidden from shelves and search but stay readable by direct id for listeners who already have progress ([OPEN] default chosen; noted).
- **Covers:** upload `image/jpeg|png|webp` ≤ 5 MB through `StoragePort`; uploading sets it active and deactivates others.
- **Search:** case-insensitive title match on published series ([OPEN] scope; default chosen).

## API
| Method | Path | Role |
| ------ | ---- | ---- |
| GET | `/shelves` (with published series per shelf) | listener+ |
| GET | `/series/{id}` | listener+ |
| GET | `/search?q=` | listener+ |
| GET/POST/PUT/DELETE | `/admin/shelves`, `/admin/shelves/{id}` | admin |
| PUT | `/admin/shelves/{id}/items` | admin |
| GET | `/admin/series` (all, any status) | admin |
| PUT | `/admin/series/{id}` (metadata, `free_episode_count`, owner reassignment, archive) | admin |
| POST | `/admin/series/{id}/cover` | admin (writers get the same via `/studio/series/{id}/cover` in plan 03) |

`GET /series/{id}/episodes` (published episodes) is added in plan 08 once episodes can be published.

## Tasks (one commit each)
1. Models and migration.
2. `CatalogService` with writer scoping and status rules; public exports.
3. Admin shelves CRUD and ordering; audit entries.
4. Admin series edit, owner reassignment, archive; cover upload; audit entries.
5. Listener endpoints `/shelves`, `/series/{id}`, `/search`.
6. Regenerate API client.

## Tests
- Draft, in-review and archived series never appear in `/shelves` or `/search`; published do.
- `/series/{id}` for a draft series → 404 for listeners.
- Shelf reorder changes `/shelves` order immediately.
- Every listener series payload has `is_ai_assisted: true`; PUT with `is_ai_assisted: false` is rejected.
- Writer A cannot read writer B's series via the service (404).
- Cover upload: wrong type → 422; new cover becomes active; URL is signed.
- Audit rows for shelf and series edits.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| FR1 series record fields and statuses | Task 1 | ✅ |
| FR2 covers, one active | Task 4 | ✅ |
| FR3 shelves by mood/theme, ordered, ordered items | Tasks 1, 3 (`kind` field) | ✅ |
| FR4 listeners see only published series | Task 5 | ✅ |
| FR4 listeners see only published episodes | Plan 08 | ➡️ plan 08 |
| FR4 episode publish requires approval; series published on first episode | Plan 08 using `set_status` | ➡️ plan 08 |
| FR4 archive behaviour [OPEN] | Default chosen (hidden from browse, readable by id) | ⚠️ confirm with owner |
| FR5 free episode count stored | Tasks 1, 4 | ✅ |
| FR6 play counts derived from `play_started`, cached | Column here; updates in plan 12 | ➡️ plan 12 |
| FR7 AI-assisted label always, cannot be disabled | Tasks 1, 5 | ✅ |
| API listener `/series/{id}/episodes` | Plan 08 | ➡️ plan 08 |
| AC draft/in-review never in listener endpoints | Task 5 tests | ✅ |
| AC shelf order changes without release | Task 3/5 test | ✅ |
| AC payload has `is_ai_assisted: true` | Task 5 test | ✅ |

Review result: complete for this plan's scope. Gap found during review: the spec sketch had no way to reassign a deactivated writer's series (needed by spec 01 FR4); added owner reassignment to `PUT /admin/series/{id}`.
