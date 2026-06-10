# Spec — ChainPay Landing Page + Waitlist

**Date:** 2026-06-10
**Status:** Approved — ready for /write-plan
**Predecessors:** none (first feature shipped through the harness; greenfield)

## Problem

ChainPay is a new **crypto payment gateway** ("Stripe for crypto" — lets merchants accept
crypto & stablecoin payments online). Before launch we need a public **landing page** that
(1) introduces the product and its value, and (2) captures pre-launch demand by letting
visitors **register for a waitlist** with their email.

This is the first feature in a greenfield repo — the knowledge tree
(`docs/system-knowledge/`) is still all placeholders, so this spec also establishes the
first real services, stack conventions, and infra rows for the project.

## Decisions (with user)

Round 1 — foundations:
1. **Q:** Where are waitlist signups stored (one service vs two)?
   **A:** Backend API + database — fully self-contained in Docker Compose, real persistence.
2. **Q:** Frontend stack?
   **A:** React + Vite, built to static files, served by **nginx** on port 3000.
3. **Q:** Page content language?
   **A:** **Vietnamese** (tiếng Việt) for all user-facing copy.
4. **Q:** Product positioning (drives copy)?
   **A:** **Crypto payment gateway** — merchants/businesses accept crypto & stablecoin
   payments online.

Round 2 — backend & scope:
5. **Q:** Backend stack + database?
   **A:** **Node/Express + Postgres**, both as Docker Compose services.
6. **Q:** Waitlist form fields?
   **A:** **Email only** — lowest friction, highest conversion.
7. **Q:** Duplicate handling + viewing signups?
   **A:** **Dedup + public count endpoint.** Duplicate email → friendly "already on the
   list" response; a public endpoint returns the total signup count (usable as social
   proof). No admin UI.
8. **Q:** Page sections?
   **A:** **Standard set** — Hero + CTA, problem/value prop, key features (3–4),
   how-it-works, waitlist form, footer; responsive/mobile-friendly.

## Chosen approach

A **two-service** system, both registered in the root `docker-compose.yml`:

- **`landing`** — React + Vite single-page landing site, built to static assets and served
  by **nginx** on host port **3000**. Holds all marketing copy (Vietnamese) and the
  waitlist signup form. Calls the waitlist API to submit emails and to read the signup
  count for social proof.
- **`waitlist`** — Node/Express REST API that validates and stores signups in **Postgres**,
  enforcing email uniqueness (dedup), and exposes the total count.
- **Postgres** — datastore service for the waitlist table.

This is the only reasonable approach given the decisions above (all major forks were chosen
by the user in Phases B). Multi-option comparison was therefore skipped per the harness
rules. The single non-trivial design choice that remains — whether the browser calls the
API directly (CORS) or nginx reverse-proxies `/api` to the `waitlist` service — is a HOW
detail deferred to the plan (see Open questions).

## Scope

### In
- A responsive ChainPay landing page in **Vietnamese**, served at `http://localhost:3000/`,
  with the standard section set: Hero + primary CTA, problem/value proposition, 3–4 key
  features, a "how it works" section, the waitlist signup section, and a footer.
- A waitlist **signup form** collecting **email only**, with client-side validation
  (well-formed email, required) and clear success / error / "already registered" states.
- A **`waitlist` backend API** that:
  - accepts a signup (email), validates it server-side, stores it in Postgres;
  - enforces **uniqueness** — a repeat email is treated as success-style "already on the
    list", not an error;
  - exposes a **public total signup count** the landing page can display as social proof.
- **Postgres** persistence with a waitlist table (at minimum: id, email unique, created_at).
- Both services in `docker-compose.yml` with healthchecks + `harness.smoke` labels, deployed
  via `scripts/deploy-service.sh ... local`.
- Doc-freshness: replace the greenfield placeholders — root `srs.md`/`architecture.md`,
  new `docs/system-knowledge/landing/` and `docs/system-knowledge/waitlist/` nodes, the
  System map in `CLAUDE.md`, and the runbook service table.

