# 10. Mobile App: Sign-in, Browse and Series Page

**Component:** Expo React Native app · **Scope:** MVP

## Goal
Let listeners sign in, discover stories by mood and theme, and open a series.

## Functional requirements
1. **Sign-in / sign-up:** email and social login (spec 01). Session persists securely on device. Account deletion available in settings.
2. **Home:** vertical list of shelves (mood and theme based, set by admin). Each shelf scrolls horizontally with cover, title and "AI-assisted" label. "Continue listening" shelf first when the user has progress.
3. **Series page:**
   - Cover, title, premise, tags/themes, language, play count
   - "AI-assisted" label, always visible
   - Episode list with number, title, duration, free/paid marker, progress indicator, download state
   - Play/continue button (resumes the last episode and position)
4. **Basic search** by title. **[OPEN]** scope for MVP.
5. **Library:** in-progress and downloaded series.
6. **States:** loading skeletons, empty states, offline banner, error with retry.
7. **UI stack:** React Native Reusables + NativeWind, TanStack Query for data, Zustand for local state; API client generated from OpenAPI.
8. Free first episodes are playable without restriction; paid markers are informational until billing exists.

## Acceptance criteria
- Only published series and episodes are shown.
- Home loads from cache when offline and shows a clear offline notice.
- The AI-assisted label is visible on every series card and series page.
- Resume button starts at the stored position (spec 11).

## Later
Personalized recommendations, ratings and comments, push notifications for new episodes, billing UI.
