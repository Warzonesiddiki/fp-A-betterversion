# Story F-05: Browser Beta Enablement (solo-dev validation loop enabler)

> **File history:** created 2026-08-11 following the solo-dev evidence re-baseline (owner direction).

## Status: IN PROGRESS — AC1-AC6 implemented and verified 2026-08-11 (flag-gated browser entry, betaMode unit tests 5/5, lint/tsc clean, full-suite verification); deeper Tauri-import hardening pending (see Remaining work)
## Size: M | Risk: MEDIUM

## Why This Story Exists
The solo-dev evidence strategy (validation-plan v2.2 Tier 2: BETA-USAGE) requires a public beta, which requires browser rendering. `src/App.tsx` currently hard-blocks all non-Tauri runtimes. This story makes browser access possible **only when explicitly enabled** (`VITE_BETA_WEB=true`), preserving the Tauri-first default and the honest "browser/PWA is a target, not a verified capability" stance (A-12).

## Research Context
- Owner direction 2026-08-11 (solo development): enterprise participants unavailable; validation moves to product-led beta evidence (`_bmad/research/owner-direction-record-2026-08-11-solo-dev.md`; `_bmad/research/validation-plan.md` §Solo-dev evidence strategy).
- A-12 (Browser/PWA required for commercial success) remains UNVALIDATED; this story does NOT validate it — it only enables a beta channel to collect evidence.
- Existing Tauri-API usage is mostly guarded already (DashboardPage WebviewWindow try/catch → modal; useTauriMenu dynamic import).

## Dependencies
- Requires: solo-dev re-baseline (done, `52f8b18`).
- Files to modify: `src/App.tsx`, `src/utils/betaMode.ts` (new), `src/utils/betaMode.test.ts` (new), `src/vite-env.d.ts`.
- Depended on by: public beta launch; P-track re-scoped to public-beta segment selection.

## Acceptance Criteria
- [ ] AC1: In a Tauri runtime, the app renders as today (no behavior change).
- [ ] AC2: In a browser without `VITE_BETA_WEB=true`, the app keeps the existing explicit block (no silent broadening).
- [ ] AC3: In a browser WITH `VITE_BETA_WEB=true`, the app renders instead of blocking, with a visible/honest marker that this is beta web mode (data attribute + console note).
- [ ] AC4: The gate decision is extracted into a pure, unit-tested module (`src/utils/betaMode.ts`).
- [ ] AC5: No claim that browser/PWA is a supported product capability; A-12 stays UNVALIDATED.
- [ ] AC6: Typecheck, lint, targeted tests pass.

## Implementation Context
- `isTauriRuntime()` = `typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window`.
- `isBrowserBetaAllowed(env)` = `env.VITE_BETA_WEB === 'true' || env.VITE_BETA_WEB === '1'`.
- App gate: `if (!isTauriRuntime() && !isBrowserBetaAllowed(import.meta.env)) { block }`.
- Render marker: `<div id="beta-web" data-beta-web="true" />` is unnecessary — instead set `document.documentElement.dataset.betaWeb = 'true'` + `console.info` in a guarded effect; simpler: a one-line `data-beta-web` on the root wrapper is fine. Keep minimal.

## Out of Scope
- Claiming browser/PWA as supported; fixing every Tauri-API call site (remaining work below); responsive/mobile parity; production deployment; connector/vertical selection.

## Remaining work (deeper hardening — next slice)
1. Audit the 14 `@tauri-apps` import sites for unguarded import-time or call-time usage in browser mode (tauriSqlStorage, CubeEnginePersistence, uiStore, useTauriGlobalShortcuts, DependencyGraph).
2. Provide no-op/stub fallbacks for storage + global shortcuts in browser mode.
3. Add a beta smoke test (renders App with flag in jsdom; Tauri gate bypassed).
4. Run full suite in beta mode.

## Definition of Done
- [ ] All ACs verified; targeted tests pass; tsc + lint clean.
- [ ] QA review records explicit verdict.
- [ ] project-context updated; ledger entry appended.
