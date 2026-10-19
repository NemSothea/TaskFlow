# Lesson 14: Writing teachable history

## Goal
Understand how this lesson series was built, so you can do the same for your own projects.

## Concepts
- **One commit, one idea.** Each commit adds one layer (settings, auth, tasks, tests…). The diff between two tags is a focused lesson.
- **Conventional Commits.** `feat(tasks): …`, `test(backend): …`, `docs: …`. The type says what kind of change it is, and the scope says where. A body explains **why**. The full rules, with good and bad examples, are in [`docs/commit-style.md`](../commit-style.md).
- **Tags as bookmarks.** `lesson-NN` lets students jump to any step with `git checkout`.
- **Honesty about intermediate states.** When history is reconstructed from a finished project, some steps don't run on their own. Say so, as these lessons do in "Check yourself", instead of pretending.
- **Docs next to code.** Lessons cite `file:line`, so they stay checkable. If code moves, update the reference.

## Files touched
- `docs/lessons/README.md`, `docs/lessons/01-…md` through `14-lessons.md`

## Walkthrough
- `git log --oneline --decorate` shows every commit with its tag.
- `git show lesson-04` shows the message body and the full diff for the Tasks API.
- `docs/lessons/README.md` is the index table that links every lesson.

## Run it
```bash
git switch main
git log --oneline --decorate
git diff --stat lesson-04 lesson-05
```

## Check yourself
At tag `lesson-14`, `git log --oneline` lists 14 commits and `git tag` includes `lesson-01` to `lesson-14`. `/check` on `main` is all PASS.

## Exercise
Pick one feature you built recently. Split it into 3–5 commits that each tell one part of the story, and write a body for each one that explains why, not what.
