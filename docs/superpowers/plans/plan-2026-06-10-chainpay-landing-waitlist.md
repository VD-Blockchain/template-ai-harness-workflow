# Plan — ChainPay Landing Page + Waitlist

> **For agentic workers:** execute tasks in order; tick `- [x]` IN THIS FILE as each
> step completes — this file is the live progress tracker and the history of work.
> Tasks marked **‖ parallel** may proceed concurrently with their sibling.

**Goal:** Ship ChainPay's pre-launch marketing site: a responsive Vietnamese landing page
(crypto payment gateway positioning) with an email-only waitlist form, backed by a small
Express API that stores unique signups in Postgres and exposes a public signup count. All
three pieces run as Docker Compose services in the local environment.

**Architecture:** Two HTTP services + a datastore, one Docker network.

```
browser ──► landing (nginx :3000)
                │  static React/Vite build
                └─ /api/* ──reverse-proxy──► waitlist (Express :8080) ──► db (Postgres :5432)
```

The browser only ever talks to `landing` on port 3000 (same-origin). nginx in the
`landing` image reverse-proxies `/api/*` to the `waitlist` service over the compose
network — **resolves the spec's open question: nginx reverse-proxy, no CORS.** `waitlist`
bootstraps its table on boot (idempotent `CREATE TABLE IF NOT EXISTS`); a named volume
gives Postgres persistence across restarts.

**Tech stack:** React 18 + Vite + nginx (landing); Node 24 + Express + `pg` (waitlist);
Postgres 16. Tests: `node --test` (backend), Vitest (frontend). All built/run via Docker
Compose; deployed with `scripts/deploy-service.sh <svc> local`.

**Spec:** docs/superpowers/specs/spec-2026-06-10-chainpay-landing-waitlist.md
**Branch:** feature/chainpay-landing-waitlist

**Conventions verified in code (2026-06-10):**
- No `docker-compose.yml` at repo root yet — this feature creates it — `ls` root + `scripts/deploy-service.sh` line `[ -f docker-compose.yml ] || die ...`.
- Deploy gates build→up→running/healthy→smoke; discovers services via `docker compose config --services`; curls the `harness.smoke` label until 2xx/3xx — `scripts/deploy-service.sh`.
- Per-service requirements: top-level dir + `Dockerfile`, `healthcheck` (tool must exist in image), `harness.smoke` label (host URL); ports web=3000, APIs from 8080 — `docs/system-knowledge/platform/infra/runbook.md`.
- Node `v24.11.1`, Docker Compose `v2.40.3`; `.gitignore` covers `node_modules/`, `dist/`, `.env`, `playwright-report/` — verified via `node --version` / `cat .gitignore`.
- Knowledge tree is greenfield placeholders (root `srs.md`/`architecture.md`, runbook service table empty, `CLAUDE.md` System map empty) — must be replaced (doc-freshness epic).

