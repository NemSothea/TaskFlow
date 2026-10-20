---
model: haiku
description: Run every backend and frontend check and report PASS / FAIL / NOT RUN
---

Run all project checks from the repository root. Do not modify any files.

1. Run `scripts/check.sh`. It starts the database (`docker compose up -d --wait`), then runs every check and keeps going after a failure:
   - Backend (`scripts/check-backend.sh`): `uv run pytest`, `uv run ruff check .`, `uv run ruff format --check .`, `uv run python manage.py check`, `uv run python manage.py makemigrations --check --dry-run`
   - Frontend (`scripts/check-frontend.sh`): `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
2. Each check starts with a `==> backend: …` or `==> frontend: …` line. Use these to attribute output to each check. If the database step failed because Docker is not running, mark pytest and migrations as NOT RUN with that reason.

Report a table with one row per check: `Check | Result | Evidence`.
- **PASS**: the command exited 0. Evidence is the summary line, e.g. "33 passed".
- **FAIL**: the command exited non-zero. Evidence is the shortest decisive error line.
- **NOT RUN**: the command was not executed. Evidence is the reason.

Never report PASS for a command you did not run. If something fails, list the failing files or tests after the table, and stop. Do not attempt fixes unless asked.
