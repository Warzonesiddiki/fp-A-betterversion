# P-02-R · Bundle Remediation Proposal — total JS ≤ 2048 KB gzip

> **Status:** DESIGN ONLY (no code edited, no vite.config.ts changed, no builds/tests run — per task constraints).
> **Author:** Amelia (Developer), Track P follow-up to P-02.
> **Baseline:** P-02 audit measurements, local run 2026-08-23 (`scripts/bundle-check.js` + vite build output).
> **Honesty:** per `_bmad/project-completion-plan.md` §8 — every KB figure below is either tagged **[MEASURED]** (P-02 gate output / zlib re-measure) or **[ESTIMATE]** (static-analysis inference, unproven until a build demonstrates it).

---

## 0. Baseline (all [MEASURED], P-02)

| Metric                                      | Value                           | Limit                                     | Verdict                                         |
| ------------------------------------------- | ------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| Main chunk `index-B-mMm8KO.js`              | 112.41 KB gzip                  | <150 KB                                   | PASS                                            |
| Total JS                                    | **2083.33 KB gzip**             | script 2248 KB / plan-literal **2048 KB** | PASS vs script; **−35.33 KB over plan-literal** |
| Critical path                               | 354.73 KB gzip                  | ≤750 KB                                   | PASS                                            |
| grid-community-vendor                       | 284.85 KB gzip                  | ≤300 KB (G19)                             | WARN at 95%                                     |
| excel-core-vendor                           | 248.23 KB gzip                  | ≤300 KB (G19)                             | pass                                            |
| pdf-vendor / chart-vendor / react-vendor    | 179.22 / 129.30 / 54.44 KB gzip | ≤300 KB each                              | pass                                            |
| grid-react-vendor / icon-vendor / db-vendor | 14.29 / 13.86 / 13.61 KB gzip   | —                                         | pass                                            |

**Target:** close the −35.33 KB plan-literal gap, then create comfortable headroom (<1900 KB goal).

---

## 1. AG Grid modular registration (top lever)

### 1.1 Where the kitchen-sink registration lives [MEASURED — file:line]

All three grid components register **`AllCommunityModule`** — AG Grid's full Community bundle:

