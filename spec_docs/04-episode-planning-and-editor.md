# 04. Episode Planning, Editor and Versions

**Module:** `writing` · **Component:** Studio writer area · **Scope:** MVP

## Goal
Let the writer control story flow through beats, then edit and version each episode.

## Functional requirements

### Episode plan
1. Writer creates and orders episodes in a series (`episode_number`, title).
2. Each episode has an ordered list of **beats** (short text items), plus free-form notes.
3. Plans can be edited until drafting starts; after that, changes apply to the next regeneration.

### Episode status flow
`planned → drafting → ready_for_audio → audio_ready → in_review → (changes_requested ↔ in_review) → approved → published`

Status changes are enforced by the service; invalid transitions are rejected.

### Editor
1. Rich text editor for the episode text with speaker-tagged dialogue (needed for voice splitting, spec 07).
2. **Regenerate selected section:** select text, add a note, trigger AI regeneration of just that range.
3. **Versions:** every save of meaningful change creates an `episode_drafts` version with `source` (`ai` or `human`) and author. Version list, view, restore, and side-by-side compare.
4. **Locking:** one editor per episode at a time to avoid overwrite conflicts. **[OPEN]** simple optimistic version check vs. lock.
5. Word count and estimated listening time (at default speaking rate) shown live against the target length.
6. Editing an approved/published episode creates a new draft and sends it back through review.

## Data
`episode_plans`, `episodes`, `episode_drafts` (master spec section 9).

## API (sketch)
- `GET/POST /series/{id}/episodes`, `PUT /episodes/{id}`, `PUT /episodes/{id}/plan`
- `GET /episodes/{id}/drafts`, `POST /episodes/{id}/drafts`, `POST /episodes/{id}/drafts/{v}/restore`
- `GET /episodes/{id}/drafts/compare?a=&b=`

## Acceptance criteria
- Every text change is recoverable from version history.
- Version records show whether AI or a human produced it.
- Invalid status transitions return a machine-readable error.
- Estimated duration is shown and updates as text changes.

## Open items
- Concurrency approach (lock vs. optimistic check).
