---
type: worklog
status: current
task: UI-04 / UI-05 / UI-06-completion
---

# UI-04 · UI-05 · UI-06 completion — measured scope

All numbers below are **measured**, not estimated. Scanners: `lightscan2.mjs`
(TypeScript AST, ancestor-aware), `/tmp/census.mjs`, `/tmp/ctx.mjs`.

## Baseline before this work

| Metric                                   | Value                                       |
| ---------------------------------------- | ------------------------------------------- |
| Suite                                    | 1206 files / 13,495 tests                   |
| Default theme                            | `light` (`uiStore.ts:20`)                   |
| Page modules                             | 203                                         |
| Pages using `PageHeader`                 | **2**                                       |
| Pages using raw `<h1>`                   | 181, in **21 different class combinations** |
| `useDensity()` consumers                 | **0**                                       |
| `designTokens.density` consumers         | **0**                                       |
| Light-mode contrast bugs (AST-confirmed) | **64 sites / 29 files**                     |
| Hardcoded `currency: 'USD'`              | 116 sites / 65 files                        |
| Inline `Intl.NumberFormat`               | 129 sites                                   |

## The severe finding

Default theme is **light** (`--bg-root: #f8fafc`), but 64 sites render
`text-white` / `text-slate-100` with **no dark backdrop on any ancestor**. Six
of them are page `<h1>` titles. On the default theme these are white-on-white:
literally invisible. `SettingsPage`, `SecuritySettingsPage`,
`BackupRestorePage` and `IntegrationSettingsPage` are the worst — the entire
Settings area was authored dark-only and never revisited when UI-02 flipped the
app to light-first.

This is a regression UI-02 introduced and did not catch, because UI-02 fixed the
_token_ layer and these pages bypass tokens with raw Tailwind palette classes.

### Why the first scanner was wrong

A naive `grep text-white` reports 109 sites. That over-reports badly: white text
on `bg-blue-600` or on an inline `style={{background: 'var(--accent-primary)'}}`
is correct. The AST scanner walks the JSX ancestor chain and only reports light
text with **no** dark backdrop above it — 64 sites. Verified by reading a
sample of both the reported and the excluded sites.

## Scope decisions

**UI-06 completion — classify, do not blanket-migrate.** Of the 116 USD
literals, only the _display_ ones are bugs. These are legitimate and stay:

- entity/mock **data** defaults (`entities.ts`, `glData.ts`, `users.ts`,
  `generators.ts`, `MasterDataEngine`, `IntercompanyMatchingEngine`)
- form **initial state** (`OnboardingWizard`, `SetupWizardPage`, `HedgeManager`)
- `ConsolidationEngine` — writes the _presentation currency_ onto translated
  records; that is FX output, not display
- `TranslationResultPage` — renders source vs target side by side (already
  exempted in UI-06)

