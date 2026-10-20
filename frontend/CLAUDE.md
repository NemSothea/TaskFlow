# TaskFlow frontend

React 19, TypeScript 7, Vite 8, Ant Design 6, Tailwind CSS 4, Axios, React Router 7, i18next.
Root rules in `../CLAUDE.md` (Auth model, Never) apply here too.

## Folder map
```
src/api/          axios client (token refresh), typed services, DRF error parsing
src/features/     auth/ and tasks/ feature folders (pages + components + hooks)
src/components/   layout, error/empty/loading states
src/i18n/         en.ts (source of truth) and km.ts (typed against en)
src/preferences/  theme + language, Ant Design ConfigProvider
```

## Commands (run from frontend/)
```bash
npm run dev          # http://localhost:5173, proxies /api to :8000
npm run typecheck && npm run lint && npm test && npm run build
```
All at once: `../scripts/check-frontend.sh`.

## Conventions
- Ant Design owns component styling and colors (theme tokens). Tailwind is for layout and spacing only. Tailwind preflight is disabled on purpose.
- Every UI string goes in **both** `src/i18n/locales/en.ts` and `km.ts`. `km.ts` is typed against `en.ts`, so a missing key fails `tsc`.
- API types in `src/api/types.ts` mirror the DRF serializers. Update both together.
- Every HTTP call goes through `src/api/client.ts`. Never create another axios instance.
- Tokens never go in `localStorage` or `sessionStorage`. The access token stays in memory.
- New frontend logic needs a vitest.
