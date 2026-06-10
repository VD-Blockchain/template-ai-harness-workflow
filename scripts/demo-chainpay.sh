#!/usr/bin/env bash
# Human spot-check for the ChainPay landing + waitlist feature (local env).
# Prints the steps a person should follow; does not assert anything itself.
set -euo pipefail

LANDING="http://localhost:3000/"
COUNT="http://localhost:3000/api/waitlist/count"

cat <<EOF
================================================================
 ChainPay — demo spot-check (local Docker Compose)
================================================================

Prereqs: services deployed and healthy:
  scripts/deploy-service.sh db local
  scripts/deploy-service.sh waitlist local
  scripts/deploy-service.sh landing local
  docker compose ps         # landing, waitlist, db all running/healthy

Steps:
  1. Open the landing page in a browser:
        ${LANDING}
     Confirm the page is in Vietnamese and shows: Hero + CTA, value/problem
     section, 3-4 features, a "how it works" section, the waitlist form, footer.

  2. Resize to a narrow (~375px) mobile width.
     Confirm: no horizontal scroll, content reflows, the form is operable.

  3. In the waitlist form, enter a NEW email (e.g. you+\$RANDOM@example.com)
     and submit. Confirm a success message appears and the signup count
     ("Đã có N người đăng ký") increases by 1.

  4. Submit the SAME email again. Confirm a friendly "đã đăng ký" style
     message (not a hard error) and the count does NOT increase.

  5. Submit a malformed email (e.g. "abc"). Confirm an inline error and that
     no signup is created.

Current public signup count (live):
EOF

if command -v curl >/dev/null 2>&1; then
  echo -n "  GET ${COUNT} -> "
  curl -fsS "${COUNT}" || echo "(could not reach API — are the services up?)"
  echo
else
  echo "  (install curl, or open ${COUNT} in a browser)"
fi

echo "================================================================"
