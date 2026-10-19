# Lesson 06: Frontend scaffold

## Goal
Set up the React + TypeScript + Vite project so the SPA and the API share one origin in development, and so Ant Design and Tailwind don't fight each other.

## Concepts
- **Same-origin via proxy.** Vite forwards `/api` to Django. The browser sees a single origin, so the refresh cookie is first-party, CSRF works, and no CORS is needed.
- **Strict TypeScript** (`"strict": true`) catches null and undefined bugs at compile time.
- **Styling split.** Ant Design owns component styling. Tailwind is used for layout only, and its preflight reset is skipped.
- **Pinned dependencies.** `package-lock.json` is committed, so everyone installs the same versions.

## Files touched
- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/vite.config.ts`, `frontend/tsconfig*.json`, `frontend/.oxlintrc.json`
- `frontend/index.html`, `frontend/public/favicon.svg`, `frontend/.env.example`

## Walkthrough
- `frontend/vite.config.ts:11-16`: the dev proxy, `/api` → `http://127.0.0.1:8000`.
- `frontend/vite.config.ts`, `test` block: Vitest runs in jsdom with a setup file (added in lesson 11).
- `frontend/tsconfig.app.json`: `strict`, `noUnusedLocals`, `verbatimModuleSyntax`.
- `frontend/index.html`: an inline script applies the saved theme **before** React loads, so dark-mode users never see a white flash. It's wrapped in `try/catch` because `localStorage` can throw in private mode.
- `frontend/package.json`, `scripts`: `typecheck`, `lint` (oxlint), `test` (vitest) and `build`.

## Run it
```bash
git checkout lesson-06
cd frontend
npm install
```

## Check yourself
`npm install` reports `found 0 vulnerabilities`. `npm run build` **fails at this tag** because `index.html` points to `src/main.tsx`, which arrives in lesson 09.

## Exercise
Read the `@layer` line in `src/index.css` (lesson 09). Explain why unlayered Ant Design styles beat Tailwind utilities, and why the project uses `!` or inline `style` in a few places.
