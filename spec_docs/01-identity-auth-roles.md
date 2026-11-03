# 01. Identity, Auth and Roles

**Module:** `identity` · **Scope:** MVP

## Goal
Let listeners sign up publicly, let admins invite writers, and enforce role-based access everywhere.

## Roles
| Role | Created by | Access |
| ---- | ---------- | ------ |
| Listener | Public sign-up (email or social login) | Browse, listen, download, progress |
| Writer | Admin invite only | Own series: create, plan, draft, edit, voice, submit |
| Admin | Seeded or created by another admin | All writer abilities on all series, plus review, writer management, catalog, analytics, costs |

## Functional requirements
1. **Listener sign-up and sign-in:** email + password and social login (provider list **[OPEN]**). Email verification before first listen is optional; default: not required.
2. **Token auth:** short-lived access token and refresh token. Logout revokes the refresh token.
3. **Writer invites:**
   - Admin enters an email; backend creates a one-time token (stored hashed) with expiry (default 7 days) and emails it via `EmailPort`.
   - Invitee opens the link, sets a password, and becomes a writer. Token is single-use.
   - Admin can resend or revoke a pending invite.
4. **Deactivate writer:** admin sets status to deactivated; sessions are revoked; the writer's series stay and are reassignable.
5. **RBAC dependencies:** every route declares the minimum role. Writers are scoped to `owner_writer_id`; admins are unscoped.
6. **No public writer sign-up:** no endpoint creates a writer without a valid invite token.
7. **Admin seeding:** CLI command creates the first admin.
8. **Account deletion:** a listener can delete their account; personal data and listening events are removed or anonymised.
9. **Audit log:** every write by writers and admins, and all auth-sensitive events (invite, deactivate, role change), are recorded.

## Data
`users(id, email, password_hash | provider_id, role, status)`, `writer_invites(id, email, token_hash, invited_by, expires_at, accepted_at)`, `audit_log(id, actor_id, action, entity_type, entity_id, metadata, created_at)`.

## API (sketch)
- `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `POST /admin/invites`, `GET /admin/invites`, `DELETE /admin/invites/{id}`, `POST /admin/invites/{id}/resend`
- `POST /auth/accept-invite`
- `POST /admin/writers/{id}/deactivate`, `POST /admin/writers/{id}/reactivate`
- `DELETE /me`

## Acceptance criteria
- A writer token cannot call any admin endpoint (403) and cannot read another writer's series (404).
- An expired, used or revoked invite token is rejected.
- A deactivated writer's existing tokens stop working.
- Rate limits apply to login, sign-up and accept-invite.
- Audit log entry exists for each write action.

## Open items
- Social login providers. Whether email verification is required.
