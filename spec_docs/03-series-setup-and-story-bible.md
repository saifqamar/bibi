# 03. Series Setup and Story Bible

**Module:** `writing` · **Component:** Studio writer area · **Scope:** MVP

## Goal
Give writers a structured, editable source of truth ("canon") that the AI must follow.

## Functional requirements

### Series setup
- Fields: title, premise, themes, tone, target episode length (default 15-20 min), language.
- Writers create series; owner is set to the writer. Writers see only their own series.

### Story bible
Editable entities, all scoped to a series:
| Entity | Key fields |
| ------ | ---------- |
| Characters | name, description, traits, voice notes |
| Relationships | character A, character B, description, from episode |
| Locations | name, description |
| World rules | rule text |
| Timeline events | description, episode number, story time |
| Plot threads | title, status (open/resolved), opened in / resolved in episode |

Requirements:
1. Full CRUD on each entity in the Studio; writers can edit canon directly at any time.
2. **Canon changes are never silent.** AI-proposed changes appear as a pending diff (add/edit/remove) that the writer accepts or rejects per item.
3. Each canon change records who made it (writer or accepted AI proposal) in the audit log.
4. Deleting a character referenced by voice assignments or relationships warns and requires confirmation.
5. Bible view: tabbed list per entity, search, and a simple relationship list. A graph view is Later.
6. Voice notes on characters feed voice assignment (spec 07).

## Data
`characters`, `relationships`, `locations`, `world_rules`, `timeline_events`, `plot_threads` (master spec section 9). Add `canon_proposals(id, series_id, episode_id, entity_type, op, payload, status [pending, accepted, rejected], created_at)` to hold AI proposals.

## API (sketch)
- `POST/GET /series`, `GET/PUT /series/{id}`
- `GET/POST/PUT/DELETE /series/{id}/characters|relationships|locations|world-rules|timeline|plot-threads`
- `GET /series/{id}/canon-proposals`, `POST /canon-proposals/{id}/accept|reject`

## Acceptance criteria
- A writer cannot read or edit another writer's series or bible.
- AI workflows cannot write to canon tables directly; only accepting a proposal does.
- Edits are visible to the next drafting run immediately.

## Open items
- Bible import from existing notes/documents (Later).