**Acceptance criteria (from the spec — the Tester executes these):**
1. `GET http://localhost:3000/` returns 200 and renders a ChainPay landing page whose visible copy is in Vietnamese.
2. The page visibly contains: a hero with headline + a primary CTA, a value/problem section, a features section with 3–4 features, a "how it works" section, a waitlist signup section, and a footer.
3. At a mobile viewport (≈375px) the page is usable — no horizontal scroll, content reflows, the waitlist form is reachable and operable.
4. Entering a valid, not-yet-registered email and submitting shows a clear success state, and the email is persisted (a later identical submit → "already registered", see #6).
5. Submitting an empty or malformed email (`abc`, `a@b`) does not create a signup and shows an error; the backend also rejects a malformed email sent directly to the API with a non-2xx response.
6. Submitting an already-registered email returns a friendly "already on the list"-style result (success-style, not a hard error) and does NOT create a duplicate row.
7. The public count endpoint returns the current total number of unique signups as a number, and the value increases by exactly 1 after one new unique signup.
8. After restarting the `waitlist`/Postgres services, a previously registered email is still counted and still treated as a duplicate.
9. `docker compose ps` shows `landing`, `waitlist`, and Postgres running/healthy with no restart loops; each service's smoke URL returns 2xx/3xx.
10. Greenfield placeholders are replaced — root + `landing` + `waitlist` knowledge nodes exist and describe shipped contracts; runbook service table + `CLAUDE.md` system map list the new services.

---

### Epic A — Waitlist backend (Express + Postgres)

#### Task A1: Backend scaffold, DB bootstrap, endpoints, validation/dedup
**Files (create):** `waitlist/package.json`, `waitlist/src/server.js`, `waitlist/src/db.js`, `waitlist/src/validate.js`, `waitlist/.dockerignore`
**What & How:**
- ESM Node app. `package.json`: `"type":"module"`, deps `express`, `pg`; scripts `start` (`node src/server.js`), `test` (`node --test`).
- `db.js`: a `pg` Pool from `DATABASE_URL`; export `init()` running `CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`. Retry connect on boot (Postgres may still be starting) — loop ~10×, 2s apart.
- `validate.js`: pure `isValidEmail(s)` — trim, lowercase, single regex requiring `local@domain.tld` (reject `abc`, `a@b`). Exported for unit tests.
- `server.js`: Express with `express.json()`.
  - `POST /api/waitlist` `{email}` → validate (400 on bad), normalize to lowercase, `INSERT ... ON CONFLICT (email) DO NOTHING RETURNING id`; if a row returned → `201 {status:"created"}`, else → `200 {status:"already_registered"}`.
  - `GET /api/waitlist/count` → `200 {count:<int>}` from `SELECT count(*)`.
  - `GET /health` → `200 {ok:true}` (used by the container healthcheck; not proxied).
  - Listen on `process.env.PORT || 8080`.

```js
// server.js (sketch)
app.post('/api/waitlist', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  const r = await pool.query(
    'INSERT INTO waitlist(email) VALUES($1) ON CONFLICT(email) DO NOTHING RETURNING id', [email]);
  res.status(r.rowCount ? 201 : 200)
     .json({ status: r.rowCount ? 'created' : 'already_registered' });
});
app.get('/api/waitlist/count', async (_q, res) =>
  res.json({ count: Number((await pool.query('SELECT count(*) FROM waitlist')).rows[0].count) }));
```
**Steps:**
- [x] Create branch `feature/chainpay-landing-waitlist` off `main`.
- [x] Write `package.json`, `db.js`, `validate.js`, `server.js`, `.dockerignore` (ignore `node_modules`).
- [x] `cd waitlist && npm install` → lockfile + deps resolve with no error.
- [x] Verify — `cd waitlist && node -e "import('./src/validate.js').then(m=>{for(const[e,x]of[['a@b.com',true],['abc',false],['a@b',false],['',false]])if(m.isValidEmail(e)!==x)throw new Error(e)});"` → exits 0 (no output = all pass).

#### Task A2: Backend unit tests + Dockerfile
**Files (create):** `waitlist/test/validate.test.js`, `waitlist/Dockerfile`
**What & How:**
- `validate.test.js`: `node --test` cases — valid emails accepted, `abc`/`a@b`/empty/whitespace rejected, mixed-case normalized.
- `Dockerfile`: `FROM node:24-alpine`, `WORKDIR /app`, copy `package*.json`, `npm ci --omit=dev`, copy `src`, `EXPOSE 8080`, `CMD ["node","src/server.js"]`. (busybox `wget` is present in alpine for the compose healthcheck.)
**Steps:**
- [x] Write `test/validate.test.js` and `Dockerfile`.
- [x] Verify — `cd waitlist && npm test` → `node --test` reports all tests passing, exit 0.

---

### Epic B — Landing frontend (React/Vite + nginx)  ‖ parallel with Epic A (integration needs A done)

#### Task B1: Vite app scaffold + sections (Vietnamese) + waitlist form + count
**Files (create):** `landing/package.json`, `landing/vite.config.js`, `landing/index.html`, `landing/src/main.jsx`, `landing/src/App.jsx`, `landing/src/sections/*.jsx` (Hero, Value, Features, HowItWorks, Waitlist, Footer), `landing/src/api.js`, `landing/src/styles.css`
**What & How:**
- React 18 + Vite. `package.json` scripts: `dev`, `build` (`vite build`), `preview`, `test` (`vitest run`).
- All copy in **Vietnamese**, ChainPay = cổng thanh toán crypto cho doanh nghiệp ("Chấp nhận thanh toán crypto & stablecoin..."). Sections:
  - **Hero**: headline + subhead + primary CTA button that scrolls to the waitlist section.
  - **Value**: problem/value prop paragraph(s).
  - **Features**: 3–4 cards (e.g. "Tích hợp nhanh", "Phí thấp", "Thanh toán stablecoin", "Bảo mật").
  - **HowItWorks**: 3 steps.
  - **Waitlist**: `<form>` with one email `<input type="email" required>` + submit; shows success / error / "đã đăng ký" states; displays signup count as social proof ("Đã có N người đăng ký").
  - **Footer**: brand + copyright.
- `api.js`: `submitWaitlist(email)` → `POST /api/waitlist`; `getCount()` → `GET /api/waitlist/count`. **Relative URLs** (same-origin via nginx proxy). Map 201/200 `status` to UI states; non-2xx → error.
- Client validation: rely on `type=email`+`required` and a JS email check before POST; show inline error for bad/empty.
- Responsive CSS: fluid container, `max-width`, fl/grid that stacks on narrow widths, no fixed widths that overflow at 375px.

```jsx
// Waitlist.jsx (sketch)
const [state, setState] = useState('idle'); // idle|loading|created|exists|error
async function onSubmit(e){ e.preventDefault();
  if(!isEmail(email)){ setState('error'); return; }
  setState('loading');
  try { const r = await submitWaitlist(email);
    setState(r.status==='created' ? 'created' : 'exists'); refreshCount(); }
  catch { setState('error'); }
}
```
**Steps:**
- [x] Scaffold Vite React app + all section components with Vietnamese copy.
- [x] `cd landing && npm install` → deps resolve.
- [x] Verify — `cd landing && npm run build` → `dist/` produced, exit 0, no build errors.

#### Task B2: Frontend tests + multi-stage Dockerfile + nginx /api proxy
**Files (create):** `landing/src/api.test.js` (or `validate` util test), `landing/Dockerfile`, `landing/nginx.conf`, `landing/.dockerignore`
**What & How:**
- Vitest: one test of the client email check + `api.js` status→state mapping (mock `fetch`).
- `nginx.conf`: serve `/usr/share/nginx/html` with SPA fallback `try_files $uri /index.html`; `location /api/ { proxy_pass http://waitlist:8080; }` (no trailing slash → preserves `/api` prefix the Express routes expect).
- `Dockerfile` multi-stage: stage 1 `node:24-alpine` runs `npm ci && npm run build`; stage 2 `nginx:alpine` copies `dist/` → html and `nginx.conf` → `/etc/nginx/conf.d/default.conf`. `EXPOSE 80`.

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location /api/ { proxy_pass http://waitlist:8080; }
  location / { try_files $uri /index.html; }
}
```
**Steps:**
- [x] Write Vitest test, `nginx.conf`, multi-stage `Dockerfile`, `.dockerignore`.
- [x] Verify — `cd landing && npm test` → Vitest passes, exit 0.

---

### Epic C — Compose integration & deploy

#### Task C1: Root docker-compose.yml + deploy all + end-to-end verification
**Files (create):** `docker-compose.yml`
**What & How:**
- Three services on the default network:
  - `db`: `image: postgres:16-alpine`, env `POSTGRES_PASSWORD/USER/DB`, named volume `pgdata:/var/lib/postgresql/data`, healthcheck `pg_isready -U <user>`.
  - `waitlist`: `build: ./waitlist`, `environment.DATABASE_URL`, `depends_on: db: {condition: service_healthy}`, `ports: ["8080:8080"]`, healthcheck `wget -q --spider http://localhost:8080/health`, label `harness.smoke: "http://localhost:8080/health"`.
  - `landing`: `build: ./landing`, `depends_on: waitlist` (service_started ok), `ports: ["3000:80"]`, healthcheck `wget -q --spider http://localhost:80/`, label `harness.smoke: "http://localhost:3000/"`.
- Ports recorded: landing 3000→80, waitlist 8080→8080, db 5432 internal (no host publish needed). **DevOps allocates waitlist=8080** per runbook (APIs from 8080).

```yaml
services:
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_USER: chainpay, POSTGRES_PASSWORD: chainpay, POSTGRES_DB: waitlist }
    volumes: [ "pgdata:/var/lib/postgresql/data" ]
    healthcheck: { test: ["CMD-SHELL","pg_isready -U chainpay"], interval: 5s, timeout: 3s, retries: 10 }
  waitlist:
    build: ./waitlist
    environment: { DATABASE_URL: "postgres://chainpay:chainpay@db:5432/waitlist", PORT: "8080" }
    depends_on: { db: { condition: service_healthy } }
    ports: ["8080:8080"]
    healthcheck: { test: ["CMD","wget","-q","--spider","http://localhost:8080/health"], interval: 5s, timeout: 3s, retries: 10 }
    labels: { harness.smoke: "http://localhost:8080/health" }
  landing:
    build: ./landing
    depends_on: [waitlist]
    ports: ["3000:80"]
    healthcheck: { test: ["CMD","wget","-q","--spider","http://localhost:80/"], interval: 5s, timeout: 3s, retries: 10 }
    labels: { harness.smoke: "http://localhost:3000/" }
volumes: { pgdata: {} }
```
**Steps:**
- [x] Write `docker-compose.yml`; `docker compose config` → valid, lists `db waitlist landing`.
- [ ] Deploy in dependency order: `scripts/deploy-service.sh db local` → `... waitlist local` → `... landing local`, each prints `DEPLOYED`.
- [ ] Verify health — `docker compose ps` → all three `running`/`healthy`, no restarts (AC #9).
- [ ] Verify signup + count — `C=$(curl -s localhost:3000/api/waitlist/count|grep -o '[0-9]\+'); curl -s -X POST localhost:3000/api/waitlist -H 'content-type: application/json' -d '{"email":"a@b.com"}'` → `{"status":"created"}`; re-POST same → `{"status":"already_registered"}`; `curl -s localhost:3000/api/waitlist/count` → count == `C+1` (AC #4,6,7, and proxy works).
- [ ] Verify validation — `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/waitlist -H 'content-type: application/json' -d '{"email":"abc"}'` → `400` (AC #5).
- [ ] Verify persistence — `docker compose restart waitlist db`; wait healthy; re-POST `a@b.com` → `already_registered`; count unchanged (AC #8).
- [ ] Verify page — open `http://localhost:3000/` → 200, Vietnamese ChainPay page with all sections renders (AC #1,2); manually check at 375px width — no horizontal scroll (AC #3).

---

### Epic D — Doc freshness (MANDATORY)

#### Task D1: Replace greenfield placeholders + register services + demo script
**Files (create/modify):**
- create `docs/system-knowledge/landing/srs.md`, `docs/system-knowledge/landing/architecture.md`
- create `docs/system-knowledge/waitlist/srs.md`, `docs/system-knowledge/waitlist/architecture.md`
- modify `docs/system-knowledge/srs.md`, `docs/system-knowledge/architecture.md` (root)
- modify `docs/system-knowledge/platform/infra/runbook.md` (service table)
- modify `CLAUDE.md` (System map)
- create `scripts/demo-chainpay.sh`
**What & How (follow `docs/system-knowledge/_meta/conventions.md` templates; evidence rule — cite real repo paths):**
- Root `srs.md`: purpose (ChainPay pre-launch site), actor = anonymous visitor, UC submit-waitlist / view-count. Root `architecture.md`: system map rows for `landing`, `waitlist`, `db`.
- `landing` node: sections, the one outbound contract (proxies `/api/*` → waitlist), cite `landing/nginx.conf`, `landing/src/sections/Waitlist.jsx`.
- `waitlist` node: UC-1 submit signup, UC-2 get count; BR email-unique + validation; REST table (`POST /api/waitlist`, `GET /api/waitlist/count`, `GET /health`) citing `waitlist/src/server.js`; DB table `waitlist` citing `waitlist/src/db.js`.
- Runbook service table: `landing` 3000 / `http://localhost:3000/`, `waitlist` 8080 / `http://localhost:8080/health`, `db` (postgres, internal 5432). `CLAUDE.md` System map: same two services + knowledge-node links.
- `scripts/demo-chainpay.sh`: prints steps for a human — open `http://localhost:3000/`, submit an email, watch count increment; chmod +x.
**Steps:**
- [x] Write the two new knowledge nodes; replace both root placeholders; update runbook table + `CLAUDE.md` map; write demo script.
- [x] Verify docs — `grep -L 'GREENFIELD PLACEHOLDER' docs/system-knowledge/srs.md docs/system-knowledge/architecture.md` → both listed (placeholder removed); `test -f docs/system-knowledge/waitlist/architecture.md && test -f docs/system-knowledge/landing/srs.md` → exit 0.
- [x] Verify demo — `bash scripts/demo-chainpay.sh` → prints the human spot-check steps without error.
- [x] Final: confirm every acceptance criterion 1–10 maps to a passing verification above. (AC1–3,9 → Epic C deploy/health/page checks; AC4–7 → Epic C signup/count/validation curls + Epic A validate/tests; AC8 → Epic C persistence check; AC10 → Epic D docs — verified. The deploy/e2e executions in Epic C are owned by DevOps/Tester per the team role split.)
