# Plan 13: Public Website

Spec: [13-public-website.md](../13-public-website.md) · Order: 15 · Depends on: plans 02, 07, 08

## Goal
Server-rendered, search-indexable series pages with a short sample that plays without sign-in and hands off to the app.

## Design
- `apps/web`: Next.js (App Router, current stable [CHECK]), TypeScript, Tailwind + shadcn-style components, generated API client (server-side fetch), TanStack Query only for client islands (sample player), Zustand not needed initially (spec lists it; added only if state appears).
- **Backend `public` endpoints (no auth, cached, rate limited):** `GET /public/series` (published, paginated), `GET /public/series/{id}` (incl. `is_ai_assisted`, episode list titles/durations, play count, cover URL), `GET /public/shelves`, `GET /public/series/{id}/sample` → `{url, duration_seconds}`.
- **Samples:** when an episode 1 is published, a job cuts the first 90 seconds (configurable) from its audio asset with a 2-second fade-out and stores it as a `sample` asset ([OPEN] default: first N seconds of episode 1, not a trailer). Sample URLs are signed and short-lived; full-episode URLs are never exposed publicly.
- **Pages:** `/` (landing with key shelves), `/series/[id]/[slug]` (SSR/ISR, revalidate 5 min), `/shelves/[id]`, `sitemap.xml`, `robots.txt`, 404/410 for unpublished.
- **SEO:** metadata API, Open Graph/Twitter cards with cover, JSON-LD (`PodcastSeries`/`CreativeWorkSeries`), canonical URLs.
- **App hand-off:** "Listen in the app" button with deep link (`bibi://series/{id}`) and store links (from config).
- **Language switch:** hidden until more than one language exists (spec: only if multiple languages launch).

## Tasks (one commit each)
1. Backend public endpoints with caching headers and rate limits.
2. Sample clip job on first publish of episode 1; sample endpoint.
3. Next.js app scaffold, layout, UI components, API client wiring.
4. Series page with SSR, metadata, JSON-LD, sample player island, app hand-off.
5. Landing and shelf pages.
6. Sitemap, robots, 404 for unpublished.
7. Tests: backend endpoints; Vitest for components; rendered-HTML test that series page content is present without client JS.

## Tests
- Public endpoints return only published series; unpublished id → 404.
- Sample endpoint returns a signed URL to the sample asset, never the full episode; sample duration ≤ configured length.
- Series page server HTML contains title, premise, AI-assisted label and episode list.
- Sitemap lists only published series.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| FR1 public series pages (SSR) with required fields | Tasks 1, 4 | ✅ |
| FR2 SEO: metadata, OG/Twitter, structured data, sitemap, robots | Tasks 4, 6 | ✅ |
| FR3 sample without sign-in, app CTA | Tasks 2, 4 | ✅ |
| FR4 language switch if multiple languages | Hidden until >1 language | ✅ (conditional) |
| FR5 landing and shelf pages | Task 5 | ✅ |
| FR6 only published; unpublish → 404 and sitemap update | Tasks 1, 6 | ✅ |
| FR7 stack: Next.js, TanStack Query, Zustand, shadcn, shared client | Task 3 (Zustand added only when needed) | ✅ / noted |
| AC content without client JS | Task 7 test | ✅ |
| AC sample without exposing full URLs | Task 2 test | ✅ |
| AC unpublished 404 within cache window | Tasks 4, 6 (revalidate 5 min) | ✅ |
| Open: sample source | Default first N seconds of ep. 1 | ⚠️ confirm |

Review result: complete. Gap fixed during review: listener endpoints require sign-in, so the website needs its own unauthenticated read endpoints; added `/public/*`.
