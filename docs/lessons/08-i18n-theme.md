# Lesson 08: i18n (Khmer / English) and theme

## Goal
Make every string translatable with a guarantee that Khmer is never missing a key, and persist the user's light or dark choice.

## Concepts
- **English is the source of truth.** `km.ts` is typed as `TranslationShape`, which is derived from `en.ts`. A missing or extra key fails `tsc`, not production.
- **Typed `t()` keys.** Augmenting `CustomTypeOptions` means a typo like `t('task.titel')` is a compile error.
- **Locale sync.** Ant Design components (DatePicker, Pagination) and dayjs dates must switch language too, not just your own strings.
- **Khmer typography.** Stacked vowels and subscript consonants need a bigger line height (1.75), and the Noto Sans Khmer font is bundled locally, so it works offline and leaks no requests to Google.
- **Theme via tokens.** Ant Design's `darkAlgorithm` recolors every component. You don't need a separate set of dark CSS rules.

## Files touched
- `frontend/src/i18n/index.ts`, `frontend/src/i18n/locales/en.ts`, `frontend/src/i18n/locales/km.ts`
- `frontend/src/preferences/PreferencesProvider.tsx`, `frontend/src/preferences/context.ts`

## Walkthrough
- `frontend/src/i18n/locales/en.ts:105-106`: `DeepStrings` turns the English object into a "same keys, any string" type.
- `frontend/src/i18n/index.ts:15`: the initial language comes from the saved choice, then the browser language, then English.
- `frontend/src/i18n/index.ts:24`: the `languageChanged` listener switches the dayjs locale and `<html lang>` **before** React re-renders. When this lived in a `useEffect`, dates rendered in English for one frame and stayed that way.
- `frontend/src/i18n/index.ts:39`: `CustomTypeOptions` makes the keys typed.
- `frontend/src/preferences/PreferencesProvider.tsx:16`: the initial theme comes from the saved choice, then `prefers-color-scheme`.
- `frontend/src/preferences/PreferencesProvider.tsx:51-57`: theme tokens, including the Khmer line height.
- `frontend/src/preferences/PreferencesProvider.tsx:65`: `ConfigProvider` swaps the Ant Design locale (`km_KH` or `en_US`).

## Run it
```bash
git checkout lesson-08
cd frontend
npm run typecheck
```

## Check yourself
Type-checking passes. To see the guarantee work, delete one key from `km.ts`, run `npm run typecheck` again, and read the error. Restore the key afterwards.

## Exercise
Add a third language key, `tasks.duplicate`, to `en.ts` only, and run `npm run typecheck`. Then add the Khmer translation, "ចម្លង".
