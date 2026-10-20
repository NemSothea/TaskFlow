#!/usr/bin/env bash
# Run all checks: database, backend, frontend. Exits 1 if anything failed.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

status=0
echo "==> database: docker compose up -d --wait"
if ! docker compose up -d --wait; then
  echo "FAIL database: docker compose up failed (is Docker running?). Backend DB checks will fail."
  status=1
fi

"$root/scripts/check-backend.sh" || status=1
"$root/scripts/check-frontend.sh" || status=1

if ((status)); then
  echo "RESULT: FAIL"
else
  echo "RESULT: PASS"
fi
exit "$status"