### Out (explicit non-goals)
- No real merchant onboarding, payments, wallets, or any actual ChainPay product
  functionality — this is a pre-launch marketing page only.
- No email confirmation / double opt-in / sending any email (no SMTP).
- No admin UI or authenticated endpoints to browse/export signups (only the aggregate
  count is public).
- No analytics / tracking pixels / cookie banner.
- No bilingual toggle — Vietnamese only.
- No CMS or editable content — copy is hard-coded in the frontend.
- No production/staging environment — local Docker Compose only.

## Affected knowledge-tree nodes

- **New node:** `docs/system-knowledge/landing/` (`srs.md` + `architecture.md`) — the
  marketing frontend: purpose, sections, the one outbound contract (calls waitlist API).
- **New node:** `docs/system-knowledge/waitlist/` (`srs.md` + `architecture.md`) — the
  signup API: use cases (submit signup, get count), business rules (email uniqueness,
  validation), REST contract, and the Postgres `waitlist` table schema.
- **Update:** `docs/system-knowledge/srs.md` + `architecture.md` (root) — replace
  greenfield placeholders: system purpose, actors (anonymous visitor), the two-service map.
- **Update:** `docs/system-knowledge/platform/infra/runbook.md` — add `landing` and
  `waitlist` (+ Postgres) to the service table with ports and smoke URLs.
- **Update:** `CLAUDE.md` — System map rows for the two new services.

## Acceptance criteria

Tester in Step 3 executes these literally against the locally deployed environment.

1. **Page loads:** `GET http://localhost:3000/` returns 200 and renders a ChainPay landing
   page whose visible copy is in **Vietnamese**.
2. **Standard sections present:** the page visibly contains a hero with headline + a primary
   call-to-action, a value/problem section, a features section with **3–4** features, a
   "how it works" section, a waitlist signup section, and a footer.
3. **Responsive:** at a mobile viewport (≈375px wide) the page is usable — no horizontal
   scroll, content reflows, the waitlist form is reachable and operable.
4. **Successful signup:** entering a valid, not-yet-registered email in the waitlist form
   and submitting shows a clear success state on the page, and the email is persisted (a
   subsequent identical submit is treated as "already registered" — criterion 6).
5. **Client + server validation:** submitting an empty or malformed email (e.g. `abc`,
   `a@b`) does not create a signup and shows an error; the backend also rejects a malformed
   email sent directly to the API with a non-2xx response.
6. **Dedup:** submitting an email that is already registered returns a friendly
   "already on the list"-style result (success-style, not a hard error) and does **not**
   create a duplicate row.
7. **Public count:** the public count endpoint returns the current total number of unique
   signups as a number, and the value increases by exactly 1 after one new unique signup.
8. **Persistence across restart:** after restarting the `waitlist`/Postgres services, a
   previously registered email is still counted and still treated as a duplicate.
9. **System health:** `docker compose ps` shows `landing`, `waitlist`, and Postgres
   running/healthy with no restart loops; each service's smoke URL returns 2xx/3xx.
10. **Docs freshness:** greenfield placeholders are replaced — root + `landing` + `waitlist`
    knowledge nodes exist and describe the shipped contracts, and the runbook service table
    + `CLAUDE.md` system map list the new services.

## Open questions

- **Frontend → API path** (owner: planner, Step 2): browser calls the `waitlist` API
  directly with CORS, vs nginx in the `landing` image reverse-proxies `/api/*` to the
  `waitlist` service. Recommend the **nginx reverse-proxy** approach (same-origin, no CORS,
  cleaner smoke). Decide in the plan.
- **Port allocation** (owner: planner): `landing` = 3000 per runbook; assign `waitlist` an
  API port from 8080 upward and record it in the runbook table.
- **Social-proof display** (owner: developer): exact placement/copy of the signup-count on
  the page is a content detail for implementation; the count endpoint is the contract.
