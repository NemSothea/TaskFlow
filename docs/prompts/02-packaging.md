# Prompt 02: Packaging the project as a lesson series

**Target tool:** Claude Code
**Rough idea it came from:**
> I see no commands, no claude, no skills, commit messages, why it seem not professional how can share it as lesson step by step.

**Result:** produced commits `lesson-01` … `lesson-14` and `docs/lessons/` in one run. Analysis: [lesson 15](../lessons/15-writing-prompts.md).

---

```text
You are working in an existing, finished project. Your job is packaging, not feature work: turn it into a professional Git repository that can be taught step by step as a lesson series.

## Context (carry forward)
- Project root: "/Users/sothea007/Desktop/Master prompt — Senior Full-Stack Engineer/taskflow-fullstack" (path contains spaces and an em dash; quote it in every shell command)
- App: TaskFlow, a task manager. Backend: Django 6.1 + DRF + SimpleJWT, uv, Postgres 17 in Docker on host port 5433. Frontend: React 19 + TS 7 + Vite 8 + Ant Design 6 + Tailwind 4 (layout only) + i18next (en/km).
- Auth design: access token kept in memory; refresh token in an httpOnly cookie, rotated and blacklisted on each refresh; CSRF check on refresh and logout.
- All checks currently pass: 33 pytest, 21 vitest, ruff, oxlint, tsc, vite build.
- It is NOT a git repo yet. No CLAUDE.md, no .claude/ folder, no lesson docs.
- backend/.env holds a real DJANGO_SECRET_KEY. It MUST NEVER be committed.

## Hard rules
- Do NOT change application behavior. Only make changes directly requested. Do not refactor, rename, add features, or add dependencies.
- NEVER commit .env files, node_modules, .venv, dist, caches, or *.tsbuildinfo. Before the first commit, run `git status --ignored` and confirm they are ignored.
- NEVER create a remote, push, or open a PR. Stop and ask me first.
- If any check fails, STOP and report the failure. Do not "fix" app code without asking.
- Commit messages use Conventional Commits (feat/fix/test/docs/chore/build), imperative mood, subject ≤ 72 chars, plus a body explaining WHY.

## Task 1: Lesson-shaped Git history
Run `git init -b main`. Then build the history by staging paths in this order, one commit per step, and tag each commit `lesson-NN`:
01 chore: repo skeleton (.gitignore, docker-compose.yml)
02 build(backend): Django project + env-driven settings (pyproject.toml, uv.lock, manage.py, config/, .env.example)
03 feat(accounts): custom user + cookie-based JWT auth (accounts/ without tests)
04 feat(tasks): Task model, owner-scoped API, pagination (tasks/ without tests)
05 test(backend): auth, ownership isolation, constraints (conftest.py, */tests/)
06 build(frontend): Vite + React + TS scaffold and config (package.json, lockfile, configs, index.html, public/)
07 feat(frontend): typed API client with single-flight token refresh (src/api/, src/lib/)
08 feat(frontend): i18n (en/km) + theme preferences (src/i18n/, src/preferences/)
09 feat(frontend): auth pages, route guards, app shell (src/features/auth/, src/components/, src/App.tsx, src/main.tsx, src/index.css)
10 feat(frontend): tasks page — list, filters, form, summary (src/features/tasks/ without tests)
11 test(frontend): client, guards, query parsing, i18n parity, form (all *.test.* files, src/test/)
12 docs: README
13 chore(claude): CLAUDE.md + .claude/ tooling (Task 2)
14 docs(lessons): lesson series (Task 3)
Intermediate commits are a teaching narrative and may not run on their own. Say so in the lessons. Only HEAD must pass all checks.

## Task 2: Claude Code project tooling
- CLAUDE.md at the root, ≤ 80 lines: stack and versions, folder map, exact dev/test commands, conventions (Ant Design for components and Tailwind for layout only; every UI string goes in both en.ts and km.ts; querysets always scoped to request.user; owner is never client-writable), and a "Never" list (commit .env, store tokens in localStorage, disable CSRF/permissions to make something work).
- .claude/commands/check.md: runs every backend and frontend check, then reports each one as PASS / FAIL / NOT RUN with the reason.
- .claude/commands/dev.md: starts Postgres, Django on :8000 and Vite on :5173, and prints the URLs.
- .claude/skills/add-task-field/SKILL.md: a walkthrough for adding one field to Task end to end (model → migration → serializer → types.ts → en/km strings → form/list → backend and frontend tests → /check). Include a frontmatter `name` and a `description` that says when to trigger it.
- .claude/settings.json: allowlist only read-only and test commands (uv run pytest, ruff, npm test, npm run typecheck/lint/build, git status/log/diff).

## Task 3: Lesson series in docs/lessons/
- README.md: index table with lesson number, title, tag, and what you learn.
- 01-…md through 14-…md, one per tag. Each file has these sections: Goal (1-2 sentences) · Concepts · Files touched (paths) · Walkthrough (reference real code with file:line; do not paste whole files) · Run it (exact commands, incl. `git checkout lesson-NN`) · Check yourself (expected output) · Exercise (1 small task).
- Language: [LESSON LANGUAGE — default English; if "both", put Khmer under each English section]. Explain WHY each design decision was made (cookie refresh, 404 instead of 403, single-flight refresh, URL-synced filters).

## Order and checkpoints
1. Write CLAUDE.md, .claude/ and docs/lessons/ first (lessons may reference tags that are not created yet).
2. Then build the commits and tags in order.
3. After each commit, output: ✅ lesson-NN <subject> (<files count> files).

## Done when (verify each and show the evidence)
- `git log --oneline` shows 14 commits, and `git tag` shows lesson-01…lesson-14.
- `git ls-files | grep -E '(^|/)\.env$'` returns nothing.
- `git grep -n "DJANGO_SECRET_KEY=" HEAD` matches only .env.example lines with a placeholder.
- /check passes on HEAD and `git status` is clean.
Then stop and give me a summary: the commit list, the files you added, and the exact `gh repo create taskflow-fullstack --private --source . --push` command for me to run myself.```
