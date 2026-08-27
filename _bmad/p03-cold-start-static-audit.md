# P-03a · Cold-Start Static Audit (dist/ + entry chain)

> **Task:** `01a02fa7-6f04-7a82-bfda-e999fb6d1308` (P-03a) · **Author:** Pulse (performance engineer, team fpa) · **Date:** 2026-08-23
> **Method:** READ-ONLY static analysis of existing artifacts. **Zero builds, zero tests, zero code edits** were performed (Amelia holds the build lane concurrently). Every empirical number below was re-witnessed in a consolidated final pass (see §Appendix A). No commits/pushes made.
> **Honest labeling (D-007):** all timings are **ESTIMATES with shown derivation** (§7). No profiler ran. Where static analysis cannot determine root cause, the limit is stated explicitly (F-01).

---

## 1. Executive summary

The app boots through a **single 386 KB raw / 91.7 KB brotli entry chunk plus 19 statically-preloaded chunks totaling 805.4 KB raw / 203.9 KB brotli**, plus one render-blocking stylesheet (201.5 KB raw / 23.7 KB br). Total compressed critical-boot payload ≈ **320 KB br**.

Headline findings:

1. **chart-vendor (all of Recharts, 466.4 KB raw / 107 KB br) is a hard _static_ dependency of the entry chunk** — it is `<link rel="modulepreload">`-ed from `dist/index.html` and imported by an ESM `import{…}from"./chart-vendor-…js"` statement inside the entry itself. A full source-level BFS of the eager closure found **no** eager importer of Recharts, so the edge is produced at the bundler layer (mechanism documented in F-01; naming the exact symbol requires one instrumented build, which was out of scope).
2. **Sentry costs nothing in this dist build** — `import * as Sentry` is static in `src/main.tsx:3`, but the build-time-unset `VITE_SENTRY_DSN` let dead-code elimination tree-shake the entire SDK out of the bundle (**0** case-insensitive `sentry` matches in the entry chunk). This is a _conditional_ future risk, not a current cost (F-02).
3. **The service worker precaches the boot path but excludes the three biggest lazy vendors** (excel-core 195.2 KB br, grid-community 168.6 KB br, pdf-vendor 148.7 KB br — 512.5 KB br combined). First offline use of any grid/excel/pdf feature fails; first _online_ repeat use refetches them (F-04).
4. **Virtualization exists only via AG Grid** (3 wrapper components); `react-window` has **0** imports project-wide despite the stack docs, so every non-grid long list renders unvirtualized (F-06).
5. **Zustand selector discipline:** `useShallow` is used **0** times across `src/` while 28+ stores exist; grid wrappers ship unmemoized (F-05).

Estimated cold-start TTI on a mid-tier desktop: **≈ 1.3–2.3 s** (derivation §7; labeled ESTIMATE).

---

## 2. Boot-path inventory (existing dist/, measured 2026-08-23)

### 2.1 Documents

| Artifact                                                               | Raw                                     | Brotli  | Witness                         |
| ---------------------------------------------------------------------- | --------------------------------------- | ------- | ------------------------------- |
| `dist/index.html`                                                      | 4.3 KB                                  | 1.4 KB  | Get-ChildItem dist              |
| `dist/assets/index-BYxMVMJv.css` (single blocking stylesheet)          | 201.5 KB                                | 23.7 KB | W10                             |
| `dist/sw.js` (+ `workbox-4e9e9954.js` 21.8 KB, `registerSW.js` 0.1 KB) | 28.4 KB                                 | —       | Get-ChildItem dist              |
| Fonts                                                                  | **0 font files shipped** (system stack) | —       | Glob `*.woff2,*.woff,*.ttf` = 0 |

### 2.2 Entry chunk

`index-BETcUTZ4.js` — **386.2 KB raw / 91.7 KB br**. Contains `__vite__mapDeps` lazy-route dep map at head, then 15 static `from"./…" chunk imports`, including `import{A as n,N as r,k as i}from"./chart-vendor-9L61rLse.js"` at byte offset ≈12499.

### 2.3 The 19 `modulepreload` chunks (exact, from `dist/index.html`)

