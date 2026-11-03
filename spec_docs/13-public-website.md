# 13. Public Website

**Component:** Next.js · **Scope:** MVP (built after the pilot)

## Goal
Make series discoverable by search engines and let visitors sample a story and move to the app.

## Functional requirements
1. **Public series pages** (server-rendered): title, premise, cover, tags, language, play count, "AI-assisted" label, episode list.
2. **SEO:** semantic markup, metadata, Open Graph/Twitter cards, structured data, sitemap, robots.
3. **Web sample:** a short audio sample playable without sign-in; plays inline; clear call to action to open or install the app (deep link / store links).
4. **Language switch** if multiple languages launch.
5. Landing page and shelf pages for key themes.
6. Only published series appear; unpublishing removes pages (410/404) and updates the sitemap.
7. Stack: Next.js, TanStack Query, Zustand, shadcn/ui, shared generated API client.

## Acceptance criteria
- Series pages render complete content without client JavaScript.
- Sample plays without sign-in and without exposing full-episode URLs.
- Unpublished series return 404 within the cache window.

## Later
Full web player, account management.

## Open items
- Sample source: first N minutes of episode 1 vs. dedicated trailer.
