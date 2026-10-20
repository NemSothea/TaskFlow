---
description: Review the current diff against the CLAUDE.md rules and list violations with file:line
---

Review the uncommitted changes in this repository. Do not modify any files.

1. Read `CLAUDE.md`, `backend/CLAUDE.md` and `frontend/CLAUDE.md`. These rules are the review checklist.
2. Run `git diff HEAD` (staged and unstaged) and `git status --short`, then read any untracked files that are not ignored. If there are no changes, say so and stop.
3. Check every changed hunk against the rules. In particular:
   - Task querysets not filtered by `owner=request.user`, `owner` made writable, 403 returned where 404 is required
   - CSRF, permissions, throttling or the ownership filter disabled or weakened
   - an applied migration edited instead of a new one added
   - serializer fields changed without a matching `frontend/src/api/types.ts` change, or the reverse
   - UI strings hardcoded, or added to `en.ts` without `km.ts`
   - a second axios instance, or HTTP calls that bypass `frontend/src/api/client.ts`
   - tokens stored in `localStorage` or `sessionStorage`
   - Tailwind used for colors or component styling instead of Ant Design tokens
   - new backend rules without a pytest, new frontend logic without a vitest
   - `.env` files or secrets in the diff
4. Report one line per violation: `path:line: <rule broken>. <fix>.` Order by severity, with security and auth issues first. Only report what the diff shows; do not flag pre-existing code.

End with `N violations`, or `No violations found.` Do not fix anything unless asked.
