# landing — Architecture

## Overview & Key Components

React 18 + Vite SPA built to static assets and served by nginx (`nginx:alpine`).

- `landing/index.html`, `landing/src/main.jsx`, `landing/src/App.jsx` — app shell.
- `landing/src/sections/*.jsx` — Hero, Value, Features, HowItWorks, Waitlist, Footer
  (Vietnamese copy). `Waitlist.jsx` holds the form + idle/loading/created/exists/error
  states + live signup count.
- `landing/src/api.js` — same-origin fetch client: `submitWaitlist`, `getCount`, client
  `isEmail`, `statusToState`. Relative URLs only. Tested in `landing/src/api.test.js`.
- `landing/src/styles.css` — responsive CSS (fluid container, grids that stack ≤480px).
- `landing/nginx.conf` — static serving + SPA fallback + `/api/` reverse-proxy.
- `landing/Dockerfile` — multi-stage: `node:24-alpine` build → `nginx:alpine` serve.

## Contracts

### REST endpoints
This service exposes only static content + a proxy; it defines no REST API of its own.

| Method | Path | Purpose | Evidence |
|---|---|---|---|
| GET | / (and SPA routes) | Serve the static landing page | landing/nginx.conf |
| (proxy) | /api/* → waitlist:8080 | Reverse-proxy to the waitlist API (no CORS) | landing/nginx.conf |

### Events / queues
None.

### DB schema
None (no datastore).

## Invariants

- The browser is same-origin with the API: every API call is a relative `/api/*` URL
  (`landing/src/api.js`) proxied by nginx — no cross-origin requests.
- `location /api/` uses `proxy_pass http://waitlist:8080;` with **no trailing slash**, so
  the `/api` prefix is preserved to match the Express routes.

## Dependencies

- Calls: `waitlist` (via nginx `/api/*` proxy) — submit signup, read count.
- Called by: anonymous visitors' browsers on host port 3000 (mapped to container :80).

## Design Decisions & Rationale

- **nginx reverse-proxy instead of CORS** — same-origin, no preflight, cleaner smoke check.
  Resolves the spec's open question. (Origin: spec-2026-06-10-chainpay-landing-waitlist.md)
- **Static build + nginx** (not a Node SSR server) — marketing page is fully static;
  cheapest, fastest, simplest to serve.

## Known Gotchas

- Healthcheck uses busybox `wget` (present in `nginx:alpine`); `curl` is not installed.
- If the `/api/` proxy gains a trailing slash on `proxy_pass`, the `/api` prefix is
  stripped and the Express routes 404 — keep it slashless.

## Related

- Parent: [root architecture](../architecture.md)
- SRS: [srs.md](srs.md)
- Peer: [waitlist architecture](../waitlist/architecture.md)
- Infra: [platform/infra/runbook.md](../platform/infra/runbook.md)
