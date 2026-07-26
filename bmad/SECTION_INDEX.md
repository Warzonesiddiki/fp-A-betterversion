# FinPlan One — Section Status Board (BMAD, 100 sections)

**Project:** FinPlan One (formerly FinPlan Pro) · All-in-one FP&A · zero compromises
**Standard:** A section advances only when marked `COMPLETE: 100% READY`.
**Pacing:** Section N starts only after Section N-1 is COMPLETE.
**Status legend:** TODO → PLAN DONE (steps 1–6 written, implementation deferred) → IN_PROGRESS → IN_REVIEW → COMPLETE: 100% READY
**Mode:** Plan-first — all sections get steps 1–6 now; steps 7–11 (build + adversarial review) run in a second pass.

| Sec | Band | Slug | Scope (one line) | Status | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 |
|-----|------|------|------------------|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| S01 | 1 | repo-hygiene-cleanup | Remove junk files, quarantine superseded docs, reconcile README/CLAUDE/AGENTS | COMPLETE: 100% READY | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| S02 | 1 | adr-ratification | Ratify/resolve 5 P0 ADRs (Zustand, OLAP cube, Decimal.js, masterStorage, schema migration) | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S03 | 1 | doc-truth-source | Single source-of-truth docs; archive duplicates; live status board | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S04 | 1 | dependency-install-fix | Fix npm install (onnxruntime-node); reproducible install flags/.npmrc | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S05 | 1 | web-vs-desktop-decision | Resolve Tauri-only gate: web+desktop or desktop-only; implement | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S06 | 1 | design-tokens-theme-system | Centralize design tokens, dark/light + accent system | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S07 | 2 | vite-build-pipeline | Vite config, manual chunks, PWA, build hardening | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S08 | 2 | typescript-strict-gates | tsc --noEmit zero-error enforcement, tsconfig | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S09 | 2 | eslint-prettier-gates | Lint 0 errors/warnings, prettier, husky/lint-staged | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S10 | 2 | ci-cd-pipeline | GitHub Actions: tsc→lint→test→build→bundle-check | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S11 | 2 | bundle-size-governance | bundle-check thresholds, lazy-loading enforcement | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S12 | 3 | gl-data-model | GL types, stores, sample data | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S13 | 3 | gl-upload-wizard | 5-step CSV/XLSX upload, mapping, preview, validation | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S14 | 3 | chart-of-accounts | CoA CRUD, hierarchy, CSV import/export, soft-delete guard | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S15 | 3 | trial-balance | Auto trial balance, balanced/off-by indicator | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S16 | 3 | journals | Filterable/paginated journals | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S17 | 3 | account-analysis | Per-account monthly trend + running balance | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S18 | 3 | data-reconciliation | Two-file reconciliation, tolerance, diff export | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S19 | 3 | data-import-history | Import job history, undo last import | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S20 | 3 | gl-migration-tools | Migrate legacy/external GL data | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S21 | 4 | master-storage-layer | masterStorage + IndexedDB + fallback | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S22 | 4 | sqlite-migration | IndexedDB→SQLite migration on desktop | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S23 | 4 | backup-restore-ui | Global backup/restore UI (settings + toolbar) | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S24 | 4 | data-integrity-verification | Integrity checks, schema versioning | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S25 | 4 | offline-sync-queue | Offline changes queue + sync | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S26 | 5 | engine-foundation | Engine patterns, types, test harness | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S27 | 5 | account-math-engine | Core arithmetic, rounding, variance | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S28 | 5 | financial-statement-engines | P&L/BS/CF computation engines | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S29 | 5 | consolidation-engines | IC elimination, NCI | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S30 | 5 | fx-translation-engines | Average/closing/historical translation | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S31 | 5 | saas-metric-engines | ARR/NRR/GRR/churn/cohort | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S32 | 5 | forecasting-engines | Trend/regression/seasonality | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S33 | 5 | tax-lease-capex-engines | Tax, lease (IFRS16/ASC842), capex/depreciation | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S34 | 6 | budget-data-model | Budget types, store, versioning | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S35 | 6 | budget-list | CRUD + status workflow (Draft→Approved→Locked) | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S36 | 6 | budget-create-wizard | 4-step create wizard | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S37 | 6 | budget-detail-grid | AG Grid editor, keyboard, undo/redo, versions | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S38 | 6 | budget-approval-workflow | Submit/approve/reject, comments, lock | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S39 | 6 | budget-vs-actual-engine | Variance computation | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S40 | 6 | budget-templates | Reusable budget templates | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S41 | 6 | budget-rollups | Department roll-up + flat view | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S42 | 6 | budget-permissions | Budget-level RBAC scoping | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S43 | 7 | driver-tree | Revenue/expense/headcount driver tree | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S44 | 7 | growth-rate-formulas | Growth, CAGR, auto-fill | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S45 | 7 | rolling-forecast | Rolling forecast engine + UI | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S46 | 7 | what-if-modeling | What-if UI | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S47 | 7 | seasonality | Seasonality presets/custom | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S48 | 7 | driver-planning-page | Driver planning UI | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S49 | 7 | forecast-builder | Forecast builder + list | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S50 | 8 | scenario-data-model | Base + variants, overrides | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S51 | 8 | scenario-builder | Builder + list UI | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S52 | 8 | scenario-compare | Side-by-side + tornado | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S53 | 8 | monte-carlo-engine | Monte Carlo simulation engine | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S54 | 8 | monte-carlo-worker | Web worker integration | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S55 | 8 | probability-weighted-output | Probability-weighted scenario output | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S56 | 9 | pl-statement | P&L with margins, budget compare, variance | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S57 | 9 | balance-sheet | BS with balanced check | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S58 | 9 | cash-flow | CF reconciling to BS | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S59 | 9 | report-designer | Drag-drop report designer | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S60 | 9 | report-templates | Template library + gallery | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S61 | 9 | pdf-export | PDF export with headers/formatting | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S62 | 9 | excel-export | Excel export (ExcelJS) | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S63 | 9 | three-statement-dashboard | 3-statement linked dashboard | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S64 | 9 | custom-report-builder | Custom report builder | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S65 | 10 | variance-analysis | Waterfall, fav/unfav coloring, rate/vol/mix | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S66 | 10 | board-pack-generator | Multi-section PDF board pack + templates | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S67 | 10 | analytics-dashboards | Analytics dashboards | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S68 | 10 | benchmarking | Benchmarking vs peers/industry | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S69 | 10 | goal-seek-breakeven | Goal Seek + break-even calculator | PLAN DONE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S70 | 11 | entity-management | Entity CRUD, ownership tree | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S71 | 11 | ic-elimination | Inter-company elimination (1% tolerance) | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S72 | 11 | consolidated-pl | Live consolidated P&L + NCI | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S73 | 11 | fx-rates-management | FX rate CRUD + history chart | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S74 | 11 | translation-ui | Translation UI (avg/closing/historical) | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S75 | 11 | hedge-management | Hedge management + effectiveness gauge | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S76 | 12 | sector-framework | useSector + config-driven UI | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S77 | 12 | saas-vertical | SaaS dashboard (ARR/NRR/cohort/churn) | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S78 | 12 | manufacturing-vertical | OEE/scrap/inventory/COGS | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S79 | 12 | banking-insurance-vertical | NIM/CET1/combined ratio/NPL | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S80 | 12 | realestate-retail-vertical | NOI/cap rate; same-store/ATV | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S81 | 12 | energy-esg-vertical | Production/emissions/scope 1-3/carbon | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S82 | 12 | additional-sectors | Construction/logistics/healthcare/gov/edu/telecom | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S83 | 13 | audit-trail | Live audit feed + export | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S84 | 13 | approval-queue | Batch approve/reject, mandatory reason | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S85 | 13 | collaboration | Threaded comments, @mentions, tasks, activity log | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S86 | 13 | period-close | Pre-close checklist + locks | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S87 | 13 | rbac-roles | Viewer/Editor/Admin guards | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S88 | 14 | dark-light-audit | 100% dark+light coverage audit | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S89 | 14 | wcag-aa-accessibility | WCAG 2.2 AA, axe in tests | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S90 | 14 | help-command-palette | F1 help on every route + Ctrl/Cmd+K | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S91 | 15 | web-workers-production | Wire workers into real UI | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S92 | 15 | performance-benchmarks | 100k grid, import/export perf, virtualization | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S93 | 16 | test-recovery | Recover suite to >=95% pass | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S94 | 16 | e2e-coverage | Playwright E2E full workflow + coverage >=80% | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S95 | 17 | security-hardening | security.ts, CSP, secrets, JWT, Zod | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S96 | 17 | compliance-gdpr | GDPR events, retention, audit hooks | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S97 | 18 | tauri-build-pipeline | tauri:dev/build, installer | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S98 | 18 | desktop-native-features | SQLite persist, dialogs, notifications, shortcuts, updater | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S99 | 19 | onboarding-wizard | First-run onboarding (company/sector/import) | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| S100 | 19 | release-v1 | README accuracy, CHANGELOG, v1.0.0 tag, PROJECT_COMPLETE | TODO | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
