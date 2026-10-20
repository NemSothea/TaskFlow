# TaskFlow

Full-stack task manager. Django REST API + React SPA, served from one origin.
Monorepo: each package has its own CLAUDE.md with stack, commands and conventions.

- `backend/CLAUDE.md`: Python 3.13 (uv), Django 6.1, DRF 3.18, SimpleJWT 5.5, PostgreSQL 17
- `frontend/CLAUDE.md`: React 19, TypeScript 7, Vite 8, Ant Design 6, Tailwind CSS 4, i18next
- Dev database: `docker-compose.yml` → Postgres on host port **5433**

## Folder map
```
backend/               Django API (see backend/CLAUDE.md)
frontend/              React SPA (see frontend/CLAUDE.md)
scripts/               dev.sh, check.sh, check-backend.sh, check-frontend.sh (run from any cwd)
docs/features/         one spec per feature: endpoints, files, tests
docs/lessons/          step-by-step lesson series, one per git tag lesson-NN
docs/prompts/          real prompts used to build this project (see lesson 15)
.claude/               commands, skills, agents, hooks, settings.json
```

## Commands
```bash
scripts/dev.sh        # db + API on :8000 + Vite on :5173 (needs backend/.env)
scripts/check.sh      # every backend and frontend check; non-zero exit on failure
```
Slash commands: `/dev`, `/check`, `/review` (diff vs these rules), `/commit`.
Hooks: `.env` writes are blocked; edited `backend/**/*.py` files are auto-formatted with ruff.

## Cross-package rules
- API types in `frontend/src/api/types.ts` mirror the DRF serializers. Update both together.
- New backend rules need a pytest. New frontend logic needs a vitest.
- Commits follow `docs/commit-style.md` (Conventional Commits, imperative subject of 72 characters or fewer, a body that explains why). Use `/commit` to draft one.

## Auth model (do not change without discussion)
- The access token (5 min) lives in JS memory only.
- The refresh token is an httpOnly cookie on `/api/v1/auth/`. It rotates on every refresh, and the old token is blacklisted.
- Refresh and logout enforce Django CSRF. The SPA sends `X-CSRFToken` from the `csrftoken` cookie.
- Concurrent refreshes share one request (`refreshAccessToken`). Otherwise, rotation would log the user out.

## Never
- Commit `.env` files or real secrets. Only `.env.example` with placeholders.
- Store tokens in `localStorage` or `sessionStorage`.
- Disable CSRF, permissions, throttling, or the ownership filter to "make something work".
- Edit an applied migration. Create a new one.
- Reset or drop the database without explicit approval.
