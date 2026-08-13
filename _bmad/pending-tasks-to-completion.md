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

| Gate            | Command                           | Result                                |
| --------------- | --------------------------------- | ------------------------------------- |
| Types           | `npx tsc --noEmit`                | clean                                 |
| Lint            | `eslint src --max-warnings 0`     | clean                                 |
| Engine manifest | `npm run engines:verify`          | 182 engines, current                  |
| Docs truth      | `npm run docs:verify`             | all measured claims match             |
| Repo hygiene    | `npm run repo:hygiene`            | 2948 tracked files, 0 tracked-ignored |
| Architecture    | `npm run architecture:guardrails` | all pass                              |
| Money ratchet   | `npm run money:adoption`          | holds (209 modules, 0 `toFixed`)      |

**Established (P-00 ✅).** The full suite now runs in this environment via
`npm run test:sharded`: **1204 files, 13,485 tests** (1 skipped), ~13 min across
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
  `--bg-muted` (78 uses) was declared _only_ under
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
   it) and it _conflicts_ with the CSS (radius `xs` 4px vs 2px;
   `--negative:#f43f5e` vs `financial.negative:#dc2626`). Either delete it or
   convert it into the generator for the `@theme` block — do not leave both.

   **Done — deleted, all but one group.** Re-measured: of the 13 token groups,
   the only runtime consumer was `density`, read by `useDensity.ts` for AG
   Grid's numeric `rowHeight`/`headerHeight` (a CSS custom property cannot feed
   a JS API, so this one genuinely belongs in TS). Every other group's sole
   "consumers" were this module's own type aliases — `ChartColor`,
   `SemanticTone`, `SectorKey`, `RadiusKey`, `ZIndexKey`, `FontSizeKey`,
   `BreakpointKey`, all exported, all with **zero** external references.
   `designTokens.ts` is now 49 lines instead of 344, `index.css` is the single
   palette, and the rewritten shape test asserts `Object.keys(designTokens)`
   equals `['density']` and that the serialised object contains no hex or
   `rgb()` literal — mutation-verified by re-adding a `radius` group and
   watching it fail. The third source of truth is gone rather than reconciled.

