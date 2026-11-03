# Plan 03: Series Setup and Story Bible

Spec: [03-series-setup-and-story-bible.md](../03-series-setup-and-story-bible.md) · Order: 4 · Depends on: plans 01, 02

## Goal
Writers create series and maintain an exact, editable story bible; AI changes to canon only happen through proposals the writer accepts.

## Design
- **Module:** `writing`. Series rows stay in `catalog`; writing calls `CatalogService` for series CRUD and ownership checks.
- **Tables:** `characters(id, series_id, name, description, traits text[], voice_notes, is_narrator=false)`, `relationships(id, series_id, character_a_id, character_b_id, description, from_episode)`, `locations(id, series_id, name, description)`, `world_rules(id, series_id, rule_text)`, `timeline_events(id, series_id, description, episode_number, story_time, position)`, `plot_threads(id, series_id, title, description, status [open|resolved], opened_in_episode, resolved_in_episode)`, `canon_proposals(id, series_id, episode_id null, entity_type, op [create|update|delete], entity_id null, payload jsonb, reason, status [pending|accepted|rejected], decided_by, decided_at)`.
- **Generic bible CRUD:** one router factory per entity type with shared scoping, validation (Pydantic schemas per entity) and audit.
- **Proposals:** `BibleService.propose(...)` is the only write path the `ai` module gets; `accept(proposal)` applies the change in one transaction and records `source=ai_proposal` in the audit log; `reject` only changes status.
- **Delete guard:** deleting a character referenced by relationships (and voice assignments from plan 07 via a registered reference checker) returns `409 entity_in_use` with the references unless `?force=true`.
- **Canon snapshot:** `BibleService.snapshot(series_id)` returns the whole bible as a compact dict for the AI module (plan 05).

## API (writer-scoped; admins see all)
- `GET/POST /studio/series`, `GET/PUT /studio/series/{id}`, `POST /studio/series/{id}/cover`
- `GET/POST /studio/series/{id}/{entity}` and `GET/PUT/DELETE /studio/series/{id}/{entity}/{entity_id}` for `characters|relationships|locations|world-rules|timeline|plot-threads`
- `GET /studio/series/{id}/bible?q=` (all entities, optional search)
- `GET /studio/series/{id}/canon-proposals?status=`, `POST /studio/canon-proposals/{id}/accept|reject`

## Studio UI (writer area)
- Series list and "New series" form (premise, themes, tone, target length, language).
- Series workspace with tabs: Overview (settings), Bible (sub-tabs per entity with list, search, create/edit dialog, delete with in-use warning), Proposals (pending diffs with accept/reject per item).

## Tasks (one commit each)
1. Writer series endpoints on top of `CatalogService`.
2. Bible models and migration.
3. Generic bible CRUD router + services + audit; search; snapshot.
4. Character delete guard with reference-checker registry.
5. Canon proposals: model, propose/accept/reject, endpoints.
6. Studio: series list, create, overview.
7. Studio: bible tabs with CRUD and search.
8. Studio: proposals panel.
9. Regenerate API client; Studio tests.

## Tests
- Writer A cannot list/read/edit writer B's series or bible (404); admin can.
- CRUD for each entity type; validation errors use the common error shape.
- Accepting a proposal applies create/update/delete; rejecting changes nothing in canon tables.
- No code path outside `BibleService.accept` writes canon for AI (checked by test that proposals are the only `ai`-reachable writes).
- Character delete with relationships → 409; with `force=true` deletes and cascades relationships.
- Studio: bible list renders, create dialog posts, proposals accept button calls API.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| Series setup fields, writer owns, writers see own | Task 1 (+ plan 02 service) | ✅ |
| Bible entities and fields | Task 2 | ✅ |
| FR1 full CRUD, edit canon any time | Tasks 3, 7 | ✅ |
| FR2 AI proposals as pending diff, per-item accept/reject | Tasks 5, 8 | ✅ |
| FR3 record who changed canon in audit log | Tasks 3, 5 | ✅ |
| FR4 delete referenced character warns, needs confirmation | Task 4 (voice assignment references registered in plan 07) | ✅ |
| FR5 tabbed bible view, search, relationship list | Task 7 | ✅ |
| FR6 voice notes feed voice assignment | Field here; used in plan 07 | ➡️ plan 07 |
| `canon_proposals` table | Task 5 | ✅ |
| AC writer cannot access other writer's bible | Task 3 tests | ✅ |
| AC AI cannot write canon directly | Task 5 design + test | ✅ |
| AC edits visible to next drafting run | `snapshot()` reads live tables (plan 05 uses it) | ✅ |

Review result: complete. Gap found during review: the AI needs a narrator voice and a canonical way to read the bible; added `is_narrator` flag and `snapshot()`.
