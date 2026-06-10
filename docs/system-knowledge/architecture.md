# ChainPay — Architecture (root)

## System map

| Node | Purpose | Docs |
|---|---|---|
| landing | Vietnamese marketing SPA (React/Vite + nginx); serves the page and reverse-proxies `/api/*` | [landing](landing/architecture.md) |
| waitlist | Express + Postgres signup API (validate, dedup, count) | [waitlist](waitlist/architecture.md) |
| db | Postgres 16 datastore for the `waitlist` table (internal only) | [waitlist](waitlist/architecture.md) |
| platform/infra | local environment, deploy script, ops runbook | [runbook](platform/infra/runbook.md) |

## Overview & Key Components

Two HTTP services + a datastore on one Docker Compose network:

```
browser ──► landing (nginx :3000)
                │  static React/Vite build
                └─ /api/* ──reverse-proxy──► waitlist (Express :8080) ──► db (Postgres :5432)
```

The browser only ever talks to `landing` on port 3000 (same-origin). nginx proxies
`/api/*` to `waitlist` over the compose network. `waitlist` bootstraps its table on boot;
a named `pgdata` volume persists Postgres across restarts. Real files: `docker-compose.yml`
(root), `landing/`, `waitlist/`.

## Invariants

- The only browser-reachable host port for app traffic is `landing` :3000; `waitlist`
  :8080 is for the API (proxied) + smoke; `db` :5432 is internal (not host-published).
- Waitlist signups survive restarts (named volume) and are unique per normalized email.

## Design Decisions & Rationale

- Delivery process = 3-step harness (`/brainstorm` → `/write-plan` → `/team-code-feature`).
- nginx reverse-proxy (not CORS) for `landing → waitlist` — same-origin, no preflight.
  (Origin: docs/superpowers/specs/spec-2026-06-10-chainpay-landing-waitlist.md)
- Node/Express + Postgres backend, React/Vite + nginx frontend — chosen with the user in
  the spec's decision rounds.

## Related

- SRS: [srs.md](srs.md)
- Conventions: [_meta/conventions.md](_meta/conventions.md)
- Drift audit: [AUDIT.md](AUDIT.md)