| Chunk            | Raw KB    | Br KB     | Role (from name/config)                                        |
| ---------------- | --------- | --------- | -------------------------------------------------------------- |
| **chart-vendor** | **466.4** | **107.0** | Recharts (`vite.config.ts:274` rule) — **on boot path (F-01)** |
| react-vendor     | 174.5     | 47.3      | React/React-DOM core                                           |
| db-vendor        | 38.7      | 12.2      | sql.js DB layer                                                |
| icon-vendor      | 44.3      | 11.8      | lucide-react icons                                             |
| money            | 33.9      | 11.8      | currency math                                                  |
| masterStorage    | 14.0      | 4.4       | persistence adapter                                            |
| CubeEngine       | 9.6       | 2.8       | OLAP engine                                                    |
| authStore        | 9.2       | 2.5       | mock auth gate                                                 |
| QueryCache       | 3.5       | 1.1       | query cache                                                    |
| UndoRedoEngine   | 3.0       | 0.9       | undo/redo                                                      |
| immer            | 2.2       | 1.0       | immer middleware                                               |
| rolldown-runtime | 1.2       | 0.6       | runtime helper                                                 |
| chunk-C7YEMfBf   | 1.4       | 0.5       | tiny shared chunk                                              |
| react-C9IGYJjp   | 0.7       | 0.0       | react bridge shim                                              |
| cryptoId         | 0.7       | 0.0       | id utils                                                       |
| storageAdapter   | 0.6       | 0.0       | storage iface                                                  |
| logger           | 0.9       | 0.0       | logger                                                         |
| storageConstants | 0.4       | 0.0       | constants                                                      |
| deterministicRng | 0.3       | 0.0       | rng                                                            |
| **Total (19)**   | **805.4** | **203.9** |                                                                |

**Critical boot bytes ≈ 320.7 KB brotli** (HTML 1.4 + CSS 23.7 + entry 91.7 + preloads 203.9).

### 2.4 Whole-bundle size

`dist/assets/*.js`: **466 files / 6.42 MB raw / 1.65 MB brotli** (W1). CI budget context: main-chunk 150 KB gzip gate is not directly comparable (brotli here), but the entry alone at 91.7 KB br leaves headroom under 150 KB gzip-equivalent.

---

## 3. Entry chain & router map

`src/main.tsx` boot order (line-witnessed):

1. `L3` — `import * as Sentry from '@sentry/react'` (static; tree-shaken in this dist, see F-02)
2. `L12` — `registerSW()` (comment: “must run before render”)
3. `L33` — `Sentry.init({…})` gated on `import.meta.env.VITE_SENTRY_DSN`
4. `L52` — GDPR audit-trail subscription import (`auditTrailGdprEvents`)
5. `L72` — theme applied pre-render (flash prevention; note: `index.html` inline script reads key `finplan-theme` while main.tsx reads `theme` — double-read, cosmetic)
6. `L78` — `ReactDOM.createRoot(...).render(<App/>)`

Router (`src/App.tsx`, 776 lines): **182 `lazy(` calls, 251 `<Route>` elements** (W2) — route-level code-splitting is comprehensively applied. Eager (non-lazy) App imports: `ThemeContext`, `AppLayout`, `LoadingScreen`, `ErrorBoundary`, `RouteGroupErrorBoundary`, `useFirstRun`, `StorageFailureBanner`, `tauriRuntime`. Unauthenticated users mount `LoginPage` (64.4 KB raw / 15.7 KB br chunk + shared deps) before any dashboard surface.

---

## 4. Findings

### F-01 · chart-vendor rides the boot path — root cause at bundler layer (P0)

**Fact (three witnesses, D-002):**

1. `dist/index.html` lists `chart-vendor-9L61rLse.js` in `<link rel="modulepreload">`.
2. Entry contains a real static import: regex `from"\./chart-vendor-…\.js"` match at byte offset ≈12499 (`import{A as n,N as r,k as i}`).
3. `vite.config.ts:274` assigns every module whose id contains `recharts` to `chart-vendor`; the emitted file is 466.4 KB raw / 107 KB br.

**Root-cause hunt:** a complete BFS of the eager closure was performed by dumping the import blocks of every reachable file — `main.tsx` → `App.tsx` → `{ThemeContext, AppLayout → (Sidebar, Navbar, FinancialContextBar → FinancialStatusBadge, PillarNav, DurabilityBanner, HelpPanel, ToastContainer, CommandPalette → LiveRegion, SkipToContent), LoadingScreen, ErrorBoundary, RouteGroupErrorBoundary, useFirstRun, StorageFailureBanner}`, plus `pwa.ts`, `i18n`, `auditTrailGdprEvents`, `uiStore`, `financialContextStore`, `notificationStore`, `Skeleton`, `navigation` types, `localeFormatting`, `useAppNavigation`, `useKeyboardShortcuts`, `useFocusManagement`, `useDensity`, `useCollaborationInit`. Result: **zero** genuine `from 'recharts'` statements (the only layout-dir hit, `AboutDialog.tsx:29`, is the literal string `"Recharts"` in an about-credits list — false positive). Project-wide, exactly 79 non-test source files import recharts; all are lazy pages or chart components (`components/charts/*`, `components/dashboard/*`, chart files under `components/ui/*`) unreachable from the eager closure, and `components/ui/index.ts` barrel exports charts but the barrel has **zero importers** anywhere in `src/`.