**UI-05 oversized pages.** The plan itself scopes extraction of the 89
over-300-line pages as incremental ("as each page is touched — not as a separate
sweep"). Rewriting 89 pages blind would be churn with high regression risk and
no user-visible gain. Header/structure consistency and contrast correctness are
the user-visible parts and are done in full here.

## Plan

- **A — UI-04 foundation.** Type scale + line-height + tabular-figure tokens in
  `index.css`. One density contract consumed by AG Grid _and_ HTML tables.
  Wire `useDensity()` (currently 0 consumers) end to end and expose the control
  in Settings.
- **B — UI-05 contrast.** Fix all 64 sites. Add a guardrail test so the class of
  bug cannot come back.
- **C — UI-05 headers.** Move pages onto `PageHeader`, collapsing 21 heading
  variants to one.
- **D — UI-06 completion.** Migrate the display formatters; leave data defaults.

## D — UI-06 completion: outcome

**Status: shipped.** 80 of the 81 hardcoded-USD _display_ sites now render in the
reporting currency. The one exclusion is `ui/CurrencyInput.tsx:81`, where the
currency is already a component prop.

### What was added

- `currencyFormatter(currency, options?)` in `utils/financialFormatting.ts` — a
  faithful `Intl` wrapper returning a `(value) => string` callable, so a call
  site changes currency only, never formatting. `CurrencyFormatOptions =
{ decimals?, minDecimals?, maxDecimals?, compact?, signDisplay?, locale? }`.
- `useCurrencyFormatter().custom(options?)` — the same factory bound to the
  reporting currency, memoised per option shape.
- `reportingCurrency()` in `store/financialContextStore.ts` — a non-reactive
  read for engines and other non-React modules only.

### How the 81 sites were treated

The bucket was not homogeneous; it split three ways and each needed a different
fix.

1. **41 sites in 22 files, already inside a component or hook** — rewritten to
   `fmtCurrency.custom(opts)(x)` with the hook declared in the component body.
2. **6 non-React `.ts` engines/utils** (`AutoCommentaryEngine`, `NLQEngine`,
   `ReportLayoutEngine`, `SensitivityTableEngine`, `ui/columnDefs`,
   `scenarioUtils`) and the `.tsx` module-scope _helper functions_ — these run
   per call, so `currencyFormatter(reportingCurrency(), …)` reads fresh each
   time and is safe.
3. **7 pages with module-scope `Column[]` arrays** (`BondPortfolioPage`,
   `CreditRiskPage`, `HealthcareDashboardPage`, `PropertyPortfolioPage`,
   `RealEstateDashboardPage`, `ValuationPage`, `StorePerformancePage`) — these
   could **not** use a non-reactive read. `DataTable` is `memo(...)`
   (`ui/DataTable.tsx:42`), so a module-scope `getState()` call would render
   stale currency after a switch. Each array moved inside its component as
   `useMemo<Column[]>(… , [fmtCurrency])`.

`ReconciliationResults.tsx` held two module-scope _stored_ formatter constants
rather than inline calls; both became `custom()` calls inside the component.

### Correctness notes worth keeping

- **Never force fraction digits onto a site that had none.** Bare `Intl` is
  equivalent to `min2/max2` for USD/EUR/GBP/INR but **not for JPY**, which has
  zero decimals. The option mapper preserves absence.
- **A render-path memo cache must live in a `useRef`, not a `useMemo`.** The
  first `custom()` implementation mutated a memoised `Map`, which violates
  `react-hooks/immutability` and is unsafe under concurrent rendering. It now
  holds `{ currency, formatters }` and self-invalidates when the currency
  changes.
- **Stale dep arrays are real bugs here**, not lint noise: a `useMemo` that
  builds column definitions but omits `fmtCurrency` freezes the rendered
  currency. Four were found and fixed (`CommentaryTemplate`, `DataGrid`,
  `FinPlanGrid`, `SpreadsheetGrid`).

### Verification

`rules-of-hooks` 0 · `tsc --noEmit` clean · `eslint src --max-warnings 0` clean ·
**13,564 tests passing across all 8 shards, 0 failing** (baseline 13,495) ·
architecture guardrails 21/21 · production build succeeds.

Remaining `currency: 'USD'` occurrences in `src/` are test fixtures, seeded
mock-data records, and the documented exempt formatter modules — all _data_, not
display.

## C — UI-05 headers: outcome

**Status: complete (177 of 183 heading-bearing pages).** Pages on the canonical
`PageHeader` went from **2 to 177**. The 8 raw `<h1>`s that remain are a
deliberate exclusion, listed below.

### What changed

A codemod converted the mechanical cases: a raw `<h1>`, an optional sibling
`<p>` description, and an optional actions cluster, collapsing to
`<PageHeader title purpose actions />`. The heading scale landed earlier in
UI-04, so `PageHeader` was already the visually correct choice; this makes it
the structurally correct one too.

Migration happened in four passes:

| Pass                                 |  Pages |
| ------------------------------------ | -----: |
| bulk codemod over `src/pages`        |     48 |
| span mode (headings inside `<main>`) |      7 |
| hand-migrated refusals               |     12 |
| **total**                            | **67** |

**Span mode** was the significant fix. The codemod originally refused any
heading whose wrapper was `<main>`, `CardContent`, or otherwise not a plain
layout `<div>`, because collapsing the wrapper would destroy page structure.
That was the right instinct with the wrong remedy: those wrappers never needed
deleting. Span mode replaces only the `<h1>`+`<p>` run in place and leaves the
wrapper untouched, which converted the whole `src/pages/sector/*` group safely.

Two new `PageHeader` props came out of this work:

- **`titleId`** — all 20 pages whose `<h1>` carried an `id` used that id as an
  `aria-labelledby` target elsewhere in the same file. `PageHeader` spreads
  `...props` onto its root `<header>`, so forwarding `id` through the spread
  would have relabelled the referencing region with the header's entire subtree
  instead of its title. `titleId` puts the id on the heading specifically.
- **`icon`** — rendered `aria-hidden` inside the `<h1>`, so decorative glyphs
  stay out of the accessible name.

Both are regression-tested in `PageHeader.test.tsx` (5 tests).

### What was deliberately left alone

**Eight centred card layouts** keep their raw `<h1>`. `PageHeader` is a
left-aligned flex row; forcing it into a centred auth card or error state would
change the visual design, not just the markup:

| Page                                    | Headings |
| --------------------------------------- | -------: |
| `auth/LoginPage`                        |        2 |
| `auth/ForgotPasswordPage`               |        2 |
| `auth/RegisterPage`                     |        1 |
| `auth/OnboardingWizard`                 |        1 |
| `NotFoundPage` (display 404)            |        1 |
| `templates/TemplatePreviewPage` (error) |        1 |

`reports/ReportDesignerPage` is a related case: it is a full-bleed editor whose
toolbar is a control strip rather than a page header, so it got an `sr-only`
`<h1>` instead — it previously had no heading at all, which was a genuine
defect.

An early version of the codemod silently dropped a wrapper's
`text-sm text-slate-400` when it hoisted children into `actions`. The guard now
requires a collapsed wrapper's classes to be purely layout (`flex`, `gap-*`,
`items-*`, `justify-*`, margins) before discarding them, and that guard was not
relaxed to raise the conversion count. Product-tour anchor classes
(`.loan-loss-header`, `.acl-metrics`) were preserved for the same reason: they
are `runTour()` selectors whose removal breaks the tour with no test failure.

### A real accessibility defect this surfaced

`PageHeader` rendered a bare `<header>`, which maps to the **`banner`**
landmark. A banner must be top-level, but this header always renders inside page
content — `AppLayout` already owns the real `<main>`, and 55 pages additionally
set `role="main"` on their own wrapper. Every page using `PageHeader` was
therefore emitting a nested-landmark violation; with only 2 adopters it had gone
unnoticed, and rolling out to 116 turned it into a visible test failure
(`landmark-banner-is-top-level`).

Fixed at the source by giving the element an explicit `role="group"` plus an
`aria-label` from the title, which keeps it semantic without claiming a landmark
it is not. Three stored DOM baselines were updated; the diffs contain only the
two new attributes.

### Verification

`tsc --noEmit` clean · `eslint src --max-warnings 0` clean · **13,567 tests
passing / 0 failing** (1207 files; baseline 13,564 plus the 3 new `PageHeader`
tests) · `AtlasFoundations.visual-contract` and `AtlasVisualBaselinePage` both
green.
