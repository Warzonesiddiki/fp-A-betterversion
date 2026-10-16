# QA Review — Story F-02: Complete FinPlan Atlas Foundation Contract

> **Verdict:** APPROVED (2026-08-12) — pixel baseline executed in a real browser; all acceptance criteria verified.
> Prior verdict (2026-08-10 … 08-11): REJECTED — REQUIRES COMPLETION (pixel baseline). Rejection lifted below.

## Automated checks

| Check                                             | Result                | Evidence                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Changed-file lint                                 | PASS                  | ESLint on Atlas components and Dashboard, zero warnings                                                                                                                                                                                                                                                                                             |
| Type-check                                        | PASS                  | `tsc --noEmit`, zero errors                                                                                                                                                                                                                                                                                                                         |
| Unit / interaction tests                          | PASS                  | 4 files, 16 tests: status badge, page header, workspace empty state, dashboard                                                                                                                                                                                                                                                                      |
| Diff hygiene                                      | PASS                  | `git diff --check`                                                                                                                                                                                                                                                                                                                                  |
| Structural visual contract baseline               | PASS                  | Deterministic Vitest DOM/class snapshot covers PageHeader, FinancialStatusBadge, FinancialWorkspaceEmptyState hierarchy and trust semantics                                                                                                                                                                                                         |
| Browser screenshot baseline                       | **PASS (2026-08-12)** | Playwright Chromium ran `tests/e2e/atlas-visual.spec.ts` — **5/5 tests**, 11 deterministic PNG baselines committed (badge dark/light; PageHeader wide/compact; empty-state dark/light; Dashboard empty 1440/390; Dashboard populated 1440+1024 dark + 1440 light). Re-run produces byte-identical images (md5-stable). See completion record below. |
| Canonical Dashboard automated accessibility audit | PASS                  | `jest-axe` run on the finance-workspace setup state; no violations                                                                                                                                                                                                                                                                                  |

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

## Required follow-up (RESOLVED 2026-08-12)

1. ~~Make a Playwright Chromium browser available in the validation environment~~ — **RESOLVED**: this environment has a working browser; the runbook was executed and the baselines established (see completion record below).
2. ~~Re-run this QA review~~ — **DONE**: verdict flipped to APPROVED below.

## Browser pixel baseline — COMPLETION RECORD (2026-08-12)

Executed `docs/design/VISUAL_REGRESSION_RUNBOOK.md` in a real Chromium browser:

- **Spec:** `tests/e2e/atlas-visual.spec.ts` — 5 scenarios / 5 passed:
  1. FinancialStatusBadge — all ten lifecycle states, dark + light.
  2. PageHeader — full anatomy + minimal variant, wide (1440) + compact (390).
  3. FinancialWorkspaceEmptyState — canonical setup state, dark + light.
  4. Dashboard empty workspace — 1440px desktop + 390px compact.
  5. Dashboard populated workspace — Draft trust status visible, 1440px + 1024px (dark) and 1440px (light).
- **Baselines:** 11 PNGs in `tests/e2e/atlas-visual.spec.ts-snapshots/` (chromium-linux). Determinism verified: re-run yields **byte-identical** images (md5 match) — fixed viewport, UTC timezone, en-US locale, reduced-motion + animation kill-switch, fixed fixture data.
- **Populated state seeding:** restored through the app's OWN canonical backup path (`BackupRestore`, SHA-256-verified JSON) — never by patching component internals. This surfaced and pinned the P0 hydration defect (ledger #32): the restored dashboard initially rendered EMPTY because `masterStorage.getItem` returned a plaintext string zustand persist v5 never parses. After the fix, the populated baselines were re-established on the CORRECT render and the assertions (Executive Dashboard heading, Draft status in main, Total Revenue KPI) hold.
- **Harness:** dev-only `/visual/atlas` route (`src/pages/visual/AtlasVisualBaselinePage.tsx`, 4 unit tests) — not linked from navigation; fixed fixtures only.
- **CSP:** `'wasm-unsafe-eval'` added to `index.html` script-src (documented in `docs/architecture/security.md`) for the browser SQL.js storage fallback used by the test baseline — permits WASM compilation only, never JS eval.
- **Spec fixes on first run (self-inflicted, not product defects):** `getByLabelText` (Testing Library API) → Playwright `getByLabel`; unstrict `getByRole('status')` (4 matches incl. toast container) → scoped `getByRole('main').getByRole('status', { name: /Draft/ })`.
- **Review checklist (runbook):** status text/icon/pattern never color-only (role=status + data-financial-status asserted); authority/freshness visible; page title/purpose/action hierarchy intact; empty state actionable, not error-like; compact layouts do not clip actions/status/steps; dark/light contrast rendered and captured.

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

