# Plan 06: Continuity Check

Spec: [06-continuity-check.md](../06-continuity-check.md) · Order: 8 · Depends on: plan 05

## Goal
A continuity graph that flags contradictions between an episode and the bible or earlier episodes, used standalone and inside drafting, with writer resolution and a gate before audio.

## Design
- **Graph `continuity`:** `gather` (bible snapshot, prior summaries by similarity, relevant earlier passages: top-k paragraphs from previous episodes' current drafts by embedding similarity) → `check` (LLM with JSON schema output: issues `[{severity, type, description, quote, source_ref}]`) → `validate` (drop issues whose `quote` is not in the text; dedupe; skip issues matching an `intentional` resolution with the same quote) → `store`.
- **Issue types:** `character_fact`, `timeline`, `world_rule`, `plot_thread`, `naming`.
- **Deterministic pre-checks** (no LLM, cheap and reliable): speaker names not in the bible → `naming` warning; resolved plot thread mentioned as open is left to the LLM.
- **Table:** `continuity_issues(id, workflow_run_id, episode_id, draft_version, severity [error|warning], type, description, quote, source_ref jsonb, status [open|fixed|intentional], resolution_note, resolved_by, resolved_at)`.
- **Resolution:** writer marks `fixed` (after editing text), `intentional` (note required), or creates a canon proposal from the issue (status stays open until re-check).
- **Re-check:** new run on the latest draft; issues from previous runs whose quote no longer appears become `fixed`; `intentional` ones are not re-raised for the same quote.
- **Gate:** `ready_for_audio` transition blocked while open `error` issues exist on the current draft (`409 continuity_errors_open`); warnings never block.
- **In drafting:** replaces the stub as a subgraph; the contradiction interrupt fires when open errors exist.

## API
- `POST /studio/episodes/{id}/workflows/continuity` → `{workflow_run_id}`
- `GET /studio/episodes/{id}/continuity-issues?status=`
- `POST /studio/continuity-issues/{id}/resolve` (`status: fixed|intentional`, `note`)
- `POST /studio/continuity-issues/{id}/propose-canon` (creates a canon proposal from the issue)

## Studio UI
- Continuity panel on the episode page: "Check continuity" button, issues grouped by severity with quote highlighted in the editor, actions fix / intentional (note) / update canon.

## Tasks (one commit each)
1. Table and migration; issue service with resolution and gate.
2. Continuity graph with pre-checks and LLM check (prompt + schema); registry entry; standalone endpoint.
3. Wire as subgraph into drafting with the contradiction interrupt.
4. Re-check logic (auto-fix missing quotes, intentional suppression).
5. Studio continuity panel.
6. Seeded evaluation fixtures + tests; regenerate API client.

## Tests
- Seeded fixtures with the fake LLM scripted to return the issue, plus validation logic: dead character speaks, timeline reversal, world rule broken → each flagged with severity and source.
- Hallucinated issue whose quote is not in the text is dropped.
- Intentional issue not re-flagged on re-check of the same text; removed quote → issue `fixed`.
- `ready_for_audio` blocked with open error, allowed with only warnings.
- Drafting run with an open error waits at the contradiction interrupt; after resolve + re-check it continues.
- Cost of the check recorded against the episode.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| FR1 own graph, standalone and in drafting | Tasks 2, 3 | ✅ |
| FR2 inputs: text, bible, summaries, earlier passages | Task 2 `gather` | ✅ |
| FR3 checks: character, timeline, world rule, plot threads, naming | Task 2 (types + pre-check) | ✅ |
| FR4 output fields incl. quote and source | Tasks 1, 2 | ✅ |
| FR5 resolve: edit, update canon (proposal), intentional with note | Tasks 1, 5 | ✅ |
| FR6 re-check leaves only unresolved | Task 4 | ✅ |
| FR7 stored per run, linked to draft version | Task 1 | ✅ |
| AC seeded cases flagged | Task 6 (scripted LLM; real-model quality measured by the eval set) | ✅ / ⚠️ real-model precision open |
| AC intentional not re-flagged | Task 4 test | ✅ |
| AC errors block `ready_for_audio`, warnings do not | Task 1 test | ✅ |
| AC cost recorded | Metered adapters (plan 14) | ✅ |
| Open: precision/recall target | Fixture set is the start of the eval set | ⚠️ owner to set target |

Review result: complete. Gap fixed during review: LLM checks can invent quotes; added the `validate` step that drops issues not grounded in the text.
