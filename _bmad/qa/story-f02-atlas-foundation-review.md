# QA Review — Story F-02: Complete FinPlan Atlas Foundation Contract

> **Verdict:** REJECTED — REQUIRES COMPLETION

## Automated checks

| Check | Result | Evidence |
|---|---|---|
| Changed-file lint | PASS | ESLint on Atlas components and Dashboard, zero warnings |
| Type-check | PASS | `tsc --noEmit`, zero errors |
| Unit / interaction tests | PASS | 4 files, 16 tests: status badge, page header, workspace empty state, dashboard |
| Diff hygiene | PASS | `git diff --check` |
| Structural visual contract baseline | PASS (interim) | Deterministic Vitest DOM/class snapshot covers PageHeader, FinancialStatusBadge, FinancialWorkspaceEmptyState hierarchy and trust semantics; it does not validate rendered pixels | 
| Browser screenshot baseline | BLOCKED / NOT IMPLEMENTED | Playwright Chromium download failed with TLS connection resets from both default CDN and Azure Edge mirror; no approved pixel screenshot baseline exists |
| Canonical Dashboard automated accessibility audit | PASS | `jest-axe` run on the finance-workspace setup state; no violations |

## Acceptance criteria verification

- [x] Atlas token/component contract is documented and CSS primitives exist.
- [x] PageHeader, FinancialStatusBadge, and FinancialWorkspaceEmptyState are exported and have targeted interaction/accessibility coverage.
- [x] Dashboard uses applicable foundations without claiming local workspace data is certified.
- [x] Statuses are textual/non-color-only and reduced-motion CSS exists.
- [x] Canonical Dashboard setup state has no automated `jest-axe` violations.
- [x] No materiality, connector, or workflow policy was hard-coded.
- [x] Changed-file lint, typecheck, and targeted tests pass.

## Rejection reason

An interim deterministic DOM/class snapshot baseline now protects Atlas hierarchy and trust-state markup. The Atlas component certification contract still requires browser screenshot/visual-diff evidence for pixels, fonts, responsive layout, and theme rendering. Passing structural snapshot, unit/type/lint/a11y checks is insufficient to declare the visual foundation complete.

## Required follow-up

1. Make a Playwright Chromium browser available in the validation environment (the attempted download failed with TLS connection resets), then follow `docs/design/VISUAL_REGRESSION_RUNBOOK.md` to establish deterministic Atlas snapshots for shared components and Dashboard empty/populated states.
2. Re-run this QA review. Until then, Story F-02 remains IN PROGRESS.

## Environment re-attempt log

- **2026-08-10 (new session, after merge):** Playwright Chromium install re-attempted per the runbook (`node node_modules/@playwright/test/cli.js install chromium`). Download still fails with TLS `ECONNRESET` / `SSL_ERROR_SYSCALL` against `cdn.playwright.dev`, `playwright.azureedge.net`, and `cdn.npmmirror.com`; no system Chromium binary is present and no package-manager install is permitted in this sandbox. The browser pixel baseline therefore remains **BLOCKED / NOT IMPLEMENTED**.
- **2026-08-10 (second sandbox, BMAD rebaseline session):** re-attempted `node node_modules/@playwright/test/cli.js install chromium` — identical TLS `ECONNRESET` against `cdn.playwright.dev`. No system browser; no apt access. Pixel baseline remains **BLOCKED**.
- Verdict unchanged: **REJECTED — REQUIRES COMPLETION** until the visual-regression runbook is executed in a browser-capable environment.

## Interim evidence extension — populated Dashboard baseline (2026-08-10, same session)

Extends the interim structural baseline (still DOM/class only; pixels, fonts, theme, and responsive layout remain unverified and are NOT claimed):

- New deterministic structural baseline for the **populated** Dashboard state: `src/pages/DashboardPage.populated.contract.test.tsx` + `src/pages/__snapshots__/DashboardPage.populated.contract.test.tsx.snap`. Seeded fixture entries (fixed periods, no dates/random) preserve the truth-state markup (`data-financial-status="draft"`, role="status", text "Draft — Local workspace data"), the h1 page header, and the KPI/h2-section hierarchy.
- The new baseline immediately surfaced a real accessibility defect: the populated Dashboard skipped heading levels (h1 → h3). Fixed page-scoped, without broad repaint:
  - `DashboardPage.tsx` section headings (Budget Status, Key Ratios, Recent Activity, Sector KPIs) changed h3 → h2.
  - `ChartWrapper` gained a backward-compatible `headingLevel` prop (default `h3`; Dashboard passes `h2`), covered by new unit tests.
- `jest-axe` now passes on the populated Dashboard state (was previously only covered for the setup/empty state).
- Verification: targeted suite 7 files / 44 tests pass; root `tsc --noEmit` 0 errors; changed-file ESLint 0 warnings/errors; `git diff --check` clean.

This extension does NOT close the pixel-baseline rejection reason. It strengthens the interim signal only.

## Stale-test reconciliation (2026-08-10, same session)

The first full-suite run on merged main surfaced two tests asserting the pre-merge Dashboard empty state ("Welcome to FinPlan Pro"). Verified pre-existing on clean merged main via a temporary worktree at HEAD (not caused by this session's changes):

- `src/pages/dashboard/DashboardPage.test.tsx` — "displays the welcome message when no data exists"
- `src/pages/smoke.test.tsx` — "Page Smoke Tests > DashboardPage > displays the welcome message when no data exists"

Both updated to assert the merged `FinancialWorkspaceEmptyState` heading ("Set up your finance workspace") and renamed truthfully. Full-suite status after the fix is recorded in the QA log of the final verification run.

## Security / regression review

No new authorization, financial calculation, or external-data behavior was added. Dashboard explicitly labels populated data as local workspace draft state, reducing the risk of false authority claims. The heading-level change is presentational/semantic only; no route, store, engine, or calculation behavior changed.