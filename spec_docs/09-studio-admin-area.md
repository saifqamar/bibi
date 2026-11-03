# 09. Studio Admin Area

**Component:** Studio (`/admin/*`) · **Modules:** `admin`, `analytics`, `identity`, `catalog` · **Scope:** MVP

## Goal
One role-protected area of the single Studio app for running the catalog and the writer team. There is no separate admin app.

## Structure
- One Studio app, one login. After sign-in, writers land in `/writer/*`, admins can use both areas.
- Admin area is lazy-loaded; writers never download it.
- Shared layout, tables, forms and UI components with the writer area.
- Route guards on the client **and** role checks on every API endpoint.

## Functional requirements
1. **Writer management:** invite, resend, revoke, deactivate, reactivate; list writers with series counts and status (spec 01).
2. **Review queue:** see spec 08.
3. **Catalog management:** edit series metadata, shelves (create, order, assign), cover assets (spec 02).
4. **Free/paid episodes:** set free episode count per series and mark individual episodes free or paid (stored in MVP, enforced with billing).
5. **Basic listening analytics:** completion rate, next-episode rate, drop-off distribution per episode, play counts, day-1/7/30 return (spec 12).
6. **AI cost tracking:** cost per episode and per series, split by LLM tokens and TTS characters, with totals and date filter (spec 14).
7. **Voice library management:** add, edit, deactivate voices.
8. **Audit log viewer:** filter by actor, entity and date.

## Acceptance criteria
- A writer cannot load `/admin/*` (client guard) and every admin endpoint returns 403 for writer tokens (server guard).
- Writer bundle does not contain the admin chunk.
- Admin can see all series; writer sees own series only.

## Later
Writer payouts, content moderation tools, A/B tests on titles and covers.