**Conclusion (labeled inference):** since the entire eager source closure is clean, the `entry → chart-vendor` edge is created by bundler-level module grouping — most plausibly a small eagerly-needed helper co-located into `chart-vendor` by the path-substring `manualChunks` rule (e.g. a shared util reached through recharts' internal module graph). Naming the exact symbol requires one `--sourcemap`/visualizer build — **explicitly out of scope here (no builds allowed)**.

**Fix direction:** (a) run one ANALYZE build in P-03b to identify bindings `A/N/k`; (b) pin eagerly-shared helpers out of vendor chunks (add an explicit `shared-app` manualChunk evaluated _before_ the vendor rules); (c) verify chart-vendor becomes dynamic-only and disappears from `modulepreload`.

**Estimated impact:** removing the edge cuts **~107 KB br (~33%) off critical-boot bytes** and eliminates ~300–450 ms of cold parse/exec (estimate, assumptions §7). **Est. TTI improvement −15%…−25%.**

### F-02 · Sentry: zero cost today, conditional boot bomb tomorrow (P2)

`src/main.tsx:3` imports the full SDK statically, but `Sentry.init` is gated on `import.meta.env.VITE_SENTRY_DSN`. In this dist the DSN was unset at build time → static replacement + DCE removed the SDK entirely (**0** case-insensitive `sentry` matches in the 386 KB entry chunk, W9).

**Risk:** any future production build with `VITE_SENTRY_DSN` set will pull `@sentry/react` (+ replay) into the _entry chunk’s_ static graph. Typical SDK weight ~80–140 KB br (estimate from public bundle data; not measured here — none available offline).

**Fix direction:** wrap init in `if (DSN) { void import('./sentryBootstrap') }` so even enabled builds keep Sentry off the critical path.

**Estimated impact:** 0 KB today; protects est. 80–140 KB br of boot bytes in DSN-enabled builds.

### F-03 · Boot graph carries engines login never needs (P2)

`db-vendor` (12.2 KB br), `CubeEngine` (2.8), `UndoRedoEngine` (0.9), `QueryCache` (1.1), `money` (11.8) are all modulepreloaded before first paint, while the auth-gated user hasn’t rendered anything yet. Individually small; collectively ~29 KB br of parse/exec ahead of interactivity.

**Fix direction:** keep `react-vendor`, `masterStorage`, `cryptoId`, `authStore` (needed by the auth gate); defer engines to an idle-time `requestIdleCallback` prefetch after first route mount.

**Estimated impact:** −20–29 KB br boot, **−50–120 ms** pre-TTI (small; honest label — modest lever).

### F-04 · SW precache covers boot but excludes the big lazy vendors (P1)

Workbox precache manifest: **472 URLs** including the entry chunk; **0 references** to `chart-vendor` or `grid-community-vendor` (W8), matching the explicit `globIgnores` in `vite.config.ts` (workbox block excludes chart/grid/excel/pdf vendors + DataGrid).

Consequences: excel-core-vendor (195.2 KB br), grid-community-vendor (168.6 KB br), pdf-vendor (148.7 KB br) — **512.5 KB br combined** — are (a) unavailable offline on first use, (b) refetched on repeat visits unless HTTP cache cooperates.

**Fix direction:** don’t precache (install-cost blowup); add workbox `runtimeCaching` with `staleWhileRevalidate` for `/assets/*vendor*.js` so first successful fetch populates the SW cache.

**Estimated impact:** offline first-use success for grid/excel/pdf features 0% → ~100%; repeat-visit fetch of those features −400–1500 ms (network-dependent estimate). Boot TTI unaffected.

### F-05 · Selector/memoization discipline in heavy surfaces (P2, render-perf)

Static reading only (no profiling run):

- **`useShallow`: 0 occurrences src-wide** (W7) against 28+ Zustand stores. Any selector returning a fresh object/array re-renders its consumers. Mitigating witness: the crude whole-store antipattern `=> state)` counts **0** in pages, so selectors are mostly narrow — risk concentrates where computed objects are returned.
- **Grid wrappers are unmemoized:** `components/ui/DataGrid.tsx` (547 lines), `FinPlanGrid.tsx` (722), `SpreadsheetGrid.tsx` (498) contain **0 `memo(`** each; each uses only ~4 `useMemo` + 3–11 `useCallback`. `DataGrid.tsx` also references `cellRenderer/valueGetter` (3 sites) — inline arrow props recreate per render; AG Grid tolerates this but re-renders cells unnecessarily (static smell; runtime confirmation needed).
- **`memo(` usage overall:** 58 call-sites across 55 files (W5) — thin coverage for a grid/chart-heavy app; `useMemo` in pages: 517 occurrences (W6), so data-memoization habits exist but component-boundary memoization doesn’t.
- Style-discipline aside: `DataGrid.tsx` 547 L and `FinPlanGrid.tsx` 722 L exceed the 300-line component cap (not a runtime defect; flagging per conventions).

**Fix direction:** shallow-wrap object/array selectors in the top-visited grid & chart pages; `React.memo` the three grid wrappers; hoist `columnDefs`/cellRenderer factories to module scope or `useMemo`.

**Estimated impact:** unlabeled magnitude by design — re-render cost is workload-dependent and **cannot be honestly estimated statically**. Recommend a follow-up runtime profile task (P-04 candidate).

### F-06 · Virtualization coverage: AG Grid only (P2)

`react-window`: **0 importing files project-wide** (W3) — despite tooling expectations. Row virtualization exists solely through AG Grid behind 3 wrappers (W4: `DataGrid`, `FinPlanGrid`, `SpreadsheetGrid`). Every other list surface (report templates, formula registries, template libraries — e.g. `TemplateLibrary`, `FormulaFunctionRegistry` chunks) renders plain `.map(…)` lists (static read). For typical FP&A list sizes (< a few hundred rows) this is acceptable; ledger-sized tables outside AG Grid would degrade.

**Fix direction:** inventory long-list candidates in P-04; standardize on one virtualization primitive if any non-grid list can exceed ~500 rows.

### F-07 · Route-chunk weight outliers (informational)

Top non-boot chunks by brotli (live measurement): `excel-core-vendor` 908.1 KB raw / **195.2 br** · `grid-community-vendor` 741.3 / **168.6** · `pdf-vendor` 614.9 / **148.7** · `chunk-CAkggEtC` (shared lazy) 147.9 / 41.8 · `ReportDesignerPage` 151.7 / 41.8 · `LoginPage` 64.4 / 15.7 · `grid-react-vendor` 50.6 / 12.8. All are dynamically imported (correctly absent from `modulepreload`); the issue is only their SW-cache status (F-04). `ReportDesignerPage.tsx` itself is a 35-line shell — its weight lives in shared chunks, so per-page numbers overstate page-specific bloat.

### F-08 · PWA/SW init on boot path (informational, low)

`registerSW()` executes before render (main.tsx:12) but registration is async and non-blocking; cost is one extra script fetch (0.1 KB) + backgrounded sw.js/workbox install (28.4 + 21.8 KB). Precaching 472 URLs happens off the critical thread post-load. **No actionable boot cost.** Minor nit: theme key mismatch (`finplan-theme` inline script vs `theme` in main.tsx:72) causes a redundant localStorage read — cosmetic only.

---

## 5. Render-perf suspects (heavy grid/chart pages) — summary

Covered in F-05: unmemoized grid wrappers, 0× `useShallow`, thin `memo` coverage, inline `columnDefs/cellRenderer` smell in `DataGrid.tsx`. Chart pages consume recharts via `ResponsiveContainer`-style wrappers in `components/ui` (`Sparkline`, `ComboChart`, `WaterfallChart`, …) — these live behind lazy routes, so they are **not** a boot concern; their re-render discipline was sampled only via the shared wrappers above.

## 6. Virtualization coverage — summary

See F-06: AG Grid-only virtualization (3 wrappers); react-window absent; non-grid long lists unvirtualized (static read, runtime impact unquantified).

---

## 7. TTI estimate — **LABELED ESTIMATE, NO RUNS EXECUTED**

**Payload (measured):** 320.7 KB brotli critical bytes = 1,191.6 KB raw JS + 201.5 KB CSS.

**Assumptions (stated):** mid-tier desktop (4C/8T), cold HTTP cache, 20 Mbps down / 40 ms RTT; JS cold parse+exec throughput 0.8–1.5 MB/s (public-engineering folklore, not benchmarked here); first visible route = auth-gated `LoginPage` (15.7 KB br + small deps).

| Phase                                                    | Derivation                                                     | Estimate         |
| -------------------------------------------------------- | -------------------------------------------------------------- | ---------------- |
| HTML fetch + discover preloads                           | 1 RTT + preload-scan (links in head)                           | ~60–100 ms       |
| Fetch all JS+CSS                                         | 320.7 KB br @ 20 Mbps + RTT, parallel                          | ~170–230 ms      |
| Parse + execute 1,191.6 KB raw JS                        | @ 0.8–1.5 MB/s; chart-vendor alone 466.4 KB ⇒ 300–450 ms slice | **~800–1500 ms** |
| React mount AppLayout + auth restore (sync localStorage) | main-thread                                                    | ~100–200 ms      |
| Lazy-fetch + mount LoginPage                             | 15.7 KB br + deps, 1 RTT + mount                               | ~150–300 ms      |
| **Cold-start TTI (mid-tier desktop)**                    | sum                                                            | **≈ 1.3–2.3 s**  |
| Low-end laptop scenario (2-core, 10 Mbps, cold)          | exec ×~2.2, network ×~2                                        | **≈ 3–6 s**      |

These are engineering estimates from byte weights and published throughput ranges. **No Lighthouse/trace was executed** (task constraint). If even the low end matters to users, F-01 is the dominant single lever because the parse/exec row dominates the budget.

---

## 8. Top 5 cold-start levers (ranked, impact = labeled estimates)

| #   | Lever                                              | Mechanism                                                                                                                                           | Estimated impact                                                                                                         |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Break the entry↔chart-vendor edge** (F-01)       | Identify bindings `A/N/k` via one ANALYZE build; pin shared helpers into an app chunk evaluated before vendor rules; make chart-vendor dynamic-only | −107 KB br boot bytes (−33%); **TTI −15%…−25%**                                                                          |
| 2   | **SW runtime-caching for big lazy vendors** (F-04) | `runtimeCaching` staleWhileRevalidate on `/assets/*vendor*` instead of precache                                                                     | Offline/repeat first-use of grid/excel/pdf fixed; repeat visits −400–1500 ms on those features; zero install-weight cost |
| 3   | **Conditional/dynamic Sentry bootstrap** (F-02)    | `import('./sentryBootstrap')` behind DSN check                                                                                                      | 0 KB today; shields future DSN builds from est. +80–140 KB br on boot                                                    |
| 4   | **Idle-defer boot engines** (F-03)                 | Keep auth-critical chunks; idle-prefetch `db-vendor/CubeEngine/UndoRedoEngine/QueryCache` after first mount                                         | −20–29 KB br, −50–120 ms pre-TTI (modest, honest label)                                                                  |
| 5   | **Post-login route prefetch** (router)             | After auth resolves, `requestIdleCallback`-prefetch the landing dashboard chunk + grid-react-vendor                                                 | Perceived post-login navigation −300–800 ms (perceived-latency estimate)                                                 |

Not ranked (insufficient static evidence, deferred to runtime profiling): useShallow/memoization retrofit (F-05), non-grid virtualization (F-06).

---

## Appendix A · Witness log (D-002/D-009)

All numbers above come from PowerShell `Get-ChildItem`/`Select-String`/regex over existing artifacts during this session (final consolidated pass labels W1–W10):

- **W1** 466 JS files / 6.42 MB raw / 1.65 MB br (`Measure-Object` on `dist/assets/*.js`, `*.js.br`)
- **W2** App.tsx 776 L / 182 `lazy(` / 251 `<Route`
- **W3** `react-window` importers = 0 (`Select-String -List` over `src/**/*.{ts,tsx}`)
- **W4** AG Grid unique consumer files = 3 (`AgGridReact|ag-grid-react`)
- **W5** `memo(` = 58 matches / 55 files (pages+components)
- **W6** `useMemo` in pages = 517 occurrences
- **W7** `useShallow` src-wide = 0 occurrences
- **W8** sw.js precache `url:"` entries = 472; `chart-vendor` refs = 0; `grid-community-vendor` refs = 0
- **W9** case-insensitive `sentry` matches in `index-BETcUTZ4.js` = 0
- **W10** CSS raw 201.5 KB / br 23.7 KB

Plus direct Reads: `dist/index.html` (preload list), `src/main.tsx` (boot order, line numbers cited), `src/App.tsx` (imports/lazy/routes), `vite.config.ts` (manualChunks L274 area, workbox `globIgnores`, noAiPreload), `src/pwa.ts`. Grep-MCP was avoided for load-bearing patterns per known flakiness (tooling memory); Select-String used as witnessing standard.

**Limitations:** (1) no sourcemaps in dist → bundler-edge root cause in F-01 is mechanism-level, not symbol-level; (2) all timing values are estimates from byte weights — none measured; (3) re-render behavior (F-05/F-06) is a static smell inventory, not a profile; (4) `.br` sizes reflect this exact build snapshot (chunk hashes will drift on next build — treat ratios, not names, as durable).

— Pulse, P-03a, 2026-08-23
