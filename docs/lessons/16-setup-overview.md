# Lesson 16: The TaskFlow setup: stack, helpers and Claude

> **Slides:** [Lesson 16 deck](https://claude.ai/artifact/BC4wm3pG1XxW3VDBxqxG2u) (25 slides). The deck is private until its owner shares it.
> **Tag:** not tagged yet. This lesson describes work that is still uncommitted. Tag it `lesson-16` after that work is committed.

## Goal
See the whole project on one page: every piece of the stack and where it lives, the three helpers we used to level up the UI, and the Claude setup that keeps AI-assisted work safe and consistent. Lessons 01–13 build each piece step by step. This lesson is the map that ties them together.

## Concepts

### The stack and where each piece lives

| Piece | Job in TaskFlow | Where to look | Built in |
|---|---|---|---|
| React 19 + TypeScript | UI, lazy-loaded routes, typed API | `frontend/src/App.tsx`, `src/api/types.ts` | Lessons 06, 09 |
| Vite | Dev server, `/api` proxy (one origin), build, Vitest | `frontend/vite.config.ts` | Lesson 06 |
| Ant Design + Tailwind | Ant Design owns components and colours; Tailwind does layout only (preflight off) | `src/index.css`, `src/preferences/PreferencesProvider.tsx` | Lesson 06 |
| Axios | One client; access token in memory; one shared refresh; CSRF header | `src/api/client.ts` | Lesson 07 |
| React Router | Route guards, safe redirect, filters in the URL | `features/auth/RouteGuards.tsx`, `redirect.ts`, `features/tasks/query.ts` | Lessons 09–10 |
| Responsive | Table on desktop, cards below `md` (`Grid.useBreakpoint()`) | `features/tasks/TaskList.tsx` | Lesson 10 |
| Dark / light | Ant Design `darkAlgorithm`, OS preference first, then saved choice | `preferences/PreferencesProvider.tsx` | Lesson 08 |
| Khmer / English | i18next; `km.ts` is typed against `en.ts`, so a missing key fails `tsc` | `src/i18n/` | Lesson 08 |
| Django REST Framework | Owner-scoped viewsets: another user's task is 404, not 403 | `backend/tasks/views.py` | Lessons 04–05 |
| SimpleJWT | Access 5 min in memory; refresh 7 days in an httpOnly cookie, rotated and blacklisted | `backend/config/settings.py`, `CLAUDE.md` (Auth model) | Lesson 03 |
| PostgreSQL 17 | Docker on :5433; CHECK constraints; owner-first indexes | `docker-compose.yml`, `docs/erd.md` | Lessons 01, 04 |

**One origin.** The browser only calls Vite (:5173), which proxies `/api` to Django (:8000). The refresh cookie stays first-party and CSRF works without CORS. In production a reverse proxy does the same job (README, "Same origin").

### Three helpers to level up the UI

| Helper | What it is | How we used it | Trust level |
|---|---|---|---|
| [motion.dev](https://motion.dev/) | Animation library | Pinned `motion@14.0.0`, `LazyMotion strict` + `MotionConfig reducedMotion="user"`, `m.*` components | Code we run |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | AI design skill (rules + local search script) | Audited, vendored to `.claude/skills/ui-ux-pro-max/`, used as a checklist | Instructions an AI follows |
| [21st.dev](https://21st.dev/) | Component gallery (shadcn + Radix) | Ideas only, rebuilt with Ant Design tokens (sign-in glow and dot grid) | Inspiration |

The rules that keep the result consistent are in `docs/design-system.md`, and the plan for the dashboard is in `docs/features/dashboard.md`.

### The Claude setup

```
CLAUDE.md, backend/CLAUDE.md, frontend/CLAUDE.md   rules Claude reads every session
.claude/commands/   /dev /check /review /commit
.claude/skills/     add-api-endpoint, add-task-field, add-i18n-key, backend-tests, frontend-tests, ui-ux-pro-max
.claude/agents/     backend-reviewer, frontend-reviewer (read-only), test-writer
.claude/hooks/      block-secrets.sh (no .env writes), format-on-edit.sh (ruff on backend Python)
.claude/settings.json   allowed commands + hook wiring
```

A **rule** (CLAUDE.md) is advice the model reads. A **hook** is a script the harness runs on every edit; a non-zero exit blocks the action.

## Requirements: before you start
- [ ] Docker, uv, Node 20.19+ (or 22.12+) and Git are installed (see the lessons README).
- [ ] `scripts/dev.sh` starts the app and you can sign in as `demo` / `taskflow-demo-123`.
- [ ] You have Claude Code open in the repo root, so it reads `CLAUDE.md` and `.claude/`.

## Walkthrough

### 1. Slash commands

**Built-in** (checked against [the official command list](https://code.claude.com/docs/en/commands) on 2026-10-24; run `/help` for your version):

| Command | What it does | Use it when |
|---|---|---|
| `/copy` | Copies the last answer to the clipboard (`/copy 2` = the one before) | You need a generated prompt or text |
| `/clear` | New conversation with empty context; project memory stays | Starting an unrelated task |
| `/compact` | Summarises the conversation to free context | A long task is half-full |
| `/rewind` | Goes back to an earlier checkpoint (chat and/or code) | The AI went the wrong way |
| `/model` | Switches the model | A cheap model for mechanical work |
| `/context` | Shows what is filling the context window | Answers get vague or slow |
| `/memory` | Edits CLAUDE.md and memory files | You correct Claude twice about the same thing |
| `/init` | Creates a starter CLAUDE.md | A new repo |
| `/help` | Lists every command | You forget a name |

Also useful: `/permissions`, `/resume`, `/config`, `/mcp`, `/hooks`, `/security-review`.

**Ours** (`.claude/commands/*.md`):

| Command | Model | Does | Never |
|---|---|---|---|
| `/dev` | haiku | Creates `backend/.env` if missing, starts DB + API + Vite, waits for both URLs | prints the secret key |
| `/check` | haiku | Runs `scripts/check.sh`, reports PASS / FAIL / NOT RUN | edits files |
| `/review` | default | Reviews the diff against the three CLAUDE.md files, violations with file:line | edits files |
| `/commit` | sonnet | Drafts a message for the **staged** diff per `docs/commit-style.md`, checks for secrets | stages or commits unasked |

> **Name clash:** Claude Code has a built-in `/review` (an alias of `/code-review`). Check with `/help` which one runs, and consider renaming ours (for example `/rules-review`).

**Make your own command.** A command is one markdown file:

```markdown
---
model: haiku
description: Print the dashboard stats for the demo user
---

1. Check that http://localhost:5173/ responds. If not, tell the user to run /dev and stop.
2. ...numbered steps...

Never modify files.
```

### 2. Skills
A skill lives in `.claude/skills/<name>/SKILL.md`. Claude loads it automatically when your request matches its `description`, or you type `/name`. A command and a skill with the same name both create the same `/name` ([docs](https://code.claude.com/docs/en/skills)).

### 3. Prompt helpers
For bigger tasks: `/prompt-master` (a personal skill in `~/.claude/skills`, not in this repo) turns a rough idea into a full prompt → `/copy` → `/clear` → paste. The prompt should say "plan first, stop for approval". Lesson 15 explains the anatomy.

### 4. Other AI tools
| Idea | Claude Code | Cursor | GitHub Copilot |
|---|---|---|---|
| Project rules | `CLAUDE.md` | `.cursor/rules/*.mdc` | `.github/copilot-instructions.md` |
| Rules for some paths | `CLAUDE.md` per folder | a rule applied to specific files | `.github/instructions/*.instructions.md` |
| Shared standard | `CLAUDE.md` | `AGENTS.md` | `AGENTS.md` (or a root `CLAUDE.md`) |
| Saved prompts | `.claude/commands`, skills | not confirmed | `/explain`, `/fix`, `/tests` in chat |

Sources: [Cursor rules](https://cursor.com/docs/context/rules), [Copilot custom instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions), [Copilot cheat sheet](https://docs.github.com/en/copilot/reference/cheat-sheet), checked 2026-10-24.

## Be careful
- **Pin new packages.** `npm view <pkg> time --json` shows release dates. Pick a version older than two weeks and install it with `--save-exact`.
- **Audit a skill before you run it.** Clone it into an empty folder outside the project and grep its scripts for network or shell calls (`subprocess|urlopen|requests|os\.system|eval\(`). A skill's advice never overrides `CLAUDE.md`.
- **Don't paste components from another design system.** Take the idea, and rebuild it with Ant Design tokens.
- **Destructive commands need a yes first:** `seed_demo --reset` (deletes the demo user's tasks), `docker compose down -v` (deletes the `pgdata` dev database volume), `git push`.

## Cheat sheet
```bash
scripts/dev.sh                     # DB + migrate + seed_demo + API :8000 + Vite :5173
scripts/check.sh                   # every backend and frontend check, ends with RESULT: PASS/FAIL
scripts/e2e.sh                     # Playwright on :8001/:5174 with a separate database
cd frontend && npm run typecheck && npm run lint && npm test && npm run build
cd backend && uv run pytest && uv run ruff check . && uv run ruff format --check .
uv run python manage.py makemigrations --check --dry-run   # from backend/: no hidden model changes
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "focus visible keyboard" --domain ux
```

## Run it
```bash
scripts/dev.sh
```
Open http://localhost:5173, sign in as `demo`, then try desktop, tablet and phone widths, dark mode and ខ្មែរ. In Claude Code, run `/check`, then ask "use the frontend-reviewer agent on my changes".

## Check yourself
- You can point to the file for each row of the stack table.
- You can say which of motion.dev, ui-ux-pro-max and 21st.dev is code, instructions or inspiration, and why that changes how you use it.
- You can explain the difference between a rule, a command, a skill, an agent and a hook.

## Exercise
Fix the Khmer week labels. In Khmer, the "New tasks per week" chart shows labels like "M09 7", because `charts/WeeklyChart.tsx` formats dates with `Intl.DateTimeFormat('km-KH', …)`. dayjs already has the Khmer locale loaded (`src/i18n/index.ts`).

1. Start the app with `/dev` and switch to ខ្មែរ.
2. Ask Claude to **plan** the fix first, then approve it.
3. Let it add a vitest for the label format.
4. Run `/check`, then `/review`.

**Done when:** Khmer labels show Khmer month names, a new vitest covers it, and `/check` shows `RESULT: PASS`.
