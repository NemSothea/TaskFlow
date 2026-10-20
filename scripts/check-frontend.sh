#!/usr/bin/env bash
# Run every frontend check from frontend/. Keeps going after a failure, exits 1 if any failed.
set -euo pipefail

cd "$(dirname "$0")/../frontend"

failed=()
run() {
  echo "==> frontend: $*"
  if ! "$@"; then
    failed+=("$*")
  fi
}

run npm run typecheck
run npm run lint
run npm test
run npm run build

if ((${#failed[@]})); then
  printf 'FAIL frontend: %s\n' "${failed[@]}"
  exit 1
fi
echo "PASS frontend"
