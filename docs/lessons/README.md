# TaskFlow: build a full-stack app step by step

Each lesson matches one commit, tagged `lesson-NN`. Read the lesson, check out the tag, look at the diff, and run the commands.

```bash
git checkout lesson-03          # jump to the end of lesson 3
git show --stat lesson-03       # files added in this lesson
git diff lesson-02 lesson-03    # exactly what changed
git switch main                 # back to the finished project
```

> **Important:** the history is a teaching narrative. The finished project was split into commits by layer. Some intermediate tags do not run on their own: a file may import something that only arrives in a later lesson. Each lesson's **Check yourself** section says what works at that tag. Only `main` (the latest lesson) is guaranteed to pass every check.

| # | Tag | Title | What you learn |
|---|-----|-------|----------------|
| 01 | `lesson-01` | [Repository skeleton](01-repo-skeleton.md) | `.gitignore` for secrets, Postgres in Docker |
| 02 | `lesson-02` | [Django project and settings](02-django-settings.md) | env-driven settings, no default secret, DRF/JWT config |
| 03 | `lesson-03` | [Accounts and cookie JWT auth](03-accounts-auth.md) | custom user, httpOnly refresh cookie, rotation, CSRF |
| 04 | `lesson-04` | [Tasks API](04-tasks-api.md) | owner-scoped querysets, 404 vs 403, constraints, indexes |
| 05 | `lesson-05` | [Backend tests](05-backend-tests.md) | pytest-django, ownership isolation tests, query counts |
| 06 | `lesson-06` | [Frontend scaffold](06-frontend-scaffold.md) | Vite proxy, Tailwind and Ant Design split, strict TS |
| 07 | `lesson-07` | [API client](07-api-client.md) | in-memory token, single-flight refresh, typed errors |
| 08 | `lesson-08` | [i18n and theme](08-i18n-theme.md) | Khmer and English with compile-time parity, persistent dark mode |
| 09 | `lesson-09` | [Auth UI and app shell](09-auth-ui.md) | AuthProvider, route guards, safe redirects, lazy routes |
| 10 | `lesson-10` | [Tasks page](10-tasks-page.md) | URL-synced filters, abortable fetches, responsive list |
| 11 | `lesson-11` | [Frontend tests](11-frontend-tests.md) | Vitest, Testing Library, mocking axios |
| 12 | `lesson-12` | [README](12-readme.md) | documenting setup, env vars, API, security |
| 13 | `lesson-13` | [Claude Code tooling](13-claude-tooling.md) | CLAUDE.md, slash commands, skills, permissions |
| 14 | `lesson-14` | [This lesson series](14-lessons.md) | writing teachable history |
| 15 | `lesson-15` | [Writing good prompts](15-writing-prompts.md) | prompt anatomy, pitfalls, tips, techniques, real before/after prompts |
| 16 | not tagged yet | [The TaskFlow setup](16-setup-overview.md) ([slides](https://claude.ai/artifact/BC4wm3pG1XxW3VDBxqxG2u)) | the stack map, motion.dev / ui-ux-pro-max / 21st.dev, Claude commands, skills, agents, hooks |

## Prerequisites
Docker, [uv](https://docs.astral.sh/uv/), Node 20.19+ (or 22.12+), and Git. Basic Python and React knowledge.
