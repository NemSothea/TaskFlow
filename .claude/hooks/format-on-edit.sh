#!/usr/bin/env bash
# PostToolUse (Edit|Write): ruff format edited Python files under backend/. Everything else is skipped.
# The frontend has no formatter configured (oxlint only), so frontend files are left alone.
set -euo pipefail

# Read tool_input.file_path from the hook JSON on stdin. Prefer jq; fall back to python3.
read_path() {
  local input
  input="$(cat)"
  if command -v jq >/dev/null 2>&1; then
    jq -er '.tool_input.file_path // ""' <<<"$input"
  else
    python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' <<<"$input"
  fi
}

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
path="$(read_path 2>/dev/null)" || exit 0

case "$path" in
  "$root"/backend/*.py | backend/*.py) ;;
  *) exit 0 ;;
esac
[[ -f "$path" || -f "$root/$path" ]] || exit 0

# ruff respects backend/pyproject.toml (line-length, migrations excluded). Formatting failures never block.
(cd "$root/backend" && uv run ruff format --quiet -- "$path") >&2 || true
exit 0
