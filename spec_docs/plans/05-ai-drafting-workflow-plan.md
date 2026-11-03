# Plan 05: AI Drafting Workflow

Spec: [05-ai-drafting-workflow.md](../05-ai-drafting-workflow.md) · Order: 7 · Depends on: plans 03, 04, 14

## Goal
A LangGraph drafting graph that writes one episode from beats and canon, pauses for the writer, runs the continuity check, proposes canon updates, and resumes days later from Postgres checkpoints.

## Design
- **Files:** `ai/service.py` (`run_workflow(name, input, thread_id)`, `resume(run_id, payload)`, `status(run_id)`, `cancel(run_id)`), `ai/registry.py` (name → builder), `ai/checkpointer.py` (`PostgresSaver` from settings; `MemorySaver` in unit tests of graph logic only), `ai/graphs/drafting/{state,nodes,graph}.py`.
- **State (IDs and flags only):** `{run_id, episode_id, series_id, draft_version, regenerate: [{start,end,note}] | None, continuity_round, proposals_created}`.
- **Nodes:**
  1. `load_context`: reads beats, bible snapshot, previous episode summaries (pgvector similarity on beats + last two episodes by number) via `writing` public service; stores nothing large in state.
  2. `draft`: calls `LLMPort` with system prompt (canon rules, script format, target length) and beats; saves a new draft version (`source=ai`); sets status `drafting`.
  3. `writer_review` (**interrupt**): payload `{kind: "draft_review", draft_version}`; resume with `{action: approve}` | `{action: edit, text}` (saves human version) | `{action: regenerate, sections: [{start, end, note}]}` → `regenerate_sections` → back to `writer_review`.
  4. `continuity`: invokes the continuity graph as a subgraph (plan 06; a no-issue stub until then).
  5. `resolve_contradictions` (**interrupt** only when open `error` issues): resume with `{action: resolved}` → back to `continuity`.
  6. `propose_canon`: LLM extracts new facts → `BibleService.propose(...)` rows; writes summary candidate.
  7. `confirm_canon` (**interrupt** when proposals exist): resume `{action: done}` after the writer accepted/rejected in the proposals panel.
  8. `finalize`: stores `episode_summaries(episode_id, summary, embedding vector(1536))`, sets episode `ready_for_audio`.
- **Section regeneration** also available outside a run: `POST /studio/episodes/{id}/regenerate-section` starts a short `section_regen` workflow that saves a new AI version.
- **Execution:** API creates the `workflow_run` (queued) and enqueues `run_workflow_job` on the `drafting` queue; worker runs the graph until it ends or interrupts, updating run status (`waiting` with `interrupt_payload`) and events. Resume enqueues `resume_workflow_job`. Thread id `episode-{id}:drafting`.
- **Guards:** one active (queued/running/waiting) drafting run per episode → 409 `workflow_already_active`. Rate limit on start/resume.
- **Failures:** node errors retried 2× with backoff; then run `failed` with error; `resume` on a failed run re-invokes from the last checkpoint.
- **Cost:** every LLM/embedding call uses metered adapters with the run's `UsageContext`.

## API
- `POST /studio/episodes/{id}/workflows/drafting` → `{workflow_run_id}`
- `POST /studio/workflow-runs/{id}/resume` (payload per interrupt kind), `POST /studio/workflow-runs/{id}/cancel`
- `POST /studio/episodes/{id}/regenerate-section` → `{workflow_run_id}`
- (status and SSE events from plan 14)

## Studio UI
- "Draft with AI" button on planned episodes; live step progress from SSE.
- Interrupt panels: draft review (approve / edit in editor / select text + note → regenerate), contradictions (list from plan 06), canon confirmation (links to proposals panel, "Done").
- Cancel and resume buttons; failed runs show the error.
- Editor: select text → "Regenerate selection" with note.

## Tasks (one commit each)
1. `episode_summaries` table with vector column + migration; writing public reads for context.
2. Checkpointer, registry, service skeleton (start, status, cancel) with run bookkeeping.
3. Drafting graph nodes and graph with interrupts (continuity stub).
4. Worker jobs and queue wiring; resume; retry and failure handling; guards and rate limit.
5. Canon proposal and summary/embedding nodes.
6. Section regeneration workflow and endpoint.
7. Prompts module (versioned prompt templates) with the fake LLM scripted for tests.
8. Studio: start/progress/interrupt panels, cancel/resume.
9. Studio: regenerate selection in editor.
10. Regenerate API client; end-to-end tests.

## Tests (fake LLM and embeddings, real Postgres checkpointer)
- Full run: start → waits at draft review → approve → continuity (no issues) → proposals created → wait → done → episode `ready_for_audio`, summary stored with embedding.
- New service/app instance between interrupts (simulating days later) resumes at the same interrupt.
- Regenerate sections produces a new AI version and returns to review; edit produces a human version.
- No canon table changes until proposals are accepted.
- Second start while active → 409.
- Failing LLM → retries then `failed`; resume after fixing continues.
- Usage rows for the run sum to the episode cost.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| Own compiled graph, registry, service entry points | Tasks 2, 3 | ✅ |
| Postgres checkpointer, `episode-{id}:drafting` thread, pause for days | Tasks 2, 4 + resume test | ✅ |
| Small state, IDs only | State design | ✅ |
| Background workers, LangGraph only in `ai` | Task 4 + import-linter | ✅ |
| Flow 1 load context incl. retrieval | Tasks 1, 3 | ✅ |
| Flow 2 draft against beats + canon, target length | Tasks 3, 7 | ✅ |
| Flow 3 interrupt: approve / edit / regenerate sections | Task 3 | ✅ |
| Flow 4–5 continuity + contradiction interrupt | Task 3 (stub), plan 06 | ➡️ plan 06 completes |
| Flow 6–7 propose canon + summary, writer confirms | Task 5 | ✅ |
| Flow 8 summary + embedding, `ready_for_audio` | Task 5 | ✅ |
| Rules: no silent canon change; versions with source; cost per call; retry then failed and resumable | Tasks 3–5 | ✅ |
| Writer UI: start, live progress, cancel, resume | Task 8 | ✅ |
| API start/status/events/resume/cancel | Task 4 + plan 14 | ✅ |
| Editor "regenerate selected section" (spec 04) | Tasks 6, 9 | ✅ |
| AC resume days later | Test | ✅ |
| AC fake LLM end-to-end incl. both interrupts | Test (contradiction interrupt tested in plan 06) | ✅ (split) |
| AC no canon change without acceptance | Test | ✅ |
| AC two simultaneous runs rejected | Test | ✅ |
| LLM provider [OPEN] | Anthropic adapter + fake; owner picks model | ⚠️ confirm with owner |

Review result: complete. Gap fixed during review: the spec's flow step 6 needed a writer action between proposing and finalising; added the `confirm_canon` interrupt.
