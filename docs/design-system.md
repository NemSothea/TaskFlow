# Design system

The visual rules for the TaskFlow SPA. Read this before changing how anything looks or moves.
`frontend/CLAUDE.md` holds the code conventions; this file holds the design decisions behind them.
When a rule here changes, update the code that implements it in the same change.

## Principles
1. **Ant Design first.** Components, form controls, tags, tooltips and colors come from Ant Design theme tokens (`theme.useToken()`). Tailwind is for layout and spacing only (preflight is off).
2. **One brand, two surfaces.** Indigo is the brand. The gradient is reserved for the two "hero" surfaces: the tasks page header and the sign-in brand panel.
3. **Motion explains change.** Animate something entering, leaving or changing value. Never animate for decoration, never loop.
4. **Same status, same color, everywhere.** A status looks identical on cards, charts and the hero.
5. **Works in both themes and both languages.** Every change is checked in light, dark, English and Khmer, at 390px and 1440px.

## Color

| Token | Value | Where it lives | Use |
|---|---|---|---|
| Brand | `#4f46e5` | `src/preferences/brand.ts` `BRAND_COLOR` | Ant Design `colorPrimary` and `colorLink` |
| Brand gradient | `#4338ca` to `#6d28d9` to `#a21caf`, 135° | `brand.ts` `BRAND_GRADIENT` | Hero surfaces only. White text passes WCAG AA on every stop |
| Chart and status colors | see below | `brand.ts` `CHART_COLORS` | Charts, summary-card accents |
| Everything else | Ant Design tokens | `theme.useToken()` | Text, borders, surfaces, error and warning states |

Raw hex in components is not allowed, except for white text and white overlays on the gradient (`#fff`, `rgba(255,255,255,…)`) and the decorative burst particles.

### Status palette (validated)

| Status | Light | Dark | Categorical slot |
|---|---|---|---|
| In progress | `#2a78d6` | `#3987e5` | 1 (blue) |
| To do | `#eb6834` | `#d95926` | 2 (orange) |
| Done | `#1baf7a` | `#199e70` | 3 (aqua) |
| Single-series charts | `#4f46e5` | `#6d64f0` | brand |

- These values pass the dataviz validator (lightness band, chroma floor, colorblind separation ΔE ≥ 8, normal-vision floor) against `#ffffff` and `#141414`.
- Light-mode Done (`#1baf7a`) is below 3:1 against white. That is allowed only because every chart labels its values and has a table twin. Do not remove either.
- Re-run the validator before changing any value:
  `node <dataviz-skill>/scripts/validate_palette.js "#eb6834,#2a78d6,#1baf7a" --mode light --surface "#ffffff"` (and `--mode dark --surface "#141414"` with the dark values).
- Status tags in the task list (`TaskMeta.tsx`) still use Ant Design preset tag colors. Aligning them with this palette is open work.
- Overdue and due-soon use Ant Design `colorError` and `colorWarning`, always with an icon and a label, never color alone.

## Typography
- **Font:** Plus Jakarta Sans Variable, bundled locally (`@fontsource-variable/plus-jakarta-sans`). Khmer falls through to Noto Sans Khmer, which is also bundled. No font CDNs.
- **Khmer:** line height 1.75 (set in `PreferencesProvider` and `index.css`). Never put fixed heights on text containers.
- **Scale:**

| Role | Size and weight |
|---|---|
| Hero title (`h1`) | 30px, 36px from `sm`; bold; letter-spacing −0.02em |
| Sign-in headline | 24px, 30px from `sm`, 48px from `lg`; bold |
| Card and chart titles (`h2`) | 16px, semibold (Ant Design `Title level={2}` with `!text-base`) |
| Summary-card value | 30px, bold |
| Body | Ant Design default (14px) |
| Chart labels and captions | 12px minimum. Never smaller |

- `tabular-nums` only where numbers align in a column (chart value columns, axis ticks). Large standalone numbers keep proportional figures.