| Site                                    | Evidence                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/DataGrid.tsx`        | lines 4–11 import `{ AllCommunityModule, ModuleRegistry, … } from 'ag-grid-community'`; **line 20**: `ModuleRegistry.registerModules([AllCommunityModule])` |
| `src/components/ui/FinPlanGrid.tsx`     | **line 16**: `ModuleRegistry.registerModules([AllCommunityModule])`                                                                                         |
| `src/components/ui/SpreadsheetGrid.tsx` | **line 18**: `ModuleRegistry.registerModules([AllCommunityModule])`                                                                                         |

Runtime consumers (blast radius — all lazy route pages/components):

- `BudgetGrid.tsx:2` → DataGrid (budget detail flow)
- `GLTrialBalanceGrid.tsx:1` → DataGrid (GL trial balance)
- `pages/banking/CapitalAdequacyPage.tsx:19`, `LoanLossPage.tsx:11`, `NIMDashboardPage.tsx:8` → DataGrid
- `BudgetDetailPage.tsx:10` → FinPlanGrid
- **SpreadsheetGrid: ZERO runtime importers found** (only its colocated tests + a smoke-test stub reference it). It appears excluded from the current build graph (orphan), but its registration line is a latent re-bloat path if it ever gets imported again.

Type-only `ag-grid-community` imports (no bytes): `financialGridConfig.ts:1`, `columnDefs.ts:1`, `FindReplaceDialog.tsx:2`, `DataGrid.types.ts:1`, `useColumnVisibility.ts:2`, `useFindReplace.ts:2`, `useFreezePanes.ts:2`, `useSelectionStats.ts:2`, `useDataGridHandlers.ts:2`.

### 1.2 Which modules are ACTUALLY used [MEASURED — grep evidence]

| Feature                                  | Evidence                                                                                                                                                                                               | Module needed (v33+ modular API)                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Client-side rows                         | default row model everywhere                                                                                                                                                                           | `ClientSideRowModelModule` (**required**)                                    |
| Column filters `filter: true`            | `DataGrid.tsx:105`, `FinPlanGrid.tsx:113`, `SpreadsheetGrid.tsx:104`, `:142`                                                                                                                           | `TextFilterModule`, `NumberFilterModule`, `DateFilterModule` (basic filters) |
| Set / multi / floating filters           | **zero matches** repo-wide (`setFilter`, `agSetColumnFilter`)                                                                                                                                          | NOT needed                                                                   |
| AG Grid CSV export                       | **zero matches** (`exportDataAsCsv`, `getDataAsCsv`); export is hand-rolled Blob+anchor in `hooks/useDataGridExport.ts:9–31`                                                                           | `CsvExportModule` NOT needed                                                 |
| Cell editors (`agNumberCellEditor` etc.) | **zero matches** in grid components                                                                                                                                                                    | specialized editor modules NOT needed                                        |
| Row grouping / pivot / agg               | **zero matches** (`rowGroup`, `pivot:`, `aggFunc`). Note: `enableRowGrouping` prop declared at `DataGrid.tsx:47` is **dead** — never consumed in component body (a test passes it; runtime ignores it) | `RowGroupingModule` NOT needed                                               |
| Validation warnings (dev DX)             | optional                                                                                                                                                                                               | `ValidationModule` — dev builds only                                         |

**Migration map (proposed edit sites, NOT implemented):** replace the single `AllCommunityModule` argument at `DataGrid.tsx:20`, `FinPlanGrid.tsx:16`, `SpreadsheetGrid.tsx:18` with `[ClientSideRowModelModule, TextFilterModule, NumberFilterModule, DateFilterModule]` (+ `ValidationModule` behind `import.meta.env.DEV`). Keep `ag-grid-react` untouched (`grid-react-vendor` stays 14.29 KB [MEASURED]).

**Caveat (honesty):** the keyboard copy/paste path in DataGrid tests references `ExcelKeyboardEngine`; I did not verify whether any AG Grid clipboard API is involved. If it is, add the appropriate module during implementation and re-measure. Flagged as open verification item.

### 1.3 Expected impact [ESTIMATE]

- Current grid-community-vendor: **284.85 KB gz [MEASURED]** (≈ whole Community bundle).
- Used-module subset above is typically **40–65 % lighter** than the full bundle for a filters-only profile (AG Grid docs' modular-registration guidance).
- **ESTIMATE end-state: ~110–170 KB gz → saving ≈ 115–175 KB gz.** Direction confidence HIGH (usage evidence above); exact KB confidence MEDIUM until built.
- Side effect: clears the G19 grid-community WARN (95% of its own budget) and de-risks it permanently.

---

## 2. exceljs / excel-core-vendor scope review (248.23 KB gz [MEASURED])

### 2.1 What pulls it in [MEASURED — file:line]

| Path                                                                                | Import style            | Reachability                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ExcelImportEngine.ts:7` → `import * as ExcelJS from 'exceljs'`                     | static                  | reached statically from `GLUploadPage.tsx:15` (route page) and `GLImportService.ts:3`                                                                                                                                                                                   |
| `exportExcel.ts:1` → static exceljs                                                 | static                  | reached ONLY dynamically: `ExportEngine.ts:120` (`await import('./exportExcel')`) and `engineManifest.generated.ts:377` ✓                                                                                                                                               |
| `MigrationWizard.tsx:77` → `await import('exceljs')`                                | dynamic ✓               | on-demand                                                                                                                                                                                                                                                               |
| `MigrationEngine.ts:6` → static exceljs                                             | static                  | importer reachability NOT verified (tooling limitation noted below)                                                                                                                                                                                                     |
| `engines/index.ts:298` → `export { default as exportToExcel } from './exportExcel'` | static barrel re-export | **barrel has zero non-test importers** (verified via Select-String across src, excluding _.test._) → no eager leak today, but latent hazard; inconsistent with the deliberate disable pattern at `engines/index.ts:288` (WorkflowEngine) and `:100` (ExcelImportEngine) |

Orphan note: `GLImportService.ts` is reachable only via `ImportPipeline.ts`, which itself has **zero non-test importers** → both are runtime-dead weight around the exceljs import chain.

### 2.2 Lazy-loading boundaries

Boundaries mostly exist already (dynamic imports at ExportEngine/engineManifest/MigrationWizard). The remaining _load-time_ issue: `GLUploadPage.tsx:15` statically imports the engine, so opening the GL Upload route eagerly downloads ~248 KB gz before the user clicks anything.

### 2.3 Options

| Option                                                                           | Total-JS effect                                   | Effort | Risk                                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| (a) Lazy-load engine in GLUploadPage (`await import` inside handler)             | 0 KB (total unchanged) — defers 248 KB until used | S      | S                                                                               |
| (b) Delete orphaned `ImportPipeline` + `GLImportService` (test-only reach)       | 0 KB (not in build) — hygiene                     | S      | S                                                                               |
| (c) Remove `engines/index.ts:298` static re-export (align with :288 pattern)     | 0 KB today — removes latent eager-leak path       | S      | S                                                                               |
| (d) Replace exceljs (both write & parse paths) with a minimal xlsx writer/parser | **ESTIMATE −180…−240 KB gz**                      | L      | H — financial import/export correctness surface; needs golden-file parity tests |

**Honest position:** exceljs bytes are effectively irreducible without option (d). Config-level levers cannot shrink a vendor library.

---

## 3. Quick wins check

