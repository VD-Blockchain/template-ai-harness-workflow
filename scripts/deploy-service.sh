#!/usr/bin/env bash
# Deploy a service to an environment. Template ships local (Docker Compose) only.
# Usage: scripts/deploy-service.sh <service> <local>
# Gates on: registered -> built -> running -> healthy -> smoke. See the runbook:
# docs/system-knowledge/platform/infra/runbook.md
set -euo pipefail

SVC="${1:-}"
ENV="${2:-local}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

die() { echo "ERROR: $*" >&2; exit 1; }

[ -n "$SVC" ] || die "usage: scripts/deploy-service.sh <service> <env>"
[ "$ENV" = "local" ] || die "env '$ENV' not defined. This template ships 'local' only — add new envs to the runbook first, then extend this script."
[ -f docker-compose.yml ] || die "docker-compose.yml not found. Register the service first (see runbook 'Service registration conventions')."

docker compose config --services | grep -qx "$SVC" \
  || die "service '$SVC' is not registered in docker-compose.yml. Services: $(docker compose config --services | tr '\n' ' ')"

echo "==> [1/4] build $SVC"
docker compose build "$SVC"

echo "==> [2/4] up $SVC"
docker compose up -d "$SVC"

CID="$(docker compose ps -q "$SVC")"
[ -n "$CID" ] || die "container for '$SVC' did not start"

echo "==> [3/4] wait for running/healthy (max 90s)"
DEADLINE=$((SECONDS + 90))
while :; do
  STATE="$(docker inspect --format '{{.State.Status}}' "$CID")"
  HEALTH="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CID")"
  if [ "$STATE" = "running" ] && { [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "none" ]; }; then
    [ "$HEALTH" = "none" ] && echo "WARN: no healthcheck defined for '$SVC' — runbook requires one." >&2
    break
  fi
  if [ "$STATE" = "exited" ] || [ "$STATE" = "dead" ] || [ "$HEALTH" = "unhealthy" ]; then
    echo "---- last logs ----" >&2
    docker compose logs --tail 50 "$SVC" >&2 || true
    die "'$SVC' is $STATE/$HEALTH — deploy failed"
  fi
  [ $SECONDS -lt $DEADLINE ] || { docker compose logs --tail 50 "$SVC" >&2 || true; die "'$SVC' not healthy after 90s (state=$STATE health=$HEALTH)"; }
  sleep 3
done

echo "==> [4/4] smoke check"
SMOKE="$(docker inspect --format '{{index .Config.Labels "harness.smoke"}}' "$CID")"
if [ -z "$SMOKE" ]; then
  echo "WARN: no 'harness.smoke' label on '$SVC' — skipping smoke. Runbook requires one." >&2
else
  DEADLINE=$((SECONDS + 30))
  until curl -fsS -o /dev/null "$SMOKE"; do
    [ $SECONDS -lt $DEADLINE ] || die "smoke check failed: $SMOKE not responding 2xx/3xx after 30s"
    sleep 3
  done
  echo "smoke OK: $SMOKE"
fi

echo "DEPLOYED: $SVC -> $ENV (state=running health=${HEALTH} smoke=${SMOKE:-skipped})"
