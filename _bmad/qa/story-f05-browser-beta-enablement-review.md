# QA Review — Story F-05: Browser Beta Enablement (hardening slice)

> **Verdict:** PASS (hardening slice) — 2026-08-11 (Quinn)
> **Scope:** F-05 remaining work (Tauri-import hardening, no-op/stub fallbacks, beta smoke test, full beta-mode suite). The beta channel itself remains flag-gated and NOT a supported-runtime claim (A-12 UNVALIDATED).
> **Gate note:** browser-capable visual verification of the beta channel is NOT yet possible in this sandbox (no browser; Playwright CDN TLS-blocked, same as F-02/T-10). This verdict covers structural/behavioral evidence only; the visual runbook check remains listed as open for F-05 final sign-off.

## Acceptance criteria verification (story AC1–AC6)

| AC | Result | Evidence |
|---|---|---|
| AC1 — Tauri runtime renders as today | PASS | `betaMode.app.test.tsx` Tauri-path test: renders with no beta flag, no beta marker; smoke test uses real `<App />`; full root suite (default mode) 1,188 files / 13,372 tests green. |
| AC2 — browser without `VITE_BETA_WEB` keeps the explicit block | PASS | Smoke test: `alert` called, container empty, no `data-beta-web` marker. |
| AC3 — browser WITH `VITE_BETA_WEB=true` renders + honest marker | PASS | Smoke test: no alert, `document.documentElement.dataset.betaWeb === 'true'`, real app shell mounts (`Dashboard` nav). |
| AC4 — gate extracted to pure tested module | PASS | `src/utils/betaMode.ts` 5/5 tests (existing). |
| AC5 — no supported-runtime claim; A-12 stays UNVALIDATED | PASS | Marker + console note; `.env.example` documents the flag as not-a-claim; no README/claim changes. |
| AC6 — typecheck, lint, tests | PASS | Root tsc 0 errors; changed-file ESLint 0 warnings; server tsc 0 errors; targeted suites green. |

## Remaining-work verification (T-01..T-04)

| Item | Result | Evidence |
|---|---|---|
| T-01 audit of 14 `@tauri-apps` import sites | PASS | 7 runtime sites; 7 test/mock/type sites. Import-time probe: all packages import-safe outside Tauri; calls throw (verified in Node + guarded in code). |
| T-02 no-op/stub fallbacks | PASS | `tauriSqlStorage` (lazy import + Tauri gate, non-Tauri no-op — 24 storage tests incl. new no-op contract), `uiStore` (lazy notification import), `useTauriGlobalShortcuts` (lazy plugin import), `DashboardPage` (lazy WebviewWindow), `DependencyGraph` (`.catch` on dynamic import), `CubeEnginePersistence` (in-memory backend fallback, 8 new tests: round-trips cells/dimensions/cubes/history/snapshots + open-failure fallback). |
| T-03 beta smoke test | PASS | `src/utils/betaMode.app.test.tsx` 4/4: blocked / beta render + marker / first-run onboarding / Tauri-without-flag. Also fixed a real marker bug (marker was set on the blocked path; runtime check now per-render). |
| T-04 full suite in beta mode | PASS | `VITE_BETA_WEB=true` full root run: **1,188 files / 13,373 tests, 0 failures** (1 skipped). |

## Regression assessment

- Default-mode full root suite: **1,188 files / 13,372 tests passed, 0 failures** (16 new tests vs. prior baseline).
- Server: default 13 files / 130 tests PASS; native all 15 files / 207 tests PASS (real SQLite); server tsc + build clean.
- Server test-DB litter cleanup verified: 0 leftover `test-finplan-*.db*` after both runs (vitest 4 has no `globalTeardown`; per-file `afterAll` cleanup in `vitest.setup.ts`; native config now uses the same setup).
- Behavior change guard: Tauri paths keep identical semantics (same modules, same calls — now lazy); full default-mode suite proves no Tauri-runtime regression.

## Security review

- No new attack surface: browser mode changes are lazy-import/no-op hardening; nothing new is exposed to a browser client.
- `tauriSqlStorage` no-op contract means a browser can never attempt SQLite plugin calls; masterStorage routes browser mode to sqlJsStorage as before.
- Marker is honest and only present in active beta mode; no unsupported capability claim.

## Accessibility review

- No UI change in this slice (marker is a data attribute on `<html>`); Atlas a11y suite unchanged (448 tests green in default run). Smoke test renders the real app shell.

## Known external blockers (unchanged)

- Browser pixel/visual verification of the beta channel: needs a browser-capable environment (same blocker as F-02/T-10).
- CI cannot run (GitHub billing block E-005); local verification is the evidence basis.