## Interim evidence extension — FinancialContextBar baseline (2026-08-10, later same session)

- `AtlasFoundations.visual-contract.test.tsx` extended with two new snapshot/structural cases: the **financial context bar hierarchy** (Scope → Time → Version → Currency → Freshness with sr-only labels, native selects, and the `Draft — Local workspace data` truth badge) inside the canonical page shell, and the **freshness/trust text semantics** when no sync state exists.
- New explicit structural assertions: trust state carries `data-financial-status`, `role="status"`, the `fp-financial-status--draft` class, text label + detail, and a consequence-bearing `aria-label` — i.e., state is never color-only at the DOM contract level.
- Verification: Atlas structural suite now 4 tests; full root suite **1,184 files / 13,333 tests passed** (1 skipped); root + server `tsc` 0 errors; changed-file ESLint 0 warnings; `git diff --check` clean.
- This extension also does NOT close the pixel-baseline rejection reason (theme contrast, fonts, and responsive layout still require a browser).

## Interim evidence extension — reduced-motion contract (2026-08-11)

- `AtlasFoundations.visual-contract.test.tsx` now 9 tests: added a structural contract asserting the global stylesheet carries `@media (prefers-reduced-motion: reduce)` blocks that override `animation-duration` and `transition-duration` (runbook review-checklist item, structural proxy for browser-level motion behavior).
- Verification: Atlas suite 9/9; lint clean. Pixel/animation-timing baselines still require a browser.

## Interim evidence extension — theme-token contract (2026-08-11)

- `AtlasFoundations.visual-contract.test.tsx` now 11 tests: dark/light theme blocks both define the core Atlas tokens (`--bg-root`, `--bg-surface`, `--text-primary`), and the financial state tokens are asserted **theme-invariant by design** (single `:root` source consumed by `.fp-financial-status--*` classes; no `.light` duplication) — the design decision is now locked by contract so a future change cannot silently split the palettes.
- Light-theme contrast verification remains a browser-pixel-baseline item (blocked).
- Verification: Atlas suite 11/11; lint clean.

## Interim evidence extension — full status set + PageHeader anatomy (2026-08-10, later same session)

- `AtlasFoundations.visual-contract.test.tsx` extended to 8 tests (runbook scenarios 1–2, structural equivalents):
  - **All ten `FinancialStatusBadge` lifecycle states** render with a non-empty text label, a non-colour icon/pattern (`[aria-hidden="true"]`), `role="status"`, a stable `data-financial-status` attribute, and the `fp-financial-status--{state}` class — i.e., no state is colour-only at the DOM contract level. A deterministic snapshot pins the canonical badge set in fixed order.
  - **PageHeader full anatomy** (title `h1.fp-page-header__title`, purpose, status, actions) and **minimal variant** (title only; purpose/actions containers omitted) are pinned by assertions and a snapshot.
- Verification: Atlas structural suite 8 tests passed; root `tsc --noEmit` 0 errors; changed-file ESLint 0 warnings; docs-link strict check clean (0 broken links/citations repo-wide); production build + bundle check green.
- Still does NOT close the pixel-baseline rejection reason (theme contrast, fonts, responsive layout require a browser).

## Stale-test reconciliation (2026-08-10, same session)

The first full-suite run on merged main surfaced two tests asserting the pre-merge Dashboard empty state ("Welcome to FinPlan Pro"). Verified pre-existing on clean merged main via a temporary worktree at HEAD (not caused by this session's changes):

- `src/pages/dashboard/DashboardPage.test.tsx` — "displays the welcome message when no data exists"
- `src/pages/smoke.test.tsx` — "Page Smoke Tests > DashboardPage > displays the welcome message when no data exists"

Both updated to assert the merged `FinancialWorkspaceEmptyState` heading ("Set up your finance workspace") and renamed truthfully. Full-suite status after the fix is recorded in the QA log of the final verification run.

## Security / regression review

No new authorization, financial calculation, or external-data behavior was added. Dashboard explicitly labels populated data as local workspace draft state, reducing the risk of false authority claims. The heading-level change is presentational/semantic only; no route, store, engine, or calculation behavior changed.
