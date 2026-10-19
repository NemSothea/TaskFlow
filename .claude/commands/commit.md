---
description: Draft a commit message for the staged changes following docs/commit-style.md
---

Write a commit message for the currently **staged** changes.

1. Read `docs/commit-style.md` and follow it exactly.
2. Run `git diff --cached --stat` and `git diff --cached`. If nothing is staged, say so and stop. Do not stage files yourself unless the user asks.
3. If the staged diff mixes unrelated changes, say so and suggest how to split it. Do not commit.
4. Check the staged diff for secrets (`.env`, keys, tokens, passwords). If you find any, stop and warn the user.
5. Draft the message:
   - `<type>(<scope>): <subject>`, imperative mood, 72 characters or fewer, no trailing period
   - a body (wrapped at about 72 characters) that explains why, not what
   - footers if needed (`BREAKING CHANGE:`, `Closes #N`), and end with the `Co-Authored-By` trailer
6. Show the message and ask for approval. Only after the user approves, run `git commit -F -` with the message on stdin. Never pass `--no-verify`, and never push.
