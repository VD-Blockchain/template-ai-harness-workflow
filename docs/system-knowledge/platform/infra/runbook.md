# Ops Runbook — single source of truth

ALL infrastructure facts live here. If reality disagrees with this file, fix this file
in the same session with what you verified.

## Topology

- ONE environment: **local** — Docker Compose, `docker-compose.yml` at the repo root.
- Branch model: feature branches off `main`; `main` is what gets deployed locally.
- No staging/production in the template. When you add one, document it HERE first
  (env matrix, deploy command, verification), then update `CLAUDE.md`.

## Deploy

```bash
scripts/deploy-service.sh <service> local
```

The script, in order:
1. checks the service is registered in `docker-compose.yml`;
2. `docker compose build <service>`;
3. `docker compose up -d <service>`;
4. waits (max 90s) for the container to be `running` and — if a healthcheck is defined —
   `healthy`;
5. if the service has a `harness.smoke` label, curls that URL until 2xx/3xx (max 30s).

Build success ≠ running ≠ healthy ≠ serving. The script gates on all four; any other
deploy method means YOU verify all four manually.

## Service registration conventions (mandatory for every deployable service)

Each service is a top-level directory with its own `Dockerfile`. Register it in
`docker-compose.yml` like this:

```yaml
services:
  landing:
    build: ./landing
    ports:
      - "3000:80"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/"]
      interval: 5s
      timeout: 3s
      retries: 10
    labels:
      harness.smoke: "http://localhost:3000/"
```

Rules:
- `healthcheck` is REQUIRED (use a tool that exists inside the image: wget/curl/node).
- `harness.smoke` label is REQUIRED — the URL a real user would hit, from the host.
- Port allocation: first web app `3000`, next `3100`, APIs from `8080` upward.
  Record every allocation in the table below.

## Service table (keep current)

| Service | Port(s) | Smoke URL | Notes |
|---|---|---|---|
| landing | 3000→80 | http://localhost:3000/ | React/Vite SPA served by nginx; reverse-proxies `/api/*` → waitlist. |
| waitlist | 8080→8080 | http://localhost:8080/health | Express + pg API; needs `db` healthy first (`depends_on: service_healthy`). |
| db | 5432 (internal) | _(no smoke; healthcheck `pg_isready`)_ | Postgres 16; named volume `pgdata` persists signups. Not host-published. |

## Verify the whole system

```bash
docker compose ps                  # every service running/healthy, no restart loops
docker compose logs --since 5m    # no error storms
# + curl every Smoke URL in the table above
```

## Troubleshooting recipes

| Symptom | Recipe |
|---|---|
| Port already in use | `lsof -i :<port>` → stop the squatter, or change the mapping in compose + this table. |
| Stale build (old code keeps running) | `docker compose build --no-cache <svc> && docker compose up -d --force-recreate <svc>` |
| Container restart loop | `docker compose logs <svc>` — boot crash is code-level → back to Developer with logs. |
| Healthcheck always `starting` | The check tool may not exist in the image (alpine has wget, not curl). Fix the check, not the app. |
| Compose file missing | First service not registered yet — Developer must create `docker-compose.yml` per the conventions above. |

## Adding a new environment (when the project outgrows local)

1. Document it here: name, where it runs, deploy command, verification steps.
2. Extend `scripts/deploy-service.sh` (the `local`-only guard at the top).
3. Update `CLAUDE.md` deploy section + the promotion flow in
   `.claude/commands/team-code-feature.md` step "After the loop".