2. Restate the Tailwind primitives in terms of semantic tokens
   (`--action-primary`, `--surface-panel`, `--text-body`) instead of raw
   `blue-600`/`gray-800`.

   **Done for the six core primitives — `Button`, `Card`, `Input`, `Badge`,
   `Select`, `Alert` (281, 273, 46, 47, 33 and 14 importers).** All raw palette
   utilities and all
   `dark:` variants are gone from them; every colour now comes from a token
   that already flips under `.light`, so one declaration is correct in both
   themes.

   **This surfaced a shipping accessibility defect that the migration would
   otherwise have inherited.** A colour used as _text_ must contrast with the
   page; the same colour used as a _fill behind white text_ must contrast with
   white. Those requirements pull in opposite directions, and the existing
   tokens only satisfied the first. In dark theme, white on `--accent-primary`
   (#0284c7) is **4.10:1** and white on `--negative` (#f43f5e) is **3.67:1** —
   both below AA, both live today via `.btn-primary` / `.btn-danger`. Naively
   swapping `bg-blue-600` (5.17:1) for `--accent-primary` would have _regressed_
   contrast. Four new fill tokens (`--action-fill`, `--action-fill-hover`,
   `--danger-fill`, `--danger-fill-hover`) are defined per theme so white text
   clears AA (≥4.5:1) _and_ the fill stays ≥3:1 against the page (WCAG 1.4.11).
   The badge tints needed the same treatment: `--negative` on `--negative-subtle`
   was 3.95:1 and `--positive` on `--positive-subtle` 4.42:1 in light, so
   `--text-on-{accent,danger,positive}-subtle` pair with each tint. Note the
   dark `-subtle` tokens are translucent, so they must be composited over
   `--bg-surface` before measuring — measuring the raw `rgba()` is meaningless.

   `.btn-primary`/`.btn-danger` were repointed at the fill tokens too. They
   currently have **zero consumers** (the whole `.btn-*` layer is unused), so
   this is a latent-defect fix, not a visible change.

   Guards: `src/theme/buttonContrast.contract.test.ts` (30 tests) parses the
   real `index.css`, resolves `var()` aliases, composites alpha, and asserts
   contrast per theme — mutation-verified 4/4 (reverting `--action-fill` to
   `--accent-primary` fails dark only; the raw-`--negative` badge fails light
   only; a raw utility and a `dark:` variant in a primitive are both caught).
   An eslint `no-restricted-syntax` rule scoped to the migrated files bans
   numbered palette utilities and `dark:`; also mutation-verified, including
   against the two later additions. The scope is deliberately per-file, not all
   of `src/components/ui` — 92 of those files still carry raw utilities, so a
   blanket rule could only land by being disabled everywhere. Widen both lists
   as each file migrates.

   `Select` and `Alert` followed the same pattern. `Alert`'s confirm buttons
   were the exact white-on-fill case already solved (`bg-blue-600`/`bg-red-600`
   → the fill tokens); `Select`'s selected-option row was the tint case
   (`bg-blue-50 text-blue-700` → `--accent-subtle` with its paired
   `--text-on-accent-subtle`), and its `focus:bg-gray-100 dark:focus:bg-gray-800`
   pair collapsed to a single `--bg-hover`.

3. Keep the `.fp-*` classes — they are already token-driven and covered by
   `AtlasFoundations.visual-contract.test.tsx` snapshots.
4. Verified by: extend the visual-contract test with a Button/Card/Input case,
   plus a lint rule banning raw palette utilities in `src/components/ui`.

   **Done — both halves.** Via `buttonContrast.contract.test.ts` and
   the scoped eslint rule described in step 2. The contract test goes beyond
   what was asked: rather than snapshotting class strings (which pin the
   _spelling_ of a class and break on every rename while saying nothing about
   whether the result is readable), it resolves the tokens and checks actual
   WCAG ratios in both themes. `DashboardPage.populated.contract.test.tsx`'s
   DOM baseline was re-recorded — diff is `class=` attributes only, zero
   structural change — and the `Button`/`Badge` unit tests were repointed from
   `bg-blue-600`/`bg-red-100` to the token spellings.

   `AtlasFoundations.visual-contract.test.tsx` gained a
   `UI-01 — migrated primitives` block (5 cases) covering what the file-level
   guards structurally cannot: the classes that actually reach the DOM after
   `cn()`/tailwind-merge resolution. It asserts no rendered variant emits a raw
   palette utility, that fills stay distinct from the text-tuned
   `--accent-primary`, that every filled variant keeps its paired
   `--text-on-accent` foreground, and — the case no class-string test can catch
   — that every `var(--x)` referenced by a rendered primitive is actually
   **declared** in `index.css`. A typo'd token resolves to nothing and renders
   unstyled while a `toContain()` assertion still passes. Mutation-verified 3/3
   (undeclared token; fill reverted to `--accent-primary`; fill stripped of its
   foreground).

   **Remaining for this step:** the other 92 files in `src/components/ui` that
   still use raw palette utilities.

Measured surface: 305 of 490 non-test `.tsx` files use raw `slate-`/`gray-`
utilities; 146 use `dark:`; 247 use `var(--…)`.

### UI-02 — Flip to light-first ✅ DONE

Zoho Books is a light product. FinPlan defaulted to Bloomberg-dark
(`--bg-root:#080c14`). Dark remains available (a genuine strength for a finance
terminal); the default and the polished path are now light.

Shipped: `uiStore` seed `dark`→`light`; the `index.html` bootstrap no longer
falls back to dark (it only opts _in_ to dark, and re-resolves `'system'`
against the OS); `.light` gained overrides for every contrast-sensitive token.
CSP hash updated to `sha256-7Fr6DsWabQ…` and verified against both `index.html`
and `dist/index.html`.

**Two further defects surfaced while doing this, neither previously known:**

- **Persistence was broken end to end.** The bootstrap read
  `localStorage['finplan-theme']`, but _nothing in the codebase ever wrote that
  key_ — the real preference is persisted by `uiStore` into an **encrypted
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

### UI-03 — Navigation and IA `[highest user-visible value]` ✅ DONE

**Was: 160 of 190 in-shell routes unreachable from the navigation UI.**
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

**Outcome.** All five items shipped.

- `src/types/navigation.ts` is now the single generated manifest: **190 items /
  10 sections / grouped subsections**, labels defaulting to `PAGE_HELP` titles.
  `PILLARS` and `LEGACY_NAV_ITEMS` are gone.
- `src/components/layout/Sidebar.tsx` is a Zoho-style single-open accordion rail
  (`APPLICATION SIDEBAR (UI-03)` block in `src/index.css`).
- `AppLayout` derives `commandItems` by flattening the same manifest, so the
  palette went from 15 hardcoded entries to every non-hidden screen and can no
  longer drift from the rail.
- Quick Search (`Sidebar.tsx`) now opens the command palette instead of no-op.
- Contracts: `src/types/navigation.contract.test.ts` (bidirectional
  reachability, 13), `src/hooks/useAppNavigation.test.tsx` (RBAC filtering, 6),
  `src/components/layout/Sidebar.test.tsx` (13), `src/App.routeShell.test.tsx`
  (4). All mutation-tested.

**Dead links found and fixed while wiring the manifest.** The old nav pointed at
two routes that do not exist (`/data/trial-balance`, `/data/import`); the same
non-existent paths had leaked into `GlobalSearchEngine`, two mock-data feeds,
two page buttons and 11 E2E `page.goto` calls, plus `/saas/cohort-analysis` and
`/audit/gdpr-consent`. All corrected, and
**`src/App.deadLinks.contract.test.ts`** now fails the build if any
`navigate()`/`href`/`to`/`actionUrl` literal resolves to a non-route.

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

### UI-06 — Money formatting ✅ SHIPPED

**Was:** 75 modules re-implemented `formatCurrency` locally (the plan's original
count of 72/160 was stale; the measured debt was 75 local copies and 185
hardcoded `currency: 'USD'` sites). The global reporting-currency selector in
`FinancialContextBar` was decorative — selecting GBP changed the dropdown and
nothing else, because every local copy had `currency: 'USD'` baked in. For a
multi-entity product that is a correctness bug, not a style issue.

**Done:**

- Added `useCurrencyFormatter()` (`src/hooks/useCurrencyFormatter.ts`) — the
  single display entry point, bound to `context.currency.code`. Exposes
  `currency` / `currency0` / `compact` / `percent` / `number` / `currencyCode`.
  **Display only:** it never converts. `@/utils/money` (decimal.js) remains the
  arithmetic engine and `FXEngine` still owns conversion.
- Fixed a latent bug in `formatCompact`, which hardcoded `$` even when passed a
  non-USD currency. Added the `currencySymbol()` helper behind it.
- Migrated **70 modules** off local copies (64 by AST codemod, 6 by hand for
  `memo()` wrappers, compact/tick formatters and multi-component files).
- `FinanceCopilotEngine` runs outside React, so it reads the currency
  non-reactively via `getState()` rather than a hook.
- `TranslationResultPage` deliberately keeps its own per-currency formatter: it
  renders source vs target currency side by side, which is not the reporting
  currency. It is exempted explicitly, not by omission.
- Added a `no-restricted-syntax` guard so a new local `formatCurrency` fails
  lint, with the canonical formatter modules exempted.

**Verification:** whole-repo `tsc --noEmit` clean; `eslint src --max-warnings 0`
clean; full 8-shard suite green (**13,495 tests**, up from 13,485). Both the hook
unit tests and the propagation tests are mutation-verified — reverting the hook
to a hardcoded USD fails 3 tests. Bundle 2068.83 KB gzip (marginally smaller).

Two test expectations changed meaning and were updated deliberately: zero now
renders as `—` (the canonical `zeroDisplay`) instead of `$0.00` in
`DrillDownWindowPage` and `LoanAmortizationPage`. `DrillTables` no longer
exports a test-only `formatCurrency`.

**Not yet done (follow-up):** the ~185 hardcoded `currency: 'USD'` occurrences
outside the migrated `formatCurrency` copies — chart tooltips, export builders
and `Intl` calls inline at their use site.

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

  **The gate was only measuring three of its six vendors.** It looked up each
  budgeted chunk and did all its work inside `if (match)`, so any vendor that
  produced no chunk was skipped without a word while the run still reported
  PASS. `vite.config.ts` had no ag-grid rule, so ag-grid sat in an anonymous
  `chunk-*.js` at **298.3KB gzip — the largest artefact in the build, 1.7KB
  under the very limit meant to govern it**, unmeasured. Now named
  (`grid-community-vendor` 284.85KB = 95% of budget, correctly warning;
  `grid-react-vendor` 14.29KB), and a missing chunk is an error, not a skip —
  mutation-verified. `ai-vendor` is exempt by name because
  `@huggingface/transformers` is an intentionally uninstalled optional peer;
  it prints a SKIP line and re-arms automatically if installed.

  **Done — `pdf-vendor` no longer eagerly preloaded. Critical path 483.42 →
  304.23KB gzip (−179.19KB, −37%); 17 → 16 preloaded chunks.** Not jsPDF's
  doing: rolldown's injected preload helper had landed in that chunk, and 11 of
  its 13 importers (entry chunk included) wanted only that ~1KB helper,
  defeating the lazy `loadJsPDF()` design in `utils/pdfRuntime.ts`. Fix is one
  line in `manualChunks` — the helper joins `icon-vendor`, a group that is
  _already_ in the preload set, so it adds no new critical-path bytes:
  `if (id.includes('lucide-react') || id.includes('vite/preload-helper'))`.
  Two dead ends, both re-tested, do not retry: a lone `return 'preload-helper'`
  is re-merged by rolldown (sub-threshold), and naming the _auto-generated_
  `react` chunk is a no-op since no such rule is declared. `output.minChunkSize`
  is rejected by rolldown-vite 8. Total bytes are unchanged (2071.86KB) — this
  is purely a _when-loaded_ win. `pdf-vendor`'s importers fell 13 → 4, and the
  survivors take real jsPDF bindings rather than the helper.
  Regression guard added: `bundle-check.js` now fails if any of
  `pdf-vendor`/`excel-core-vendor`/`grid-community-vendor`/`ai-vendor` appears
  in `index.html`'s modulepreloads. The pre-existing 750KB aggregate critical
  path budget could never have caught this — 483.42KB passed it comfortably —
  so the guard is per-chunk and by name; mutation-verified by reverting the
  one-line fix (aggregate still PASS, named guard FAIL).

  Still open here: total JS is at 92.2% of limit (2071.86 / 2248KB) and
  `grid-community-vendor` at 95.0% — both warn, neither fails.

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
3. ~~**UI-03**~~ ✅ — navigation. Usable surface went 30 → 190 screens.
4. ~~**UI-06**~~ ✅ — money display now follows the reporting-currency selector.
5. **UI-04 / UI-05 ← NEXT** — density and per-page consistency, incrementally.
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
