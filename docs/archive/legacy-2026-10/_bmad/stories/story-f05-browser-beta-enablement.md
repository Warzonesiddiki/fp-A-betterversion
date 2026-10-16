# Story F-05: Browser Beta Enablement (solo-dev validation loop enabler)

> **File history:** created 2026-08-11 following the solo-dev evidence re-baseline (owner direction).

## Status: SUPERSEDED 2026-08-12 (owner decision — desktop-only product): the browser beta channel was removed from the codebase (ledger #28, evidence E-017; see the QA-review addendum). Historical status (2026-08-11): IN PROGRESS — remaining work (Tauri-import hardening + beta smoke test + full beta-mode suite) COMPLETE; QA review recorded (`_bmad/qa/story-f05-browser-beta-enablement-review.md`). The story was DONE as of PR #55; browser-capable visual verification of the beta channel is now moot (channel removed).

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

## Remaining work (deeper hardening) — COMPLETE 2026-08-11

1. Audit of the 14 `@tauri-apps` import sites — DONE (7 runtime sites; 7 test/mock/type sites). Probe verified all `@tauri-apps` packages are import-safe but call-unsafe outside Tauri.
2. No-op/stub fallbacks — DONE:
   - `tauriSqlStorage`: lazy `import('@tauri-apps/plugin-sql')` + Tauri-gate on every `getDb()`; non-Tauri = deterministic no-op (never touches the plugin).
   - `uiStore`: notification plugin now lazy-imported only inside the Tauri-guarded branch; `isTauriRuntime()` from betaMode replaces the static `@tauri-apps/api/core` import.
   - `useTauriGlobalShortcuts`: plugin lazy-imported inside the effect; cleanup resolves via the same import.
   - `DashboardPage`: `WebviewWindow` lazy-imported inside the Tauri-guarded branch.
   - `DependencyGraph`: module-level dynamic import now has `.catch` (no unhandled rejection in browser).
   - `CubeEnginePersistence`: new in-memory backend fallback when IndexedDB is unavailable (jsdom/private mode/open failure) — browser beta never crashes on `indexedDB`.
   - `useTauriMenu`: audit confirmed already guarded (dynamic imports + try/catch); unchanged.
3. Beta smoke test — DONE: `src/utils/betaMode.app.test.tsx` renders the REAL `<App />` in jsdom (blocked path, beta path, onboarding path, Tauri path). Also fixed a real marker bug: `data-beta-web` is now set ONLY when the app actually renders in beta mode (was set on the blocked path), and the runtime check is per-render (`isTauriRuntime`) instead of a module-load const.
4. Full suite in beta mode — DONE: `VITE_BETA_WEB=true` full root run, 1,188 files / 13,373 tests, 0 failures.

## Definition of Done

- [x] All ACs verified; targeted tests pass; tsc + lint clean (root + server).
- [x] QA review records explicit verdict (`_bmad/qa/story-f05-browser-beta-enablement-review.md`).
- [ ] project-context updated; ledger entry appended (done in PR — `_bmad/project-context.md`, ledger #24).
