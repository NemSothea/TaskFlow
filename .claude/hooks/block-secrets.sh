#!/usr/bin/env bash
# PreToolUse (Edit|Write): block writes to .env files. .env.example is allowed.
# Exit 2 blocks the tool call and shows stderr to Claude. Fails closed if input cannot be parsed.
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

path="$(read_path)" || {
  echo "block-secrets: could not parse hook input; blocking to be safe." >&2
  exit 2
}

name="$(basename -- "$path")"
case "$name" in
  .env.example) exit 0 ;;
  .env | .env.*)
    echo "Blocked: $path is an env file and may hold secrets. Edit .env.example with placeholders instead, or ask the user to edit it." >&2
    exit 2
    ;;
esac
exit 0
