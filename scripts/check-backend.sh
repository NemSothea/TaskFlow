#!/usr/bin/env bash
# Run every backend check from backend/. Keeps going after a failure, exits 1 if any failed.
set -euo pipefail

cd "$(dirname "$0")/../backend"

failed=()
run() {
  echo "==> backend: $*"
  if ! "$@"; then
    failed+=("$*")
  fi
}

run uv run pytest
run uv run ruff check .
run uv run ruff format --check .
run uv run python manage.py check
run uv run python manage.py makemigrations --check --dry-run

if ((${#failed[@]})); then
  printf 'FAIL backend: %s\n' "${failed[@]}"
  exit 1
fi
echo "PASS backend"