| Candidate               | Finding                                                                                                                                                                                                                                                                                                  | Estimated impact                                                                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Icon tree-shaking**   | All lucide-react usage is named imports; zero `import * as` star imports (Select-String scan). icon-vendor is 13.86 KB gz [MEASURED].                                                                                                                                                                    | **No action needed** — already optimal.                                                                                                                                                                                                                           |
| **Route-level splits**  | `App.tsx:2` already lazy-loads every page (`lazy, Suspense`); route-shell contract tests enforce it. Remaining candidate: inspect the large shared auto-chunk `chunk-CAkggEtC.js` (147.88 KB raw / 41.82 KB brotli [MEASURED]) once builds are permitted.                                                | 0–30 KB gz [ESTIMATE]; deferred.                                                                                                                                                                                                                                  |
| **Sentry eager SDK**    | `main.tsx:3` `import * as Sentry from '@sentry/react'` — eager barrel-star; `init()` is DSN-gated (`main.tsx:32`) but bytes ship regardless; eager choice is documented in comments (`main.tsx:14–17`). Replay+tracing included.                                                                         | **ESTIMATE −40…−80 KB gz** from the eager graph by moving `init` into a DSN-gated `await import('@sentry/react')`. Monitoring preserved when DSN set; adds async-init window (mitigable with capture-before-init queue). Effort S, Risk M (observability timing). |
| **framer-motion scope** | Only 4 files: `ReportDesigner.tsx`, `TemplateModal.tsx`, `TourOverlay.tsx`, `animations.ts` (type-only). Likely already inside lazy report-designer chunks.                                                                                                                                              | CSS-transition rewrite: **ESTIMATE −25…−40 KB gz**, touches UX motion code. Effort M, Risk M.                                                                                                                                                                     |
| **Duplicate deps**      | axios (services/api.ts:1, RestApiClient.ts:18; importer breadth unverified due to tooling) vs native fetch; file-saver (~2 KB) vs manual Blob anchor (already done in useDataGridExport pattern); clsx+tailwind-merge both needed by cn(); decimal.js mandated by ADR-004 — **not** a removal candidate. | axios→fetch wrapper: **ESTIMATE −10…−13 KB gz**, Effort M/L, Risk M (auth/retry semantics). file-saver swap: −~2 KB, negligible.                                                                                                                                  |
| **Dead code hygiene**   | `SpreadsheetGrid` runtime-orphan; `DataGrid.tsx:47` `enableRowGrouping` dead prop; `ImportPipeline`/`GLImportService` test-only.                                                                                                                                                                         | 0 KB direct (already excluded/tree-shaken); prevents future re-bloat; shrinks test+audit surface. Effort S, Risk S.                                                                                                                                               |

---

## 4. Ranked recommendations

| #   | Option                                                                                                                | Effort | Risk                                                               | Expected end-state total JS gz                                              | Basis               |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------- |
| 1   | **AG Grid modular registration** (§1 migration map; optionally delete orphan SpreadsheetGrid instead of migrating it) | S/M    | Low-Med (filter behavior parity; cover with grid regression tests) | **≈1908–1968 KB** (−115…−175 [ESTIMATE])                                    | §1.2 usage evidence |
| 2   | **Sentry dynamic init** behind existing DSN gate                                                                      | S      | M                                                                  | combined with #1: **≈1830–1930 KB** (extra −40…−80 [ESTIMATE])              | §3                  |
| 3   | Dead-code batch: SpreadsheetGrid orphan, `enableRowGrouping`, ImportPipeline/GLImportService, `engines/index.ts:298`  | S      | S                                                                  | 0 KB direct; hygiene + latency-safe future                                  | §2.1, §3            |
| 4   | GLUploadPage lazy engine load                                                                                         | S      | S                                                                  | 0 KB total; −248 KB deferred from route load                                | §2.3a               |
| 5   | framer-motion → CSS transitions                                                                                       | M      | M                                                                  | further **−25…−40 [ESTIMATE]**                                              | §3                  |
| 6   | axios → fetch wrapper                                                                                                 | M/L    | M                                                                  | further **−10…−13 [ESTIMATE]**                                              | §3                  |
| 7   | exceljs replacement                                                                                                   | L      | H                                                                  | further **−180…−240 [ESTIMATE]** — only if long-term target well below 2 MB | §2.3d               |

**Top recommendation: #1 alone** closes the 35.33 KB plan-literal gap several times over and clears the last G19 warning; **#1+#2** yields comfortable headroom (~100–230 KB below the 2 MB line, [ESTIMATE]). Everything else is optional depth or hygiene.

**Governance notes for Lead/Mnemosyne:**

- `scripts/bundle-check.js` enforces `TOTAL_JS_LIMIT_KB = 2248` while plan-literal is 2048 — reconcile: after #1 lands, propose tightening the gate to 2048 (ratchet down), keeping CI honest.
- AGENTS.md still documents six manual chunks (`grid-vendor`, `form-vendor`, `state-vendor` do not exist in `vite.config.ts`; actual rules define 10 chunk names) — doc correction suggested (P-02 finding, repeated here for consolidation).

## 5. Verification gaps (honesty appendix)

- All savings figures are **[ESTIMATE]**; nothing here has been build-proven (builds forbidden this task). Acceptance requires one `npm run build` + `npm run bundle-check` per implemented item, before/after.
- `MigrationEngine.ts:6` upstream reachability and axios importer breadth were left unverified (search-tool malfunction on quoted/alternating patterns mid-task; single-term greps + Select-String used where possible).
- AG Grid clipboard/keyboard interplay flagged as an open verification item (§1.2 caveat).
