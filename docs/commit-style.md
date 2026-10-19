# Commit message style

TaskFlow follows [Conventional Commits](https://www.conventionalcommits.org/). Every example below is a real commit in this repo; run `git log` to see the full messages.

## Format

```text
<type>(<scope>): <subject>

<body: what problem this solves and WHY this approach>

<footer: BREAKING CHANGE, issue refs, Co-Authored-By>
```

## Type

| Type | Use for | Example from this repo |
|------|---------|------------------------|
| `feat` | New behavior a user or API client can see | `feat(tasks): add owner-scoped Task API with filters and pagination` |
| `fix` | A bug fix | `fix(tasks): show localized due dates after language switch` |
| `test` | Adding or changing tests only | `test(backend): cover auth lifecycle, ownership isolation and constraints` |
| `docs` | Documentation only | `docs: add README with setup, env vars, API and security design` |
| `build` | Dependencies, scaffolding, build config | `build(frontend): scaffold Vite React TypeScript app` |
| `refactor` | Restructuring code with no behavior change | `refactor(api): extract DRF error parsing into errors.ts` |
| `perf` | Performance with no behavior change | `perf(tasks): add (owner, due_date) index` |
| `chore` | Repo housekeeping and tooling | `chore(claude): add CLAUDE.md, slash commands and add-task-field skill` |
| `ci` | CI pipelines | `ci: run pytest and vitest on pull requests` |

The `fix`, `refactor`, `perf` and `ci` rows are illustrative; the others are real.

If a commit seems to need two types, it is probably two commits.

## Scope

The scope is the part of the codebase you changed. Use one of these:
- **Backend:** `backend` (cross-cutting), `accounts`, `tasks`, `config`
- **Frontend:** `frontend` (cross-cutting), `api`, `auth-ui`, `tasks-ui`, `i18n`, `theme`
- **Repo:** `lessons`, `claude`, `deps`

Leave the scope out when the change is repo-wide (`docs: …`, `chore: …`).

## Subject line

- **Imperative mood**, as if finishing "This commit will…": `add`, `fix`, `remove`. Not `added`, `adds` or `adding`.
- **72 characters or fewer** for the whole first line, including the type and scope.
- **Lowercase** after the colon, with **no trailing period**.
- **Say what changed, specifically.** Use `add httpOnly refresh cookie with rotation`, not `update auth` or `fix stuff`.

## Body

The diff already shows **what** changed. The body explains **why**:
- the problem or risk being addressed,
- why this approach was chosen over the obvious alternative,
- anything a reviewer or a future you would otherwise have to rediscover.

Wrap lines at about 72 characters, and separate the body from the subject with a blank line.

**Good** (`lesson-07`, abridged):
```text
feat(frontend): add typed API client with single-flight token refresh

Concurrent callers share one refresh promise: the server rotates
refresh tokens, so parallel refreshes would invalidate each other and
log the user out (React StrictMode triggers exactly this in dev).
```

**Weak:**
```text
update client.ts

added refresh logic and fixed some things
```
It gives no type or scope, says nothing specific, and has no "why".

## Footer

- **Breaking API change:** add `!` after the type or scope, plus a footer.
  ```text
  feat(tasks)!: rename due_date to due_at

  BREAKING CHANGE: clients must send due_at as an ISO datetime.
  ```
- **Issue references:** `Closes #12`, `Refs #7`.
- **AI-assisted commits** end with a co-author trailer, e.g.
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Never

- Commit secrets, then "fix" them in a later commit. History keeps them forever. Rotate the secret instead.
- Mix unrelated changes ("add tags and fix login and bump deps") in one commit.
- Use messages like `wip`, `fix`, `asdf` or `final` on shared branches.
- Rewrite history that has already been pushed to `main`.

## Tooling

- In Claude Code, `/commit` stages nothing on its own. It reads the staged diff and drafts a message in this style for you to approve.
- Check recent history: `git log --format='%s' -20`.
