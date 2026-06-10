# waitlist — SRS

## Purpose

The `waitlist` service captures and counts pre-launch demand for ChainPay. It accepts
email-only signups from the landing page, stores them uniquely in Postgres, and exposes
the aggregate signup count for social proof. It sends no email and exposes no per-signup
data — only the total count is public.

## Actors & Consumers

- **`landing`** (frontend, via nginx reverse-proxy) — the only caller. Submits signups and
  reads the count over same-origin `/api/*` requests.
- **Anonymous visitor** — the human behind the browser; never talks to this service directly.

## Use Cases

### UC-1: Submit a waitlist signup
- **Trigger:** `POST /api/waitlist` with `{ "email": "<addr>" }`.
- **Main flow:** trim + lowercase the email → validate syntactically → insert into the
  `waitlist` table with `ON CONFLICT (email) DO NOTHING`.
- **Outcome:** new email → `201 { status: "created" }`; already-present email →
  `200 { status: "already_registered" }` (friendly, success-style, no duplicate row).
- **Error outcomes:** invalid/empty/malformed email → `400 { error: "invalid_email" }`
  (no row created); DB failure → `500 { error: "internal_error" }`.

### UC-2: Get the public signup count
- **Trigger:** `GET /api/waitlist/count`.
- **Main flow:** `SELECT count(*)` over `waitlist`.
- **Outcome:** `200 { count: <int> }`. Increases by exactly 1 per new unique signup.

## Business Rules

- **BR-1 (email uniqueness):** at most one row per normalized (lowercased, trimmed) email —
  enforced by a `UNIQUE` constraint, not application-level checks.
- **BR-2 (server-side validation):** every email is validated server-side regardless of
  client checks; `abc`, `a@b`, empty, and whitespace are rejected with a non-2xx response.
- **BR-3 (friendly dedup):** a repeat signup is a success-style result, not an error.
- **BR-4 (persistence):** signups survive service/DB restarts (named Postgres volume).

## States & Transitions

A signup email is either absent or present; once present it stays present (no delete path
in scope). Repeat submits are idempotent.

## Out of Scope

- No email confirmation / double opt-in / SMTP.
- No admin UI, auth, or per-signup read/export (only the aggregate count is public).
- No unsubscribe / delete flow.

## Related

- Parent: [root SRS](../srs.md)
- Architecture: [architecture.md](architecture.md)
- Peer: [landing SRS](../landing/srs.md)
