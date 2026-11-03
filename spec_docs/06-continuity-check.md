# 06. Continuity Check

**Module:** `ai` (graph `continuity`) · **Scope:** MVP

## Goal
Catch contradictions between a new episode and the story bible or earlier episodes before it goes to audio.

## Functional requirements
1. Runs as its own graph, callable standalone (writer clicks "Check continuity") and as a step of drafting.
2. **Inputs:** episode text (by ID), bible entities, episode summaries and relevant earlier passages via retrieval.
3. **Checks:**
   - Character facts (traits, relationships, status such as alive/dead, location)
   - Timeline order and story-time consistency
   - World-rule violations
   - Plot threads: resolved threads reopened, or opened threads dropped without note
   - Name, spelling and speaker-tag consistency
4. **Output:** list of issues, each with severity (`error`, `warning`), type, a short description, the quoted conflicting text in this episode, and the source fact it conflicts with (entity id or earlier episode reference).
5. Writer resolves each issue: edit text, update canon (creates a proposal), or mark "intentional" with a note (stored, not re-flagged).
6. Re-check after edits; only unresolved issues remain open.
7. Results are stored per run and linked to the draft version checked.

## Data
Add `continuity_issues(id, workflow_run_id, episode_id, draft_version, severity, type, description, quote, source_ref, status [open, fixed, intentional], resolution_note)`.

## Acceptance criteria
- Seeded test cases (a dead character speaks, a timeline reversal, a rule broken) are each flagged.
- "Intentional" issues are not re-flagged on re-check of the same text.
- An episode cannot move to `ready_for_audio` with open `error` issues. Warnings do not block.
- Cost of the check is recorded against the episode.

## Open items
- Precision/recall target; build a small evaluation set of stories with known contradictions.
