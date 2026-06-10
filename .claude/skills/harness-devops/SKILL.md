---
name: harness-devops
description: Use when performing DevOps operations (deploy, monitor, troubleshoot) on this project's environments.
---

# Project DevOps (harness-devops)

## Single source of truth

ALL facts (topology, commands, ports, service registry, troubleshooting) live in
**`docs/system-knowledge/platform/infra/runbook.md`**. Read it FIRST.
Do not trust remembered ports/commands — topology changes; the runbook is the only
place kept current.

Quick orientation (details in the runbook):
- This template ships ONE environment: **local** = Docker Compose (`docker-compose.yml`
  at repo root).
- Deploy: `scripts/deploy-service.sh <svc> local` — does build → up → healthcheck wait
  → smoke check.
- Every deployable service must be registered in `docker-compose.yml` with a
  healthcheck and a `harness.smoke` label (smoke URL) — conventions in the runbook.

## Red Flags — STOP and verify

- **Silent failure:** build success ≠ deployment success. The script verifies
  build + running + healthy + smoke; if you deploy any other way, YOU must verify all four.
- **Unregistered service:** a service without a compose entry + healthcheck + smoke row
  in the runbook is not deployable. Register it first (Developer's task — bounce it back
  if missing).
- **Memory over runbook:** if reality disagrees with the runbook, fix the runbook in the
  same session with what you verified.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "It's just local" | Local is the only gate before the Tester. Treat it with rigor. |
| "Container is running, good enough" | Running ≠ healthy ≠ serving. Wait for health, hit the smoke URL. |
| "I'll skip the smoke, the healthcheck passed" | Healthchecks lie (wrong port, stale image). Smoke from the host like a user would. |
