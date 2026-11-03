# 08. Review and Approval

**Modules:** `admin`, `catalog` · **Component:** Studio admin area · **Scope:** MVP

## Goal
Make sure every episode is checked by an admin before listeners can hear it.

## Functional requirements
1. **Submit:** writer submits an episode with `audio_ready` status; it enters the review queue as `in_review`. Submission requires: no open continuity `error` issues, audio present.
2. **Queue:** admin sees pending items sorted by submission time, filterable by series and writer.
3. **Review screen:** audio player, episode text (synced where possible), story bible reference, continuity report, AI cost, version history.
4. **Decisions:**
   - **Approve** → `approved`; admin can publish immediately or schedule. **[OPEN]** scheduled publishing for MVP vs. publish-now only (default: publish-now).
   - **Request changes** → `changes_requested` with required comments; writer is notified and edits; resubmit returns it to the queue.
   - **Reject** → with reason; episode stays unpublished.
5. **Publish:** approved episode becomes `published` and visible to listeners (spec 02).
6. **State machine:** built so a per-writer `auto_publish` flag can be added later without schema change to the flow. Default: all episodes need review.
7. **Audit:** every decision, with reviewer and comments, is stored in `review_items` and the audit log.
8. **Notifications:** writers are told of decisions (in-app in MVP; email via `EmailPort` optional).

## Data
`review_items(id, episode_id, status, reviewer_id, comments, decided_at)`, `episodes.status`, `audit_log`.

## API (sketch)
- `POST /episodes/{id}/submit`
- `GET /admin/review-queue`, `GET /admin/review-items/{id}`
- `POST /admin/review-items/{id}/approve|request-changes|reject`
- `POST /admin/episodes/{id}/publish`, `POST /admin/episodes/{id}/unpublish`

## Acceptance criteria
- A writer token cannot approve or publish.
- An episode cannot reach `published` without an `approved` review item.
- "Request changes" without comments is rejected.
- Unpublishing removes the episode from listener endpoints immediately; existing downloads remain playable until the app next syncs. **[OPEN]**

## Open items
- Scheduled publishing; auto-publish for trusted writers (default: no).
