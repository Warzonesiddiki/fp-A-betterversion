---
type: worklog
status: current
task: UI-04 / UI-05 / UI-06-completion
---

# UI-04 · UI-05 · UI-06 completion — measured scope

All numbers below are **measured**, not estimated. Scanners: `lightscan2.mjs`
(TypeScript AST, ancestor-aware), `/tmp/census.mjs`, `/tmp/ctx.mjs`.

## Baseline before this work

| Metric | Value |
| --- | --- |
| Suite | 1206 files / 13,495 tests |
| Default theme | `light` (`uiStore.ts:20`) |
| Page modules | 203 |
| Pages using `PageHeader` | **2** |
| Pages using raw `<h1>` | 181, in **21 different class combinations** |
| `useDensity()` consumers | **0** |
| `designTokens.density` consumers | **0** |
| Light-mode contrast bugs (AST-confirmed) | **64 sites / 29 files** |
| Hardcoded `currency: 'USD'` | 116 sites / 65 files |
| Inline `Intl.NumberFormat` | 129 sites |

## The severe finding

Default theme is **light** (`--bg-root: #f8fafc`), but 64 sites render
`text-white` / `text-slate-100` with **no dark backdrop on any ancestor**. Six
of them are page `<h1>` titles. On the default theme these are white-on-white:
literally invisible. `SettingsPage`, `SecuritySettingsPage`,
`BackupRestorePage` and `IntegrationSettingsPage` are the worst — the entire
Settings area was authored dark-only and never revisited when UI-02 flipped the
app to light-first.

This is a regression UI-02 introduced and did not catch, because UI-02 fixed the
*token* layer and these pages bypass tokens with raw Tailwind palette classes.

### Why the first scanner was wrong

A naive `grep text-white` reports 109 sites. That over-reports badly: white text
on `bg-blue-600` or on an inline `style={{background: 'var(--accent-primary)'}}`
is correct. The AST scanner walks the JSX ancestor chain and only reports light
text with **no** dark backdrop above it — 64 sites. Verified by reading a
sample of both the reported and the excluded sites.

## Scope decisions

**UI-06 completion — classify, do not blanket-migrate.** Of the 116 USD
literals, only the *display* ones are bugs. These are legitimate and stay:

- entity/mock **data** defaults (`entities.ts`, `glData.ts`, `users.ts`,
  `generators.ts`, `MasterDataEngine`, `IntercompanyMatchingEngine`)
- form **initial state** (`OnboardingWizard`, `SetupWizardPage`, `HedgeManager`)
- `ConsolidationEngine` — writes the *presentation currency* onto translated
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
  `index.css`. One density contract consumed by AG Grid *and* HTML tables.
  Wire `useDensity()` (currently 0 consumers) end to end and expose the control
  in Settings.
- **B — UI-05 contrast.** Fix all 64 sites. Add a guardrail test so the class of
  bug cannot come back.
- **C — UI-05 headers.** Move pages onto `PageHeader`, collapsing 21 heading
  variants to one.
- **D — UI-06 completion.** Migrate the display formatters; leave data defaults.
