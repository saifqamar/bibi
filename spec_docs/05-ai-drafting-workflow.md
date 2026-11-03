# 05. AI Drafting Workflow

**Module:** `ai` (graph `drafting`) · **Scope:** MVP

## Goal
Draft one episode at a time from the writer's beats and the story bible, with the writer in control at defined points.

## Architecture
- One compiled LangGraph graph, registered by name in `ai/registry.py`; entry via `ai/service.py` (`run_workflow`, `resume`, `status`).
- Postgres checkpointer. One `thread_id` per episode per workflow, e.g. `episode-123:drafting`. A run can pause for days.
- Graph state is small: IDs and flags only. Bible and text stay in Postgres. **[CHECK]** current LangGraph APIs for interrupts and checkpointers.
- Runs on background workers, never in a request. No other module imports LangGraph.

## Flow
1. **Load context:** series, bible facts, this episode's beats, summaries of previous episodes (retrieval by ID and pgvector similarity).
2. **Draft** the episode text against beats and canon, targeting the series' episode length.
3. **Interrupt 1, draft review:** writer approves, edits, or requests regeneration of sections with notes. Regeneration loops back to step 2 for those sections only.
4. **Continuity check** (spec 06).
5. **Interrupt 2, contradictions:** if issues are found, writer fixes the text or updates canon; the check re-runs.
6. **Propose canon updates and summary** from approved text (new facts, timeline events, plot thread changes). Written as `canon_proposals`, not applied.
7. **Writer confirms** proposals (accept/reject per item).
8. Store episode summary and embedding; mark episode `ready_for_audio`.

## Rules
- AI never changes canon without confirmation.
- Every draft is saved as a version with source recorded.
- Every LLM call records tokens and cost against the episode (spec 14).
- Failures are retried with backoff; after limit the run is `failed` with an error visible to the writer, and can be resumed.

## Writer-facing behaviour
- Start drafting button on a planned episode.
- Live progress (step names) over SSE/WebSocket using the `workflow_run` id.
- Cancel a run; resume a paused or failed run.

## API (sketch)
- `POST /episodes/{id}/workflows/drafting` → `{workflow_run_id}`
- `GET /workflow-runs/{id}`, `GET /workflow-runs/{id}/events` (stream)
- `POST /workflow-runs/{id}/resume` (payload depends on interrupt: approve, edit, regenerate-with-notes, resolve)
- `POST /workflow-runs/{id}/cancel`

## Acceptance criteria
- Closing the browser mid-run and returning days later resumes at the same interrupt.
- A run with a fake LLM adapter passes graph tests end to end, including both interrupts.
- No canon table row changes unless a proposal was accepted.
- Two simultaneous runs on the same episode are rejected.

## Open items
- LLM provider and model (spec section 13, question 5).
- Prompt design and evaluation set for draft quality.
