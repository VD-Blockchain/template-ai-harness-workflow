# waitlist — Architecture

## Overview & Key Components

Node 24 + Express (ESM) REST API backed by Postgres 16.

- `waitlist/src/server.js` — Express app, routes, JSON body parsing, boot sequence
  (init DB, then listen on `PORT` / default 8080).
- `waitlist/src/db.js` — `pg` connection Pool from `DATABASE_URL`; `init()` retries the
  connection (~10× / 2s) and runs an idempotent `CREATE TABLE IF NOT EXISTS`.
- `waitlist/src/validate.js` — pure `isValidEmail(s)` (trim + lowercase + single regex
  requiring `local@domain.tld`); unit-tested in `waitlist/test/validate.test.js`.
- `waitlist/Dockerfile` — `node:24-alpine`, `npm ci --omit=dev`, `CMD node src/server.js`.

## Contracts

### REST endpoints
| Method | Path | Purpose | Evidence |
|---|---|---|---|
| POST | /api/waitlist | Submit signup; 201 created / 200 already_registered / 400 invalid_email | waitlist/src/server.js |
| GET | /api/waitlist/count | Public total signup count `{count:int}` | waitlist/src/server.js |
| GET | /health | Container healthcheck `{ok:true}` (not proxied) | waitlist/src/server.js |

### Events / queues
None.

### DB schema (main tables)
| Table | Purpose | Evidence |
|---|---|---|
| waitlist (id SERIAL PK, email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT now()) | One row per unique signup email | waitlist/src/db.js |

## Invariants

- At most one row per normalized email (DB `UNIQUE` on `email`).
- Email is always normalized to trimmed lowercase before insert/compare.
- `count` returned by `/api/waitlist/count` equals `SELECT count(*)` of the table.

## Dependencies

- Calls: `db` (Postgres) — read/write the `waitlist` table via `DATABASE_URL`.
- Called by: `landing` (nginx reverse-proxies `/api/*` → `waitlist:8080`).

## Design Decisions & Rationale

- **`INSERT ... ON CONFLICT DO NOTHING RETURNING id`** for dedup — one atomic statement;
  `rowCount` distinguishes created (201) vs already_registered (200). Avoids a check-then-insert race.
- **Boot-time retry loop** — Postgres may still be starting; `depends_on: service_healthy`
  plus retries makes boot robust. (Origin: spec-2026-06-10-chainpay-landing-waitlist.md)
- **Email-only, server-validated** — lowest signup friction; never trust the client.

## Known Gotchas

- Healthcheck uses busybox `wget` (present in `node:24-alpine`); `curl` is not installed.
- `/health` is intentionally NOT under `/api`, so nginx does not proxy it — it is a
  container-internal check only.

## Related

- Parent: [root architecture](../architecture.md)
- SRS: [srs.md](srs.md)
- Peer: [landing architecture](../landing/architecture.md)
- Infra: [platform/infra/runbook.md](../platform/infra/runbook.md)
