# Plan 01: Identity, Auth and Roles

Spec: [01-identity-auth-roles.md](../01-identity-auth-roles.md) · Order: 2 · Depends on: plan 15

## Goal
Listener sign-up, admin-only writer invites, token auth, role checks and the audit trail for auth events.

## Design
- **Tables:** `users(id, email unique, password_hash null, provider, provider_id null, role [listener|writer|admin], status [active|deactivated], display_name)`, `writer_invites(id, email, token_hash, invited_by, expires_at, accepted_at, revoked_at)`, `refresh_tokens(id, user_id, token_hash, expires_at, revoked_at)`.
- **Tokens:** access token = JWT (HS256, 15 min, `sub`, `role`); refresh token = random 32 bytes, stored as SHA-256 hash, 30 days, rotated on every refresh. Logout revokes it.
- **Passwords:** argon2id.
- **Dependencies (public API of `identity`):** `get_current_user` (decodes JWT, loads user, rejects deactivated), `require_roles(*roles)`, `CurrentUser` schema. Deactivation is effective immediately because status is checked per request.
- **Invites:** token = random 32 bytes (URL-safe), stored hashed, 7-day expiry, single use; link `{STUDIO_URL}/accept-invite?token=...` sent through `EmailPort`.
- **Social login:** `SocialAuthPort.verify(provider, id_token) → (provider_id, email)`; endpoint `POST /auth/social`; fake adapter for tests. Real providers wait for the owner ([OPEN]).
- **Account deletion:** `DELETE /me` for listeners; emits `user_deleted` event so `listening` (plan 12) anonymises events without identity importing it.
- **CLI:** `python -m app.cli create-admin --email --password`.

## API
| Method | Path | Role |
| ------ | ---- | ---- |
| POST | `/auth/signup` | public (listener only) |
| POST | `/auth/login`, `/auth/refresh`, `/auth/logout` | public |
| POST | `/auth/social` | public |
| POST | `/auth/accept-invite` | public (valid token) |
| GET | `/me` | any |
| DELETE | `/me` | listener |
| POST/GET | `/admin/invites` | admin |
| DELETE | `/admin/invites/{id}` | admin |
| POST | `/admin/invites/{id}/resend` | admin |
| GET | `/admin/writers` | admin |
| POST | `/admin/writers/{id}/deactivate`, `/reactivate` | admin |

## Tasks (one commit each)
1. Models and migration (`users`, `writer_invites`, `refresh_tokens`).
2. Password hashing and token helpers.
3. Signup, login, refresh, logout endpoints with rate limits.
4. `get_current_user`, `require_roles`, `GET /me`; public exports from `app.modules.identity`.
5. Writer invites: create, list, revoke, resend, accept; email via `EmailPort`; audit entries.
6. Writer deactivate/reactivate with refresh-token revocation; `GET /admin/writers`; audit entries.
7. Social login port, fake adapter, endpoint.
8. Account deletion with `user_deleted` event; `create-admin` CLI.
9. Studio: login page, auth store (tokens, refresh on 401), accept-invite page, role-based landing; Vitest tests.
10. Regenerate API client.

## Tests
- Signup/login/refresh rotation/logout; reuse of a revoked refresh token fails.
- Signup cannot create writer or admin (role field ignored/rejected).
- Writer → any `/admin/*` is 403; listener → `/studio/*` is 403 (route stub added for the test).
- Invite: accept works once; expired, used and revoked tokens rejected; resend issues a new token and invalidates the old one.
- Deactivated writer: existing access token → 401; refresh fails; reactivate restores login.
- Audit rows exist for invite create/revoke/resend/accept, deactivate, reactivate.
- Rate limit: N+1th login within window → 429.
- `DELETE /me` removes the user and fires `user_deleted`.

## Spec coverage review

| Spec item | Covered by | Status |
| --------- | ---------- | ------ |
| FR1 listener sign-up/sign-in, email + social | Tasks 3, 7 (social providers [OPEN], port ready) | ✅ / ⚠️ providers open |
| FR1 email verification optional, default not required | Not built (default) | ✅ by default |
| FR2 short-lived access + refresh, logout revokes | Tasks 2, 3 | ✅ |
| FR3 invites: hashed one-time token, expiry 7 d, email, set password, resend, revoke | Task 5 | ✅ |
| FR4 deactivate: revoke sessions, series stay | Task 6 (series untouched; reassignment is a catalog admin edit in plan 09) | ✅ |
| FR5 RBAC on every route, writer scoping | Task 4 (scoping helper used by catalog/writing plans) | ✅ |
| FR6 no public writer sign-up | Task 3 test | ✅ |
| FR7 admin seeding CLI | Task 8 | ✅ |
| FR8 account deletion | Task 8 + plan 12 hook | ✅ |
| FR9 audit log for writes and auth-sensitive events | Tasks 5, 6 | ✅ |
| AC writer → admin 403; other writer's series 404 | Task 4 (403); 404 scoping tested in plan 02/03 | ✅ (split) |
| AC expired/used/revoked invite rejected | Task 5 tests | ✅ |
| AC deactivated writer tokens stop working | Task 6 tests | ✅ |
| AC rate limits on login, sign-up, accept-invite | Task 3, 5 | ✅ |
| AC audit entry per write | Tasks 5, 6 | ✅ |

Review result: complete. Gap found and fixed during review: the first draft had no `refresh_tokens` table, so logout and deactivation could not revoke sessions; added.
