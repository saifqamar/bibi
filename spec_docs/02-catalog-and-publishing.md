# 02. Catalog and Publishing

**Module:** `catalog` · **Scope:** MVP

## Goal
Hold series metadata, shelves and covers, and control what listeners can see.

## Functional requirements
1. **Series record:** title, premise, language, tone, themes, `status` (`draft`, `in_review`, `published`, `archived`), `is_ai_assisted` (default true, always shown), `free_episode_count`.
2. **Covers:** upload cover assets to object storage; one active cover per series.
3. **Shelves:** admin creates shelves by mood or theme (not only broad genres), orders them, and places series in them with order.
4. **Publishing rules:**
   - Listeners see only series in `published` status and episodes in `published` status.
   - Episode publish requires admin approval (see spec 08). Series becomes `published` when its first episode is published.
   - Archiving hides a series from browse but keeps it for existing listeners' library and progress. **[OPEN]** exact behaviour.
5. **Free vs paid:** admin sets per-series `free_episode_count` (MVP stores it; enforcement starts with billing).
6. **Play counts:** shown on series pages; derived from `play_started` events (see spec 12), cached.
7. **AI-assisted label:** returned in every listener-facing series payload; cannot be disabled.

## Data
`series`, `shelves`, `shelf_items`, `cover_assets` (see master spec section 9).

## API (sketch)
- Listener: `GET /shelves`, `GET /series/{id}`, `GET /series/{id}/episodes`, `GET /search?q=` (basic)
- Admin: `POST/PUT/DELETE /admin/shelves`, `PUT /admin/shelves/{id}/items`, `PUT /admin/series/{id}`, `POST /admin/series/{id}/cover`

## Acceptance criteria
- A draft or in-review series never appears in listener endpoints.
- Shelf order changes appear in the app without a release.
- Every listener series payload includes `is_ai_assisted: true`.

## Open items
- Archive behaviour; search scope for MVP.
