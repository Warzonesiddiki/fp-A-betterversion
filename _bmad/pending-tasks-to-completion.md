---
date: 2026-08-12
type: plan
status: current
owner: agent
supersedes: none
relates-to:
  - _bmad/project-completion-plan.md
  - COMPLETION_TASKLIST_ZERO_COMPROMISE.md
  - docs/CAPABILITY_TRUTH_MATRIX.md
  - GAP_LEDGER.md
---

# FinPlan Pro — Pending Tasks to Completion

**Goal:** an all-in-one FP&A tool covering every FP&A need across all industries,
with Zoho Books-grade UI/UX, highly optimised, zero-compromise quality.

This document lists what is **actually left to do**, derived from measurement of
the current tree rather than from the aspirations in the older planning docs.
Every count below was measured this session and the command that produced it is
given, so any claim here can be re-checked in one line.

---

## 0. Verified baseline (measured 2026-08-12)

These gates are **green right now**. This is the floor the work must not break.

| Gate | Command | Result |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | clean |
| Lint | `eslint src --max-warnings 0` | clean |
| Engine manifest | `npm run engines:verify` | 182 engines, current |
| Docs truth | `npm run docs:verify` | all measured claims match |
| Repo hygiene | `npm run repo:hygiene` | 2943 tracked files, 0 tracked-ignored |
| Architecture | `npm run architecture:guardrails` | all pass |
| Money ratchet | `npm run money:adoption` | holds (209 modules, 0 `toFixed`) |

**Established (P-00 ✅).** The full suite now runs in this environment via
`npm run test:sharded`: **1199 files, 13,447 tests** (1 skipped), ~13 min across
8 shards. The stock `npm test` still cannot run here (it requests an 8 GB heap
on a 3 GB / 2-CPU box); the sharded runner is the supported path. "All tests
pass" is now a verified claim in this environment, not an inherited one.

**Scale (measured):** 200 routed screens · 217 page modules · 214 engine modules
· 47 stores · 335 UI component modules · 64 services.

---

## 1. Done this session

Both were latent defects invisible to `tsc`, `eslint` and the jsdom suite. Each
shipped with a regression test that fails against the pre-fix code.

- **UI-00a — `dark:` variant was wired to the OS, not the app.**
  Tailwind v4 defaults `dark:` to `@media (prefers-color-scheme: dark)`, but
  FinPlan themes off an explicit `.dark`/`.light` class. Measured in the
  compiled stylesheet: 132 `dark:` utilities (across 148 modules) inside a
  media query, `:where(.dark)` zero times. Consequence: a user whose OS is dark
  could not reach the light theme, and the in-app toggle produced a half-themed
  screen. Fixed with `@custom-variant dark (&:where(.dark, .dark *))` → 0 media
  blocks, 212 class-scoped selectors. Pinned by
  `src/theme/darkVariant.contract.test.ts`.

- **UI-00b — 36 sector/industry routes rendered with no app chrome.**
  They were declared as siblings of `<Route element={<AppLayout />}>`, after the
  catch-all. React Router ranks by specificity, so they matched and rendered —
  outside the layout, with no sidebar/navbar/context bar and no way onward but
  browser history. Reproduced with a scratch router probe, then moved inside
  `AppLayout` under `RouteGroupWrapper domain="industry"`. All 200 routes
  preserved, none duplicated. Pinned by `src/App.routeShell.test.tsx`.

- Dev-only `server.allowedHosts` so the dev server is previewable through a
  proxied hostname (loopback + explicit preview domains, never `true`).

---

## 2. UI/UX track — Zoho Books restyle

The reference: light-first canvas, a single quiet left rail with grouped
sections, generous whitespace, restrained colour used only for meaning (status,
money direction, primary action), flat cards with hairline borders rather than
heavy shadows, and dense but legible data tables.

### UI-01 — Collapse the two competing styling systems `[blocking]`

There are currently **two** parallel component layers:

- Tailwind/shadcn primitives in `src/components/ui/*` (`Button`, `Card`,
  `Input`, …) with hardcoded `bg-blue-600` / `gray-*` and `dark:` variants;
