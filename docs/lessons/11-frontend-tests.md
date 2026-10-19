# Lesson 11: Frontend tests

## Goal
Test the logic that would hurt most if it broke: token refresh, route guards, URL parsing, error parsing, translation parity and form submission.

## Concepts
- **Test behavior, not implementation.** Find elements by role and label (`getByRole('button', {name: 'Save'})`), the same way users and screen readers find them.
- **Mock at the network boundary.** `axios-mock-adapter` replaces HTTP, but the real interceptors run.
- **Inject context.** Route-guard tests provide a fake `AuthContext` value instead of logging in for real.
- **jsdom gaps.** Ant Design needs `matchMedia` and `ResizeObserver`, which jsdom lacks, so `setup.ts` stubs them.

## Files touched
- `frontend/src/test/setup.ts`, `frontend/src/test/render.tsx`
- `frontend/src/api/client.test.ts`, `frontend/src/api/errors.test.ts`
- `frontend/src/features/auth/RouteGuards.test.tsx`
- `frontend/src/features/tasks/query.test.ts`, `frontend/src/features/tasks/TaskFormModal.test.tsx`
- `frontend/src/i18n/locales.test.ts`

## Walkthrough
- `frontend/src/api/client.test.ts:26`: a 401 triggers one refresh, then a retry with the new token.
- `frontend/src/api/client.test.ts:38`: three concurrent callers produce exactly **one** refresh request.
- `frontend/src/api/client.test.ts:44`: a failed refresh calls the session-expired handler.
- `frontend/src/features/auth/RouteGuards.test.tsx:34-55`: all four auth states.
- `frontend/src/features/tasks/query.test.ts:16`: malicious or invalid URL params are dropped.
- `frontend/src/i18n/locales.test.ts:17-30`: same keys, no empty strings, and `{{placeholders}}` preserved in Khmer.
- `frontend/src/features/tasks/TaskFormModal.test.tsx:18`: the submitted payload is trimmed, and the defaults are applied.

## Run it
```bash
git checkout lesson-11
cd frontend
npm test
```

## Check yourself
`Test Files  6 passed (6)` and `Tests  21 passed (21)`.

## Exercise
Write a test for `parseApiError` with a DRF `non_field_errors` response, and assert that it ends up in `message`.
