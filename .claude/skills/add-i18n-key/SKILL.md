---
name: add-i18n-key
description: Add or change a user-visible UI string in both English and Khmer (en.ts + km.ts) and use it through i18next. Use when the user adds UI text, a label, a message or a button, or asks to translate or reword a string, e.g. "add an 'Archive' button label", "the empty state needs a hint", "translate this message".
---

# Add a translation key

Work through the steps in order. Each step names the exact file. Keep the change minimal: only the keys needed.

## 0. Clarify
Confirm the English text and where it appears. Ask for the Khmer text if the user has it. If not, write a natural Khmer translation and say clearly in the summary that it needs review by a Khmer speaker.

## 1. English source (`frontend/src/i18n/locales/en.ts`)
- `en.ts` is the source of truth. `TranslationShape` is derived from it.
- Put the key under the existing namespace for that screen (`app`, `nav`, `auth`, `tasks`, ...). Do not create a new top-level namespace unless no existing one fits.
- Use camelCase key names that describe the meaning, not the text, e.g. `emptyHint`, not `noTasksYetCreateOne`.
- Use i18next interpolation for values, e.g. `'{{count}} tasks'`. Never build sentences by concatenating strings in components.

## 2. Khmer (`frontend/src/i18n/locales/km.ts`)
- Add the same key at the same path. `km` is typed as `TranslationShape`, so a missing or misspelled key fails `tsc`.
- Keep interpolation placeholders identical to `en.ts`.

## 3. Use it (`frontend/src/...`)
- In components: `const { t } = useTranslation()`, then `t('namespace.key')`. Never hardcode UI text in JSX, `message.*` calls, `aria-label`s or Ant Design `placeholder` props.

## 4. Tests
- If a test asserts on the visible text, update it to the new English string.

## 5. Verify
Run `npm run typecheck` and `npm test` from `frontend/` (`src/i18n/locales.test.ts` checks locale parity). Then summarize the keys added and the files changed.
