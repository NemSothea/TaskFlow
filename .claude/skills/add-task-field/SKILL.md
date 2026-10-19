---
name: add-task-field
description: Add a new field to the Task model end to end (database, API, TypeScript types, en/km translations, form, list, tests). Use when the user asks to add, track, or store a new property on tasks, e.g. "add tags to tasks", "tasks need an estimate", "add a category field".
---

# Add a field to Task

Work through the steps in order. Each step names the exact file. Keep the change minimal: one field, no unrelated refactors.

## 0. Clarify
Confirm the field name, its type, whether it is required, its default, and whether users should filter or sort by it. Ask if any of these is unclear.

## 1. Model and migration (`backend/tasks/models.py`)
- Add the field to `Task`. Give it a default, or `null=True`/`blank=True`, so existing rows migrate safely.
- For a fixed set of values, use a `TextChoices` class at module level, plus a `CheckConstraint`, following `TaskStatus`.
- If it will be filtered on, add an index with `owner` first, e.g. `models.Index(fields=["owner", "<field>"])`.
- Run `uv run python manage.py makemigrations tasks`, then read the generated migration before applying it.
- Never edit an existing migration.

## 2. API (`backend/tasks/serializers.py`, `backend/tasks/views.py`)
- Add the field to `TaskSerializer.Meta.fields`. Add a `validate_<field>` method if it needs server-side rules.
- Filterable: add it to `filterset_fields`. Sortable: add it to `ordering_fields`.
- Never make `owner` writable, and never remove the `owner=request.user` queryset filter.

## 3. Backend tests (`backend/tasks/tests/`)
- Create with the field, update it, reject invalid values (400), and filter by it if filterable.
- Run `uv run pytest`.

## 4. Types (`frontend/src/api/types.ts`)
- Add the field to `Task`. Add it to `TaskInput` if it is editable, and to `TaskQuery` if it is filterable. Add a const array if it is a choice field.

## 5. Translations (`frontend/src/i18n/locales/en.ts` and `km.ts`)
- Add the label under `tasks.fields`, plus any choice labels. Add the same keys to `km.ts`; `tsc` fails if one is missing.

## 6. UI (`frontend/src/features/tasks/`)
- `TaskFormModal.tsx`: add the `Form.Item`, include it in `FormValues`, and map it in `handleOk`.
- `TaskList.tsx`: add a table column, and show it in the mobile card if it is useful there.
- If filterable: `query.ts` (parse and serialize the URL param) and `TaskFilters.tsx` (add a control).

## 7. Frontend tests
- Update `TaskFormModal.test.tsx` so the expected submit payload includes the field.
- If filterable, extend `query.test.ts`.

## 8. Verify
Run `/check`, which must be all PASS. Then summarize the files changed and the new migration name.