- a plain-CSS layer in `src/index.css` (`.btn*`, `.card`, `.input`, `.select`,
  `.badge*`, `.table`, `.data-grid`, `.fp-*`) driven by CSS custom properties.

They disagree on colour, radius, spacing and density, so the same logical
control looks different depending on which layer a page happened to use. There
is also a third source of truth, `src/config/designTokens.ts` (344 lines), which
is **not** connected to either.

**Step 1 of this task is DONE (commit `1b5cf48`).** Investigating it surfaced
two silent defect classes that no build, lint or test could catch:

- **248 shadcn utility usages across 42 files compiled to zero CSS.**
  `text-muted-foreground` (×160), `bg-muted` (×30), `bg-primary` (×10),
  `ring-ring`, `bg-card` … all parsed fine and emitted nothing, because no
  `--color-*` keys were registered (no `tailwind.config.*`, no `@theme`).
  This hit the core primitives: `Button` (`ring-ring`), `Card` (`bg-card`),
  `Input` (`placeholder:text-muted-foreground`).
- **287 `var(--…)` references across 50 files pointed at properties that were
  never declared** (`--border` ×44, `--text-tertiary` ×43, `--bg-primary` ×21,
  `--accent` ×17 …), silently invalidating the whole declaration.
  `--bg-muted` (78 uses) was declared *only* under
  `[data-high-contrast='true']`, so table zebra striping worked in the
  accessibility mode and nowhere else.

Both are fixed in `src/index.css` via an `@theme inline` bridge plus alias
declarations onto the canonical scale, and pinned by
`src/theme/tokenBridge.contract.test.ts` (mutation-tested, 4/4 caught).
This removes a large share of the "styling looks off" surface area, and it
had to land before any restyling work — the light theme could not have been
correct while these tokens resolved to nothing.

Remaining steps to drive one palette instead of three:

1. ~~Register the shadcn `--color-*` keys and resolve the dangling vars.~~
   **Done.** Still open: `src/config/designTokens.ts` (344 lines) remains a
   third, **provably unconsumed** source of truth (only its own test imports
   it) and it *conflicts* with the CSS (radius `xs` 4px vs 2px;
   `--negative:#f43f5e` vs `financial.negative:#dc2626`). Either delete it or
   convert it into the generator for the `@theme` block — do not leave both.
2. Restate the Tailwind primitives in terms of semantic tokens
   (`--action-primary`, `--surface-panel`, `--text-body`) instead of raw
   `blue-600`/`gray-800`.
3. Keep the `.fp-*` classes — they are already token-driven and covered by
   `AtlasFoundations.visual-contract.test.tsx` snapshots.
4. Verified by: extend the visual-contract test with a Button/Card/Input case,
   plus a lint rule banning raw palette utilities in `src/components/ui`.

Measured surface: 305 of 490 non-test `.tsx` files use raw `slate-`/`gray-`
utilities; 146 use `dark:`; 247 use `var(--…)`.

### UI-02 — Flip to light-first ✅ DONE

Zoho Books is a light product. FinPlan defaulted to Bloomberg-dark
(`--bg-root:#080c14`). Dark remains available (a genuine strength for a finance
terminal); the default and the polished path are now light.

Shipped: `uiStore` seed `dark`→`light`; the `index.html` bootstrap no longer
falls back to dark (it only opts *in* to dark, and re-resolves `'system'`
against the OS); `.light` gained overrides for every contrast-sensitive token.
CSP hash updated to `sha256-7Fr6DsWabQ…` and verified against both `index.html`
and `dist/index.html`.

**Two further defects surfaced while doing this, neither previously known:**

- **Persistence was broken end to end.** The bootstrap read
  `localStorage['finplan-theme']`, but *nothing in the codebase ever wrote that
  key* — the real preference is persisted by `uiStore` into an **encrypted
  SQLite blob** (`finplan-sqljs-db`), which a synchronous inline script cannot
  read. The read therefore always returned `null`, so every reload painted the
  default theme and a user's saved choice never survived. `ThemeContext` now
  mirrors the preference into that key. This is why the flip alone would not
  have held.
