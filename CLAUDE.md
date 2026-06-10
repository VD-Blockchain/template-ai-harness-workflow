# <Project Name> — AI Delivery Harness Template

> TEMPLATE NOTE: when you adopt this template for a real project, replace this header
> with a 3-5 line description of the system (stack, runtime, infra). Keep everything else.

This repo runs on a **3-step agentic delivery harness**. Every feature / bug /
enhancement flows through:

```
/brainstorm "<requirement>"          → docs/superpowers/specs/spec-<date>-<slug>.md   (Step 1)
/write-plan <spec path>              → docs/superpowers/plans/plan-<date>-<slug>.md   (Step 2)
/team-code-feature <plan path>       → Developer → DevOps → Tester loop until clean   (Step 3)
```

Do NOT skip steps for non-trivial work. A task with no approved spec goes to Step 1.
A spec with no plan goes to Step 2. Code without the team loop is unverified.

## Source of truth

- `docs/system-knowledge/` — the **knowledge tree**: contracts & intent (use cases,
  REST/DB/event contracts, invariants, design decisions + rationale). Cumulative.
- Code — truth for implementation detail.
- `docs/superpowers/specs/` and `plans/` — episodic **history of work** per task.
- Precedence on contradiction: **code > specs > old plans** — and fix the doc in the same PR.

**For ANY bug fix or feature: start at `docs/system-knowledge/architecture.md` to locate
the affected service(s), then read that node's `srs.md` + `architecture.md` BEFORE
touching code.**

## System map

| Service | Purpose | Knowledge node |
|---|---|---|
| landing | Vietnamese ChainPay marketing SPA (React/Vite + nginx, :3000); reverse-proxies `/api/*` | `docs/system-knowledge/landing/` |
| waitlist | Express + Postgres signup API (:8080) — validate, dedup, public count | `docs/system-knowledge/waitlist/` |
| db | Postgres 16 datastore for the `waitlist` table (internal :5432) | `docs/system-knowledge/waitlist/` |

> Every new service adds: a row here, a node under `docs/system-knowledge/<service>/`
> (templates in `docs/system-knowledge/_meta/`), an entry in `docker-compose.yml`,
> and a smoke row in the runbook.

## Build & test

- Frontends / Node services: `npm run build` and `npm test` inside the service dir.
- Other stacks: each service's `CLAUDE.md` documents its own build/test commands.
- Never run the whole repo's test suite for a one-service change — test the service you touched.

## Deploy & environments

- One environment in this template: **local** (Docker Compose, `docker-compose.yml` at repo root).
- Deploy: `scripts/deploy-service.sh <service> local` — builds the image, (re)starts the
  service, waits for its healthcheck, runs its smoke check.
- Ops facts (ports, conventions, troubleshooting): `docs/system-knowledge/platform/infra/runbook.md`
  is the single source of truth. Do not trust remembered ports/commands.
- Mandatory flow for every task: feature branch off `main` → code + tests → merge to `main`
  → `scripts/deploy-service.sh <svc> local` for every changed service → verify → tester round.

## Doc freshness rules (MANDATORY)

1. Changed a contract (REST/DB/event/invariant) or use case? → update that service's docs
   under `docs/system-knowledge/**` in the SAME commit/PR.
2. Found a doc-vs-code contradiction? → fix the doc (or the code) in the same PR.
3. Implemented a feature designed in `docs/superpowers/specs/`? → on merge, fold the
   outcome into the affected tree nodes. Specs are episodic; the tree is cumulative.
4. New service? → copy templates from `docs/system-knowledge/_meta/`, add a row to the
   map above, add a `CLAUDE.md` in the service dir.
5. Periodic drift audit: follow `docs/system-knowledge/AUDIT.md`.
