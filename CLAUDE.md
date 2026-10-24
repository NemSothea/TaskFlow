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
scripts/               dev.sh, check.sh, check-backend.sh, check-frontend.sh, e2e.sh (run from any cwd)
docs/erd.md            ERD of the database plus the plan for growing the schema
docs/features/         one spec per feature: endpoints, files, tests (dashboard.md: hero, cards, charts)
docs/design-system.md  visual rules: colors, type, motion, charts, UI checklist
docs/lessons/          step-by-step lesson series, one per git tag lesson-NN
docs/prompts/          real prompts used to build this project (see lesson 15)
.claude/               commands, skills, agents, hooks, settings.json
```

## Commands
```bash
scripts/dev.sh        # creates backend/.env if missing, db, migrate, seed_demo, API :8000, Vite :5173
scripts/check.sh      # every backend and frontend check; non-zero exit on failure
scripts/e2e.sh        # Playwright journeys on :8001/:5174 with a separate taskflow_e2e database (needs Docker)
```
Slash commands: `/dev`, `/check`, `/review` (diff vs these rules), `/commit`.
Hooks: `.env` writes are blocked; edited `backend/**/*.py` files are auto-formatted with ruff.

## Cross-package rules
- Plan first: a multi-file feature gets its spec in `docs/features/<feature>.md` (goal, API, files, tests, open work), agreed with the user before coding.
- API types in `frontend/src/api/types.ts` mirror the DRF serializers. Update both together.
- `docs/erd.md` mirrors the models. Update it in the same change as any model or migration.
- New backend rules need a pytest. New frontend logic needs a vitest. What to test: `backend-tests` and `frontend-tests` skills.
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