## Surfaces and layout
- **Page:** `max-w-6xl`, 16px gutter (24px from `sm`). No horizontal scroll at 390px.
- **Header:** sticky, translucent (`colorBgContainer` at 80%) with a 12px backdrop blur.
- **Hero:** gradient, radius `borderRadiusLG × 2`, two soft radial light blobs, white text.
- **Cards:** Ant Design `Card`, or a button styled with tokens for the summary cards. Radius `borderRadiusLG + 4`, a 4px accent bar in the status color, and a glow in the status color on hover.
- **Sign-in:** split layout from `lg` (gradient brand panel on the left, form on the dot-grid backdrop on the right). Below `lg` the gradient becomes a top band with the logo and headline only.
- **Grid:** summary cards 2 columns, 4 from `lg`. Charts 1 column, 2 from `md`, 3 from `xl`.

## Motion
- **Library:** Motion (`motion`), loaded through `LazyMotion strict`. Import `* as m from 'motion/react-m'`. The `motion.*` components are not allowed.
- **Reduced motion:** `MotionConfig reducedMotion="user"` honors the OS setting. Components that animate values by hand (`AnimatedNumber`, `Burst`, the ring pop) check `useReducedMotion()` and show the final state at once.
- **Timings** (`src/lib/motion.ts`):

| Token | Value | Use |
|---|---|---|
| `fast` | 150ms, ease-out | Hover, press, small feedback |
| `enter` | 300ms, ease-out | Elements entering |
| `layout` | spring (stiffness 500, damping 40) | List add and remove, cards settling |
| `STAGGER` | 50ms | Delay between siblings |

- **What animates:**

| Element | Motion |
|---|---|
| Page and auth card | Fade and rise 8–12px on mount |
| Summary cards | Staggered rise. Lift 4px and glow on hover. Scale 0.97 on press. Count up from 0 |
| Hero | Scale-in; text rises in sequence; the ring draws itself and counts up |
| Completing a task | Particle burst and ring pop (`TasksPage` increments `celebrate`) |
| Mobile task cards | Enter, exit and close the gap (`AnimatePresence` with `popLayout`) |
| Chart bars | Grow from the baseline once on mount |

- **Never animate:** desktop table rows, overshoot or bounce on data, anything infinite, anything blocking input.
- Never remount a component to replay an animation if that resets its state. Use `useAnimate`, as the ring pop does.

## Charts
Follow the dataviz skill. The rules that apply here:
- Built as plain HTML and CSS with Motion, not a chart library.
- Bars are at most 24px thick, with a 4px rounded data end and a square baseline. There is a 2px surface gap between stacked segments.
- Gridlines are 1px solid hairlines in `colorBorderSecondary`. There is no dual axis, ever.
- Every chart has a legend when it has 2 or more series, selective direct labels, a tooltip on every mark, and an `sr-only` table twin (`ChartTable`).
- Text never takes the series color. Numbers inside a filled mark use `inkOn()` (white or ink, whichever has more contrast).
- Narrow segments drop their inline label (below 12% of the row). The tooltip and the table carry the value.
- While refetching, the previous render stays at 60% opacity. No skeleton flash.
- Colors follow the status, never the rank. A filter must not repaint survivors.

## Accessibility
- Exactly one `h1` per page. Card and chart titles are `h2`. Landmarks are unique: two regions must not share a name.
- Decorative elements (blobs, burst, preview card) are `aria-hidden`.
- Every interactive element is reachable by keyboard and has a visible focus state (Ant Design default).
- Contrast is at least 4.5:1 for text and 3:1 for marks, or relief through labels and tables as above.
- Tests run axe on every page (`expectNoA11yViolations`) and run with reduced motion on (`src/test/setup.ts`).

## Checklist before shipping UI
- [ ] Light and dark, English and Khmer, at 390px, 820px and 1440px, with no horizontal scroll.
- [ ] Reduced motion on: everything is visible immediately.
- [ ] New strings are in `en.ts` and `km.ts`.
- [ ] Colors come from tokens, `brand.ts`, or the white-on-gradient exception.
- [ ] Any new chart color has been run through the validator.
- [ ] `scripts/check.sh` passes, and you looked at the page in a real browser.
