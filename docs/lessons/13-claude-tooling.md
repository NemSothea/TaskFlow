# Lesson 13: Claude Code tooling

## Goal
Make the repository AI-assistant friendly. Claude Code should learn the project's rules on its own, run the checks with one command, and follow a repeatable recipe for common changes.

## Concepts
- **`CLAUDE.md`** is loaded into every Claude Code session in this repo. It holds the stack, commands, conventions and a "Never" list. Keep it short; it costs context on every turn.
- **Slash commands** (`.claude/commands/*.md`) are reusable prompts. Typing `/check` runs every check and reports PASS / FAIL / NOT RUN honestly.
- **Skills** (`.claude/skills/<name>/SKILL.md`) are multi-step recipes. The frontmatter `description` tells Claude **when** to use one automatically.
- **Permissions** (`.claude/settings.json`) pre-approve only safe, read-only or test commands. Anything that writes still asks first.
- `.claude/settings.local.json` holds personal overrides and is git-ignored.

## Files touched
- `CLAUDE.md`
- `.claude/commands/check.md`, `.claude/commands/dev.md`, `.claude/commands/commit.md` (added after this tag; see `docs/commit-style.md`)
- `.claude/skills/add-task-field/SKILL.md`
- `.claude/settings.json`

## Walkthrough
- `CLAUDE.md`, "Conventions": the rules from lessons 04, 08 and 07, written as instructions.
- `CLAUDE.md`, "Never": committing `.env`, storing tokens in `localStorage`, disabling CSRF or permissions, and editing applied migrations.
- `.claude/commands/check.md`: defines PASS, FAIL and NOT RUN precisely, so the report cannot be "optimistic".
- `.claude/skills/add-task-field/SKILL.md`: the eight-step path from model to UI to tests. It is the same path lessons 04–11 took.

## Run it
```bash
git checkout lesson-13
claude          # start Claude Code in the repo root
```
Then type `/check`. Then ask: "add an estimate_hours field to tasks".

## Check yourself
- `/check` prints a table with every row PASS.
- Asking for a new task field makes Claude use the `add-task-field` skill. It touches the model, migration, serializer, types, `en.ts` and `km.ts`, the form, the list and the tests.

## Exercise
Write `.claude/commands/review.md`, which reviews the current diff against the CLAUDE.md conventions and lists any violations with file:line.