- **WCAG failures latent in the light palette.** Tokens declared only in
  `:root` inherited into light mode and were never checked against a light
  canvas: `--text-muted` #94a3b8 **2.56:1**, `--warning` #f59e0b **2.15:1**,
  `--negative` #f43f5e 3.67:1, `--accent-primary` #0284c7 4.10:1, `--info`
  4.47:1. All now clear **4.5:1 on all four light surfaces**. `--negative`
  moved to the `#DC2626` that AGENTS.md mandates. `--bg-root` lightened
  `#f1f5f9`→`#f8fafc` and `--bg-hover`→`#f5f8fa` (also closer to Zoho's
  near-white canvas), which is what let `#DC2626` clear AA on hovered rows.
  Dark-canvas glass/shadows (black at 0.3–0.4 alpha) were re-tuned to a slate
  tint for light.

Verified by `src/theme/lightMode.contract.test.ts` — 9 tests that **recompute**
contrast ratios from the CSS rather than asserting hexes, so they keep holding
as the palette evolves. Mutation-verified 6/6 (store default, bootstrap
fallback, muted regression, `#DC2626` drift, mirror-write removal, shadow
leak). Full gate run: tsc, eslint, 109 theme/layout/smoke tests, `vite build`,
both CSP hashes.

**Deferred, recorded so it is not lost:** `--financial-draft` (#64748b) is the
one token that cannot satisfy both themes — **4.46:1** on light hover and, more
importantly, **2.89:1 in dark mode today** (a pre-existing failure). It is
deliberately left alone because
`AtlasFoundations.visual-contract.test.tsx` pins financial tokens as
theme-invariant by design (single source of truth). Fixing it means either
relaxing that contract or re-picking the lifecycle palette — folded into
**UI-07**, where the status palette is revisited as a whole.

### UI-03 — Navigation and IA `[highest user-visible value]`

**165 of 200 routes are unreachable from the navigation UI.**
(`comm -23` of route paths in `App.tsx` against paths in `types/navigation.ts`.)
`PILLARS` covers ~25 routes and `LEGACY_NAV_ITEMS` 16 sector entries. The
command palette does not close the gap — `AppLayout` hardcodes **15** command
items. So ~82% of the product is reachable only by typing a URL, which on a
desktop-only app with no address bar means: not reachable at all.

This is the single largest gap between "217 page modules exist" and "a user can
use them". Work:

1. Derive the nav model from the route table (or generate both from one
   manifest) so a new route cannot be orphaned. `src/pages/_docs.ts` already
   achieves this for help text — 199/200 routes have entries, 2 missing — and is
   the proven pattern to copy.
2. Rebuild the sidebar as Zoho-style grouped sections with collapsible
   subsections, matching the pillar model.
3. Feed the command palette from the same manifest so every route is
   keyboard-reachable.
4. Wire the sidebar Quick Search button — `Sidebar.tsx:104` is literally
   `onClick={() => {}}`, so the most discoverable search affordance in the app
   does nothing. Point it at the command palette.
5. Verified by: a test asserting every non-parameterised route is reachable from
   the nav manifest, and every nav target resolves to a real route.

### UI-04 — Density, typography, and the data grid

Body is 13px with a 4/8/12/16/24/32 spacing scale — already close to the right
register for finance. Needs: a real type scale (no global H1–H6), line-height
tokens, tabular figures everywhere money appears, and one grid density contract
shared by AG Grid and `.data-grid` (`designTokens.density` defines
compact/standard/comfortable but nothing consumes it).

### UI-05 — Page-level consistency pass

89 page modules exceed the 300-line convention in `AGENTS.md`; 61 components do
too. 140 non-test modules use inline `style={{…}}` against an explicit
"no inline styles" rule. Convert to `PageHeader` + token classes, extract
oversized pages, and remove inline styles as each page is touched — not as a
separate sweep.

### UI-06 — Money formatting

**72 modules re-implement `formatCurrency` locally** and **160 hardcode
`currency: 'USD'`**, while `@/utils/financialFormatting` and `@/utils/money`
exist. For a multi-entity, multi-currency product this is a correctness bug, not
a style issue: a GBP entity renders as dollars. Replace the local copies, then
add a lint rule to stop new ones.

### UI-07 — States, a11y, responsive

Consistent loading/empty/error states per route group; WCAG 2.2 AA with axe at 0
critical/serious; keyboard paths through grids and modals; 1024×600 minimum.

---

## 3. Correctness and depth track

- **D-01 — Sector depth audit.** 87 TODO/FIXME/placeholder/"coming soon"
  markers across `src/pages`. Triage into: real gap / cosmetic / stale comment.
  Publish the honest per-sector depth table; "all industries" is only true where
  each sector has real drivers, not a renamed generic dashboard.
- **D-02 — Engine reachability.** 182 engines in the manifest, 214 modules on
  disk. Confirm the delta is deliberate (helpers//index) and that reachable
  engines are actually invoked from a route.
- **D-03 — Oracles.** `npm run financial:oracles` must be part of the standard
  gate set, not an optional script.
- **D-04 — Decimal adoption.** Server side is 2/27 modules on decimal.js. Money
  crossing the API boundary in float is a defect; raise the ratchet.

---

## 4. Performance track

- **P-00 — Make the suite runnable here `[blocking]` ✅ DONE.** `npm test`
  requests an 8 GB heap on a 3 GB box. Solved with `scripts/test-sharded.mjs`
  (`npm run test:sharded`, `--shards/--workers/--heap/--only`): 1199 files /
  13,447 tests in ~13 min. Single shard: `node scripts/test-sharded.mjs
  --shards=8 --only=N`.
- **P-01** — Bundle budget: main ≤150 KB gzip, total ≤2 MB (`npm run
  bundle-check`), with 200 lazy routes and heavy vendor chunks already split.
- **P-02** — 100k-row grid at ≥30 fps; 10k-row GL import <30 s; 500-row PDF <3 s.
  Measure before optimising.
- **P-03** — Workers (consolidation, Monte Carlo, formula, export) genuinely
  called from the UI, not just present.
- **P-04** — Render audit on the dashboard and grid paths.

---

## 5. Release-readiness track

- **R-01** — Playwright browsers are not installed in this environment
  (`~/.cache/ms-playwright` empty), so the 11 byte-stable atlas baselines cannot
  be re-verified here. Either install them or mark visual regression as
  CI-only and say so.
- **R-02** — `/visual/atlas` still carries a `REVIEW` disposition in the
  capability matrix, which blocks release. Decide: ship dev-only or remove.
- **R-03** — CI is red for billing reasons (E-005), owner-side. No gate can be
  called green from CI until that clears.
- **R-04** — Keep the maturity ladder honest: routes are `BUILT — TEST
  EVIDENCE`; CONNECTED/GOVERNED/ENTERPRISE-READY stay `UNVERIFIED` until
  evidence exists. Breadth is not validation.

---

## 6. Sequence

1. ~~**P-00**~~ ✅ — suite runs here (`npm run test:sharded`).
2. ~~**UI-01 → UI-02**~~ ✅ — token layer collapsed, then light-first. (Doing
   the restyle first would have meant doing it twice.)
3. **UI-03 ← NEXT** — navigation. Largest jump in usable surface (35 → 200 screens).
4. **UI-06** — money formatting. Correctness, and cheap.
5. **UI-04 / UI-05** — density and per-page consistency, incrementally.
6. **D-01** — sector depth truth table; drives what "all industries" can claim.
7. **P-01…P-04**, then **R-01…R-04**.

## 7. Standing constraints

- The desktop-only `isTauriRuntime()` gate stays (owner decision E-017);
  `src/App.runtime.test.tsx` enforces it. The all-in-one goal does not reopen
  the browser channel.
- No fabricated users, testimonials or usage numbers.
- `index.html` edits require regenerating the CSP hash.
- Every claim in this doc is measured; re-measure rather than trust it if the
  tree has moved.
