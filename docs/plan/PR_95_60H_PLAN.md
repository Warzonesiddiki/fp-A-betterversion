# PR #95 — 60-Hour Quota Plan (covers PR #93 + #94 shortfall + PR #95) — 25x + 350 Zero-Compromise Expanded (575 Tasks, 142h)

> **Historical planning snapshot (2026-10-23):** Task T492 and other O4-open language predate/currently fail to reflect DEC-102. O4 is resolved: this is not a SOX compliance system, and the local chain is not SOX authority. Do not treat the plan's historical O4 task as an active owner blocker.

> **Rule**: 20h productive per PR, no idle time. Last 2 branches (arena/0c09f26a and previous) closed early per user report — this PR must deliver 60h productive work (40h debt + 20h current) with unlimited tokens, nonstop.
> **Expansion Rule**: User requested 25× more tasks — original 9 tasks expanded to 225 micro-tasks (0.15h–0.45h each, avg 0.267h). Then user requested +350 more useful tasks, zero compromises — total 575 tasks (T001-T575), 142h productive, avg 0.247h (14.8 min) per task, for full C1-C6 closure.
> **Status**: expanded 2026-10-23 v2, branch `arena/b6432303-fp-a-betterversion`, 575 tasks, zero compromise
> **Baseline** (measured 2026-10-23, 2dbb0f4 post PR #90 merge):
> - SUPPORTED 30 = 13 routes + 17 caps, 695 rows, spine 13/48, gov 13/39, one-stop 13, missingIsNotZero 0
> - Bundle: 6829.49KB raw / 2065.78KB gzip = 99.3% of 2080KB limit, 1 warning (excel-core 248KB gz, grid 206KB gz, pdf 179KB gz, chart 129KB gz, sector-pages 96KB gz, ui-primitives 34KB gz, index ~70KB gz)
> - Money adoption 36.37% (371/1020), money:ast 0 unsafe, palette 5501/370
> - Routes: 231 total, 0 REVIEW, 38 MIGRATE, 2 RETAIN, 7 EXPERIMENTAL (per route dispositions)
> - Test files 1423, suite 8/8 shards ~872-984s, 2 known perf flakes (DataGrid keyboard 276ms vs 250ms, glStore loadBench 10542ms vs 10000ms)
> - Skills 56, frontmatter valid, index current

## Skills activated (all 56)

ponytail (full), executing-plans, writing-plans, verification-before-completion, systematic-debugging, test-driven-development, onboarding-a-codebase, performance-and-bundle, vite-bundle-deep-optimization, ag-grid-modular-optimization, recharts-tree-shaking, financial-domain-modeling, money-and-decimals, audit-trail-and-lineage, reconciliation-and-tie-out, architecture-boundaries, react-state-and-stores, testing-strategy, docs-and-decisions, requirements-traceability, accessibility-wcag, frontend-design, charts-and-data-display, excel-and-report-exports, forms-and-validation, gates-and-ratchets, driver-based-scenario-modeling, rolling-forecast-implementation, asc-810-consolidation-elimination, security-and-permissions, data-integrity, import-and-mapping, close-and-consolidation, scenario-modeling, forecast-and-budget, cash-and-treasury, workforce-planning, reporting-and-analytics, ai-and-nlq, owner-decisions, release-and-handover

## Original 9-Task Summary → 225 Micro-Tasks (25×)

Original tasks preserved as epics; each epic split into 20-30 micro-tasks.

**Epic mapping:**
- E1 Bundle diet 8h → T001-T030 (30 tasks, 8h)
- E2 /cash 6h → T031-T055 (25 tasks, 6h)
- E3 /workforce 6h → T056-T080 (25 tasks, 6h)
- E4 /treasury 6h → T081-T105 (25 tasks, 6h)
- E5 REPORT 3 pages 8h → T106-T135 (30 tasks, 8h)
- E6 Money 45% 6h → T136-T160 (25 tasks, 6h)
- E7 AI hardening 8h → T161-T185 (25 tasks, 8h)
- E8 A11y+perf 6h → T186-T205 (20 tasks, 6h)
- E9 Docs+owner pack 6h → T206-T225 (20 tasks, 6h)

Total 225 tasks = 60h productive (avg 16 min per task). No idle counted.

---

## Epic E1 — Bundle Deep Diet (T001-T030) — 8h — target <2000KB gz (stretch <1950KB)

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T001 | Measure baseline bundle: build, bundle-check, stats.html, chunk inventory | 0.2h | bundle 6829KB raw / 2065.78KB gz recorded, warnings 1, excel-core 248KB gz | performance-and-bundle, vite-bundle-deep-optimization | scripts/bundle-check.js output, dist/stats.html |
| T002 | Audit all static exceljs imports via grep | 0.2h | list of 9 prod files with static import identified | vite-bundle-deep-optimization | grep result file |
| T003 | Convert src/engines/exportExcel.ts to dynamic loadExcelJS() | 0.3h | no static exceljs, tsc PASS, dynamic import present | excel-and-report-exports, ponytail | exportExcel.ts diff |
| T004 | Convert src/engines/ExcelImportEngine.ts to dynamic loadExcelJS() | 0.3h | dynamic import, parseFile awaits loader, tsc PASS | excel-and-report-exports, ponytail | ExcelImportEngine.ts diff |
| T005 | Convert src/engines/MigrationEngine.ts to dynamic loadExcelJS() | 0.3h | any-typed ExcelJS, loadWorkbook awaits loader, tsc PASS | excel-and-report-exports | MigrationEngine.ts diff |
| T006 | Convert src/services/export/financialPackageExport.ts to dynamic loadExcelJS() | 0.4h | buildFormulaPreservingWorkbookBytes async loads, no static import, tsc PASS | excel-and-report-exports, reconciliation-and-tie-out | financialPackageExport.ts diff |
| T007 | Verify MigrationWizard.tsx already dynamic, add fallback loading UI | 0.2h | dynamic import confirmed, Skeleton srLabel added | frontend-design | MigrationWizard.tsx |
| T008 | Audit jspdf static imports | 0.2h | list of files importing jspdf statically | performance-and-bundle | grep jspdf |
| T009 | Convert exportPDF.ts / ReportExportEngine to dynamic import('jspdf') | 0.3h | pdf export loads jspdf on demand, tsc PASS | excel-and-report-exports | exportPDF.ts diff |
| T010 | Convert BoardPackExportEngine pdf path to dynamic | 0.2h | dynamic, no static pdf in main chunk | reporting-and-analytics | BoardPackExportEngine.ts |
| T011 | Audit framer-motion static imports | 0.2h | list of 12+ files importing motion statically | vite-bundle-deep-optimization | grep framer-motion |
| T012 | Lazy-load ReportDesigner motion components via dynamic import | 0.3h | motion.lazy, Suspense fallback, no static framer in main | frontend-design, performance-and-bundle | ReportDesigner.tsx |
| T013 | Lazy-load page transitions (App.tsx / shell) | 0.3h | AnimatePresence dynamic, main <70KB gz | performance-and-bundle | App.tsx |
| T014 | Audit date-fns imports for barrel usage | 0.2h | list of date-fns barrel imports | performance-and-bundle | grep date-fns |
| T015 | Convert date-fns to granular imports (format, parseISO, etc) | 0.3h | no `import { format } from 'date-fns'`, granular paths only, tsc PASS | performance-and-bundle | date-fns import diff |
| T016 | Audit ag-grid imports for AllCommunityModule | 0.2h | confirm no AllCommunityModule in prod, ModuleRegistry.registerModules used | ag-grid-modular-optimization | grep ag-grid |
| T017 | Split grid-vendor chunk: ensure ValidationModule dev-only | 0.2h | dev-only ValidationModule, prod bundle -20KB gz | ag-grid-modular-optimization | vite.config.ts |
| T018 | Audit recharts imports for barrel | 0.2h | list of recharts full imports | recharts-tree-shaking | grep recharts |
| T019 | Convert Treemap/Heatmap to dynamic import + granular LineChart | 0.4h | heavy charts lazy, LineChart 9.5KB min+gz, chart-vendor <100KB gz | recharts-tree-shaking | charts diff |
| T020 | Review vite.config.ts manualChunks: ensure function form, no generic /node_modules/ regex | 0.3h | manualChunks function, no preload-helper in pdf-vendor | vite-bundle-deep-optimization | vite.config.ts diff |
| T021 | Optimize sector-pages chunk: per-sector split, avoid duplication | 0.3h | sector-pages <80KB gz, dedup improved | vite-bundle-deep-optimization | vite.config.ts |
| T022 | Optimize ui-primitives chunk: tree-shake Radix, lucide granular | 0.3h | ui-primitives <25KB gz | performance-and-bundle | vite.config.ts |
| T023 | Build after exceljs diet, measure gz | 0.2h | build PASS, gz <2050KB after exceljs dynamic | performance-and-bundle | bundle-check |
| T024 | Build after jspdf+framer diet, measure gz | 0.2h | gz <2020KB, critical path <450KB | performance-and-bundle | bundle-check |
| T025 | Build after date-fns+ag-grid+recharts diet, measure gz | 0.2h | gz <2000KB, target met | performance-and-bundle | bundle-check |
| T026 | Generate stats.html and document chunk sizes | 0.2h | stats.html generated, chunk table in plan | performance-and-bundle | dist/stats.html |
| T027 | Run bundle-check ratchet, ensure no warnings | 0.2h | bundle-check PASS, warnings 0 | gates-and-ratchets | bundle-check output |
| T028 | Verify lazy chunks load on demand (export, import, report) | 0.3h | manual test: export excel triggers exceljs chunk, pdf triggers pdf chunk | testing-strategy | e2e manual log |
| T029 | Update .prettierignore / docs for generated artifacts | 0.1h | COMPLETION_REGISTER.md etc in .prettierignore | docs-and-decisions | .prettierignore |
| T030 | Document bundle diet DEC and baseline update | 0.3h | DEC-076 recorded, baseline 2065→<2000KB, plan updated | docs-and-decisions | decision-log.md |

---

## Epic E2 — /cash Promotion to SUPPORTED (14th route) — T031-T055 — 6h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T031 | Audit current CashFlowPage/CashForecastPage states | 0.2h | existing empty detected, missing loading/error | financial-domain-modeling, onboarding-a-codebase | page source read |
| T032 | Read cashStore for isLoading, error, data | 0.2h | store fields identified, no missing | react-state-and-stores | cashStore.ts |
| T033 | Add loading state to CashFlowPage with Skeleton | 0.3h | isLoading→Skeleton, srLabel present, a11y PASS | accessibility-wcag, frontend-design | CashFlowPage.tsx diff |
| T034 | Add error state to CashFlowPage with ErrorState role=alert | 0.2h | error→ErrorState, retry CTA, role=alert | accessibility-wcag | CashFlowPage.tsx |
| T035 | Add empty state to CashFlowPage with CTA to import | 0.2h | empty→EmptyState, CTA wired | frontend-design | CashFlowPage.tsx |
| T036 | Add journey test for /cash happy path | 0.3h | journey test PASS, file exists | test-driven-development | CashFlowPage.journey.test.tsx |
| T037 | Add empty test for /cash | 0.2h | empty test PASS | test-driven-development | CashFlowPage.empty.test.tsx |
| T038 | Add error test for /cash | 0.2h | error test PASS, role=alert asserted | test-driven-development | CashFlowPage.error.test.tsx |
| T039 | Add loading test for /cash | 0.2h | loading test PASS, Skeleton asserted | test-driven-development | CashFlowPage.loading.test.tsx |
| T040 | Interop test: 4-state combined for CashFlowPage | 0.3h | 4 tests PASS in one file | test-driven-development | CashFlowPage.interop.test.tsx |
| T041 | Repeat loading for CashForecastPage | 0.2h | Skeleton, isLoading wired | react-state-and-stores | CashForecastPage.tsx |
| T042 | Repeat error for CashForecastPage | 0.2h | ErrorState role=alert | accessibility-wcag | CashForecastPage.tsx |
| T043 | Repeat empty for CashForecastPage | 0.2h | EmptyState CTA | frontend-design | CashForecastPage.tsx |
| T044 | Interop 4-state for CashForecastPage | 0.3h | 4 tests PASS | test-driven-development | CashForecastPage.interop.test.tsx |
| T045 | Add RBAC action cash:read to route | 0.2h | RBAC pinned, governance evidence | security-and-permissions | route guard |
| T046 | Add audit log for cash view/edit | 0.2h | auditTrailStore write, hash-chained | audit-trail-and-lineage | cashStore |
| T047 | Add period write-guard to cash actions | 0.2h | close period blocks write, test PASS | close-and-consolidation | cashStore |
| T048 | Wire spine-evidence.json for /cash CONNECTED | 0.2h | test ids resolve, spine:evidence PASS | verification-before-completion | spine-evidence.json |
| T049 | Wire governance-evidence.json for /cash GOVERNED | 0.2h | authz+audit+write-guard ids resolve, governance:evidence PASS | verification-before-completion | governance-evidence.json |
| T050 | Update completion-register.json: /cash SUPPORTED | 0.2h | SUPPORTED with test ids, docs:verify PASS | docs-and-decisions | completion-register.json |
| T051 | Update CAPABILITY_TRUTH_MATRIX.md via generator | 0.2h | matrix shows CONNECTED GOVERNED, no manual edit | docs-and-decisions | matrix gen |
| T052 | Run docs:verify, docs:links --strict | 0.2h | PASS | docs-and-decisions | verify output |
| T053 | Run money:ast, money:adoption on cash modules | 0.2h | 0 unsafe, adoption maintained | money-and-decimals | money:ast |
| T054 | Run tsc, eslint, format:check | 0.2h | PASS | gates-and-ratchets | tsc output |
| T055 | Document cash promotion in TASKBOARD + HANDOVER | 0.2h | TASKBOARD DONE, HANDOVER entry | docs-and-decisions | TASKBOARD.md |

---

## Epic E3 — /workforce Promotion to SUPPORTED (15th route) — T056-T080 — 6h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T056 | Audit WorkforceDashboard/HeadcountPlan states | 0.2h | empty exists, loading/error missing | financial-domain-modeling | page read |
| T057 | Read workforceStore fields | 0.2h | isLoading, error identified | react-state-and-stores | workforceStore.ts |
| T058 | Add loading Skeleton to WorkforceDashboard | 0.3h | Skeleton srLabel, a11y | accessibility-wcag | WorkforceDashboard.tsx |
| T059 | Add error ErrorState role=alert | 0.2h | role=alert, retry | accessibility-wcag | WorkforceDashboard.tsx |
| T060 | Add empty EmptyState CTA to planning | 0.2h | CTA to create plan | frontend-design | WorkforceDashboard.tsx |
| T061 | Journey test WorkforceDashboard | 0.3h | PASS | test-driven-development | .journey.test.tsx |
| T062 | Empty test | 0.2h | PASS | test-driven-development | .empty.test.tsx |
| T063 | Error test | 0.2h | PASS | test-driven-development | .error.test.tsx |
| T064 | Loading test | 0.2h | PASS | test-driven-development | .loading.test.tsx |
| T065 | Interop 4-state combined | 0.3h | 4 PASS | test-driven-development | WorkforceDashboard.interop.test.tsx |
| T066 | Add loading to HeadcountPlanPage | 0.2h | Skeleton | react-state-and-stores | HeadcountPlanPage.tsx |
| T067 | Add error to HeadcountPlanPage | 0.2h | ErrorState | accessibility-wcag | HeadcountPlanPage.tsx |
| T068 | Add empty to HeadcountPlanPage | 0.2h | EmptyState | frontend-design | HeadcountPlanPage.tsx |
| T069 | Interop 4-state HeadcountPlan | 0.3h | PASS | test-driven-development | HeadcountPlan.interop.test.tsx |
| T070 | RBAC workforce:read/write | 0.2h | pinned | security-and-permissions | guard |
| T071 | Audit log workforce | 0.2h | hash-chained | audit-trail-and-lineage | workforceStore |
| T072 | Write-guard period close | 0.2h | blocks | close-and-consolidation | workforceStore |
| T073 | Driver-based modeling: headcount driver cascade | 0.3h | driver → cost → P&L tie-out, oracle test | driver-based-scenario-modeling | workforce driver test |
| T074 | Spine evidence /workforce | 0.2h | ids resolve | verification-before-completion | spine-evidence.json |
| T075 | Governance evidence /workforce | 0.2h | ids resolve | verification-before-completion | governance-evidence.json |
| T076 | completion-register SUPPORTED | 0.2h | SUPPORTED | docs-and-decisions | completion-register.json |
| T077 | Matrix regen | 0.2h | CONNECTED GOVERNED | docs-and-decisions | matrix |
| T078 | docs:verify, links --strict | 0.2h | PASS | docs-and-decisions | verify |
| T079 | tsc, eslint, format | 0.2h | PASS | gates-and-ratchets | tsc |
| T080 | TASKBOARD + HANDOVER | 0.2h | DONE | docs-and-decisions | TASKBOARD |

---

## Epic E4 — /treasury Promotion to SUPPORTED (16th route) — T081-T105 — 6h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T081 | Audit TreasuryDashboard/CashPosition/FXExposure | 0.2h | missing states identified | financial-domain-modeling | page read |
| T082 | Read treasuryStore | 0.2h | isLoading error | react-state-and-stores | treasuryStore.ts |
| T083 | Loading TreasuryDashboard | 0.3h | Skeleton | accessibility-wcag | TreasuryDashboard.tsx |
| T084 | Error TreasuryDashboard | 0.2h | role=alert | accessibility-wcag | TreasuryDashboard.tsx |
| T085 | Empty TreasuryDashboard CTA | 0.2h | EmptyState | frontend-design | TreasuryDashboard.tsx |
| T086 | Journey test TreasuryDashboard | 0.3h | PASS | test-driven-development | journey.test.tsx |
| T087 | Empty test | 0.2h | PASS | test-driven-development | empty.test.tsx |
| T088 | Error test | 0.2h | PASS | test-driven-development | error.test.tsx |
| T089 | Loading test | 0.2h | PASS | test-driven-development | loading.test.tsx |
| T090 | Interop 4-state TreasuryDashboard | 0.3h | 4 PASS | test-driven-development | interop.test.tsx |
| T091 | Loading CashPositionPage | 0.2h | Skeleton | react-state-and-stores | CashPositionPage.tsx |
| T092 | Error CashPositionPage | 0.2h | ErrorState | accessibility-wcag | CashPositionPage.tsx |
| T093 | Empty CashPositionPage | 0.2h | EmptyState | frontend-design | CashPositionPage.tsx |
| T094 | Interop CashPositionPage | 0.3h | PASS | test-driven-development | interop.test.tsx |
| T095 | Loading FXExposurePage | 0.2h | Skeleton | react-state-and-stores | FXExposurePage.tsx |
| T096 | Error FXExposurePage | 0.2h | ErrorState | accessibility-wcag | FXExposurePage.tsx |
| T097 | Empty FXExposurePage | 0.2h | EmptyState | frontend-design | FXExposurePage.tsx |
| T098 | Interop FXExposurePage | 0.3h | PASS | test-driven-development | interop.test.tsx |
| T099 | RBAC treasury:read | 0.2h | pinned | security-and-permissions | guard |
| T100 | Audit log treasury | 0.2h | hash-chained | audit-trail-and-lineage | treasuryStore |
| T101 | Write-guard treasury | 0.2h | blocks | close-and-consolidation | treasuryStore |
| T102 | FX translation oracle: ASC 830 tie-out | 0.3h | FX rate * amount = translated, oracle test PASS | money-and-decimals, asc-810-consolidation-elimination | fx oracle test |
| T103 | Spine evidence /treasury | 0.2h | ids resolve | verification-before-completion | spine-evidence.json |
| T104 | Governance evidence /treasury | 0.2h | ids resolve | verification-before-completion | governance-evidence.json |
| T105 | Register SUPPORTED + docs:verify + TASKBOARD | 0.4h | SUPPORTED 16/60, gov 16/48, docs:verify PASS | docs-and-decisions | completion-register |

---

## Epic E5 — REPORT Promotion — 3 Report Pages to SUPPORTED (17th-19th routes) — T106-T135 — 8h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T106 | Audit BalanceSheetPage states | 0.2h | existing states listed | financial-domain-modeling | page read |
| T107 | Audit CashFlowPage report states | 0.2h | listed | financial-domain-modeling | page read |
| T108 | Audit ProfitLossPage states | 0.2h | listed | financial-domain-modeling | page read |
| T109 | Add loading to BalanceSheetPage | 0.3h | Skeleton srLabel | accessibility-wcag | BalanceSheetPage.tsx |
| T110 | Add error to BalanceSheetPage | 0.2h | role=alert | accessibility-wcag | BalanceSheetPage.tsx |
| T111 | Add empty to BalanceSheetPage | 0.2h | EmptyState | frontend-design | BalanceSheetPage.tsx |
| T112 | Journey test BalanceSheetPage | 0.3h | PASS | test-driven-development | journey.test.tsx |
| T113 | Empty/error/loading tests BalanceSheetPage | 0.4h | 3 PASS | test-driven-development | empty/error/loading tests |
| T114 | Interop 4-state BalanceSheetPage | 0.3h | 4 PASS | test-driven-development | interop.test.tsx |
| T115 | Add loading to CashFlowPage report | 0.3h | Skeleton | accessibility-wcag | CashFlowPage report |
| T116 | Add error to CashFlowPage report | 0.2h | role=alert | accessibility-wcag | CashFlowPage report |
| T117 | Add empty to CashFlowPage report | 0.2h | EmptyState | frontend-design | CashFlowPage report |
| T118 | Journey/empty/error/loading CashFlowPage report | 0.5h | 4 PASS | test-driven-development | interop.test.tsx |
| T119 | Add loading to ProfitLossPage | 0.3h | Skeleton | accessibility-wcag | ProfitLossPage.tsx |
| T120 | Add error to ProfitLossPage | 0.2h | role=alert | accessibility-wcag | ProfitLossPage.tsx |
| T121 | Add empty to ProfitLossPage | 0.2h | EmptyState | frontend-design | ProfitLossPage.tsx |
| T122 | Journey/empty/error/loading ProfitLossPage | 0.5h | 4 PASS | test-driven-development | interop.test.tsx |
| T123 | Tie-back test: BalanceSheet screen → XLSX export | 0.4h | tie-out oracle, formula-preserving | reconciliation-and-tie-out | tie-back test |
| T124 | Tie-back test: CashFlow screen → XLSX export | 0.4h | tie-out | reconciliation-and-tie-out | tie-back test |
| T125 | Tie-back test: P&L screen → XLSX export | 0.4h | tie-out | reconciliation-and-tie-out | tie-back test |
| T126 | Formula-preserving XLSX: live <f> + cached <v> verified | 0.3h | inspectFormulaWorkbookBytes PASS | excel-and-report-exports | financialPackageExport.test.ts |
| T127 | PDF export tie-back: screen → PDF | 0.3h | pdf contains metrics | reporting-and-analytics | pdf tie-back test |
| T128 | RBAC report:read for 3 pages | 0.2h | pinned 3 actions | security-and-permissions | guard |
| T129 | Audit log for report views | 0.2h | hash-chained | audit-trail-and-lineage | report store |
| T130 | Spine evidence for 3 report pages (17-19th routes) | 0.4h | 3 routes ids resolve, spine 19/72 | verification-before-completion | spine-evidence.json |
| T131 | Governance evidence for 3 report pages | 0.4h | gov 19/57, ids resolve | verification-before-completion | governance-evidence.json |
| T132 | completion-register SUPPORTED 19 routes | 0.2h | SUPPORTED 39 (19 routes + 20 caps?) | docs-and-decisions | completion-register.json |
| T133 | Matrix regen, one-stop 16+ routes | 0.2h | one-stop census PASS | docs-and-decisions | matrix |
| T134 | docs:verify, links --strict, tsc, eslint | 0.3h | PASS | gates-and-ratchets | verify |
| T135 | TASKBOARD + HANDOVER report promotion | 0.2h | DONE | docs-and-decisions | TASKBOARD |

---

## Epic E6 — Money Adoption N8 — 45% Target — T136-T160 — 6h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T136 | Measure money:adoption baseline 36.37% (371/1020) | 0.2h | baseline recorded | money-and-decimals | money-adoption.mjs |
| T137 | List top 20 modules with number money | 0.2h | list with file:line | money-and-decimals | adoption report |
| T138 | Migrate src/engines/consolidation/* to Money | 0.4h | Money arithmetic, toDecimal, tsc PASS | money-and-decimals, asc-810-consolidation-elimination | consolidation engine |
| T139 | Migrate src/engines/fx/* to Money | 0.3h | FX Money | money-and-decimals | fx engine |
| T140 | Migrate src/engines/cash/* to Money | 0.3h | Money | money-and-decimals | cash engine |
| T141 | Migrate src/engines/workforce/* to Money | 0.3h | Money | money-and-decimals | workforce engine |
| T142 | Migrate src/engines/budget/* to Money | 0.3h | Money | money-and-decimals | budget engine |
| T143 | Migrate src/engines/forecast/* to Money | 0.3h | Money | money-and-decimals | forecast engine |
| T144 | Migrate src/engines/scenario/* to Money | 0.3h | Money | money-and-decimals | scenario engine |
| T145 | Migrate src/services/export/* to Money | 0.3h | Money, exact strings | money-and-decimals | export service |
| T146 | Migrate src/stores/cashStore, treasuryStore | 0.3h | Money store, no number | money-and-decimals | stores |
| T147 | Migrate src/stores/workforceStore | 0.2h | Money | money-and-decimals | store |
| T148 | Migrate src/components/report/* to Money | 0.3h | Money display, accounting format | money-and-decimals | report components |
| T149 | Remove trivial toDecimal(0) markers, replace with real arithmetic | 0.4h | trivial markers -20, real arithmetic + | money-and-decimals | grep trivial |
| T150 | Add oracle tests: 25/25 financial oracles PASS | 0.3h | oracle-value tests green | reconciliation-and-tie-out | oracle tests |
| T151 | Run money:ast — ensure 0 unsafe | 0.2h | 0 unsafe | money-and-decimals | money:ast |
| T152 | Run money:adoption — target 45%+ (459/1020) | 0.2h | 45%+ | money-and-decimals | adoption output |
| T153 | Update baseline file for ratchet | 0.1h | baseline updated 36.37→45% | gates-and-ratchets | baseline file |
| T154 | tsc --noEmit, eslint --max-warnings 0 | 0.2h | PASS | gates-and-ratchets | tsc |
| T155 | test:sharded shard for money modules | 0.3h | PASS | testing-strategy | vitest shard |
| T156 | docs:verify money adoption gate | 0.1h | PASS | docs-and-decisions | verify |
| T157 | Verify no ??0 on money reads in supported surfaces | 0.2h | missingIsNotZero 0 | data-integrity | missingIsNotZero census |
| T158 | Document money migration DEC-077 | 0.2h | DEC recorded | docs-and-decisions | decision-log.md |
| T159 | TASKBOARD money row update | 0.1h | 45% recorded | docs-and-decisions | TASKBOARD |
| T160 | Commit money adoption 45% | 0.1h | commit with evidence | verification-before-completion | git log |

---

## Epic E7 — AI Hardening — Verified-Facts Gate + NLQ + Copilot — T161-T185 — 8h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T161 | Audit all AI surfaces via grep: NLQChat, copilot, narrative | 0.2h | list of AI surfaces | ai-and-nlq | grep AI |
| T162 | Verify verifiedFactsGate exists and is tested | 0.2h | gate file + test exists | ai-and-nlq | verifiedFactsGate.ts |
| T163 | Ensure no external AI egress: grep fetch openai anthropic | 0.2h | 0 egress | security-and-permissions | grep egress |
| T164 | Audit NLQChatPage corpus 6/6 | 0.2h | corpus files exist, 6 intents | ai-and-nlq | corpus json |
| T165 | Wire verifiedFactsGate to NLQChatPage responses | 0.4h | every NLQ response passes gate, test PASS | ai-and-nlq | NLQChatPage.tsx |
| T166 | Wire gate to BoardPack narrative generation | 0.3h | narrative → gate, no invented figures | audit-trail-and-lineage | BoardPack narrative |
| T167 | Wire gate to variance explanation | 0.3h | variance → gate | audit-trail-and-lineage | variance engine |
| T168 | Wire gate to forecast narrative | 0.3h | forecast → gate | audit-trail-and-lineage | forecast narrative |
| T169 | Add test: NLQ returns verified facts only | 0.3h | verifiedFactsGate test PASS | test-driven-development | NLQChatPage.test.tsx |
| T170 | Add test: narrative with invented figure blocked | 0.3h | blocked, error message | test-driven-development | verifiedFactsGate.test.ts |
| T171 | Add test: no egress in AI modules | 0.2h | egress test PASS | security-and-permissions | ai egress test |
| T172 | Local-only enforcement: no window.ai, no external SDK | 0.2h | 0 external SDK imports | security-and-permissions | grep |
| T173 | Explicit invocation: AI only on user action | 0.2h | no auto-invoke, test | ai-and-nlq | invocation test |
| T174 | Audit trail for AI: log prompt, response, gate result | 0.3h | auditTrailStore AI entry, hash-chained | audit-trail-and-lineage | audit log |
| T175 | Add AI census script: 0 ungated surfaces | 0.3h | ai-census.js PASS, 0 ungated | ai-and-nlq | ai-census.mjs |
| T176 | Wire ai-census into docs:verify | 0.2h | docs:verify runs census | docs-and-decisions | docs:verify |
| T177 | Update completion-register: AI capability GOVERNED | 0.2h | AI row GOVERNED with test ids | docs-and-decisions | completion-register |
| T178 | docs:links --strict for AI docs | 0.2h | PASS, backticked paths resolve | docs-and-decisions | docs:links |
| T179 | tsc, eslint for AI modules | 0.2h | PASS | gates-and-ratchets | tsc |
| T180 | test:sharded AI shards | 0.3h | PASS | testing-strategy | vitest |
| T181 | Document AI hardening DEC-078 | 0.2h | DEC recorded, no unverified claims | docs-and-decisions | decision-log |
| T182 | Update OWNER_DECISION_PACKET O6 (non-local AI blocked) | 0.2h | O6 documented, default not claimed | owner-decisions | OWNER packet |
| T183 | Verify no D365 verified claim (O1) in AI responses | 0.2h | grep D365 verified → 0 | requirements-traceability | grep |
| T184 | Verify no "your data is safe" (O3) claim | 0.2h | grep data safe → 0 | requirements-traceability | grep |
| T185 | TASKBOARD AI row DONE + HANDOVER | 0.2h | DONE | docs-and-decisions | TASKBOARD |

---

## Epic E8 — A11y + Perf Gates — AA, Keyboard, Focus, Perf Budgets — T186-T205 — 6h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T186 | Audit current a11y: axe on 19 SUPPORTED routes | 0.4h | axe report, 0 critical | accessibility-wcag | axe output |
| T187 | Fix color contrast: palette 5501→≤5501, no raw bg-slate-800 | 0.3h | palette ratchet PASS, semantic vars | accessibility-wcag, frontend-design | palette check |
| T188 | Add keyboard navigation to DataGrid | 0.3h | keyboard test <250ms, focus visible | accessibility-wcag | DataGrid.keyboardPerf.test.ts |
| T189 | Add focus trap to modals/dialogs | 0.3h | focus trap test PASS, no focus leak | accessibility-wcag | focus trap test |
| T190 | Add srLabel to all Skeletons | 0.2h | srLabel present, axe PASS | accessibility-wcag | Skeleton.tsx |
| T191 | Add role=alert to all ErrorStates | 0.2h | role=alert asserted in tests | accessibility-wcag | ErrorState.tsx |
| T192 | Verify EmptyState CTA keyboard accessible | 0.2h | keyboard enter triggers CTA | accessibility-wcag | EmptyState.tsx |
| T193 | Add skip-link and landmark roles to shell | 0.2h | landmarks present, axe PASS | accessibility-wcag | AppShell.tsx |
| T194 | Perf budget: DataGrid keyboard <250ms | 0.3h | test PASS, no flake | performance-and-bundle | keyboardPerf test |
| T195 | Perf budget: glStore loadBench <10000ms | 0.3h | test PASS, 10542→<10000ms | performance-and-bundle | loadBench test |
| T196 | Perf budget: bundle <2000KB gz, critical <450KB, main <70KB | 0.2h | bundle-check PASS | performance-and-bundle | bundle-check |
| T197 | Add a11y-q5-gate script run | 0.2h | q5 gate PASS | accessibility-wcag | a11y-q5-gate.js |
| T198 | Wire a11y and perf into docs:verify | 0.2h | docs:verify runs a11y+perf | docs-and-decisions | docs:verify |
| T199 | test:sharded a11y shard | 0.3h | PASS | testing-strategy | vitest shard |
| T200 | tsc, eslint, format:check | 0.2h | PASS | gates-and-ratchets | tsc |
| T201 | Document a11y AA compliance in docs | 0.2h | docs/a11y.md updated | accessibility-wcag | docs |
| T202 | Document perf budgets in docs | 0.2h | docs/perf.md updated | performance-and-bundle | docs |
| T203 | Update completion-register: a11y+perf GOVERNED | 0.2h | GOVERNED with test ids | docs-and-decisions | completion-register |
| T204 | TASKBOARD a11y+perf DONE | 0.1h | DONE | docs-and-decisions | TASKBOARD |
| T205 | Commit a11y+perf | 0.1h | commit | verification-before-completion | git log |

---

## Epic E9 — Docs + Owner Pack + Decision Log + Handover + Full Gates — T206-T225 — 6h

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T206 | Audit docs/plan/ for stale files | 0.2h | stale list, 0 broken links | docs-and-decisions | docs:links |
| T207 | Regenerate completion-register.json from generators | 0.3h | 695 rows, SUPPORTED 39, EXPERIMENTAL 429, BLOCKED 7, NOT_BUILT 220 | docs-and-decisions | completion-register.json |
| T208 | Regenerate COMPLETION_REGISTER.md view | 0.1h | view matches JSON, --check PASS | docs-and-decisions | COMPLETION_REGISTER.md |
| T209 | Regenerate CAPABILITY_TRUTH_MATRIX.md | 0.2h | 231 routes, 19 routes CONNECTED GOVERNED, matrix gen PASS | docs-and-decisions | matrix |
| T210 | Regenerate ROUTE_MAP.md | 0.1h | 231 routes, dispositions 0 REVIEW | docs-and-decisions | ROUTE_MAP.md |
| T211 | Update TASKBOARD.md: 225 tasks, 19 routes SUPPORTED, money 45%, bundle <2000KB | 0.3h | TASKBOARD DONE rows | docs-and-decisions | TASKBOARD.md |
| T212 | Update decision-log.md: DEC-076-085 | 0.4h | 10 DECs recorded, reason + commit | docs-and-decisions | decision-log.md |
| T213 | Regenerate OWNER_DECISION_PACKET.md O1-O9 | 0.3h | O1-O9 with question, options, default not claimed, what blocks | owner-decisions | OWNER packet |
| T214 | Update COMPLETION_PLAN_86_100.md with PR #95 actuals | 0.2h | SUPPORTED 39 actuals, no unverified claims | docs-and-decisions | COMPLETION_PLAN |
| T215 | Update PR_95_60H_PLAN.md with actuals and evidence | 0.2h | actuals, bundle <2000KB, 225 tasks DONE | docs-and-decisions | this file |
| T216 | Run docs:verify full | 0.3h | PASS | docs-and-decisions | verify output |
| T217 | Run docs:links --strict | 0.2h | PASS, backticked *.md resolve | docs-and-decisions | links output |
| T218 | Run tsc --noEmit | 0.3h | PASS | gates-and-ratchets | tsc |
| T219 | Run eslint src --max-warnings 0 | 0.3h | PASS | gates-and-ratchets | eslint |
| T220 | Run prettier --check (format:check) | 0.2h | PASS | gates-and-ratchets | prettier |
| T221 | Run test:sharded 8/8 shards sequentially (400s per shard) | 0.8h | 8/8 PASS, 2 perf flakes documented as known if remain | testing-strategy | sharded output |
| T222 | Run bundle-check, skills:verify, routemap:check | 0.3h | PASS, <2000KB gz, 56 skills, 231 routes | gates-and-ratchets | bundle-check |
| T223 | Write HANDOVER.md for PR #95: what changed, what not claimed, next | 0.3h | HANDOVER with failing-first evidence, gate lines, no O1/O3/O4/O8/O9 claims | docs-and-decisions | HANDOVER.md |
| T224 | Final git push and PR body file with 225 tasks evidence | 0.2h | push PASS, body file with evidence table | verification-before-completion | git push |
| T225 | Verify no PR created until 60h productive evidence (this file + git log) | 0.1h | evidence: 225 tasks * avg 0.267h = 60h, git log shows 225 commits or batched commits with 60h wall-time log | verification-before-completion | plan + log |

---

## Sequencing (parallel where possible)

```
E1 T001-T030 bundle diet (8h) ─┐
                               ├─► E2 cash T031-T055 (6h) ─┐
                               ├─► E3 workforce T056-T080 (6h) ─┼─► E5 reports T106-T135 (8h) ─┐
                               ├─► E4 treasury T081-T105 (6h) ─┘                               │
                                                                                               ├─► E6 money 45% T136-T160 (6h) ─┐
                                                                                               │                               ├─► E7 AI hardening T161-T185 (8h) ─┐
                                                                                               │                               │                                ├─► E8 a11y+perf T186-T205 (6h) ─► E9 docs+owner T206-T225 (6h)
```

Wall-time compression: 60h productive / ~20 parallel workers = ~3h wall with unlimited tokens (as per user quota).

## Failure controls

- No gate weakened to pass — if rule wrong, DEC in public with reason.
- No breadth deleted to make numbers look better (DEC-006).
- No unverified claims: O1 D365 verified, O3 data safe, O4 SOX, O8 CI green, O9 entity-scope.
- Backticked paths must resolve — `docs:links --strict` treats backticked *.md as real path.
- Repo-only deliverables; merge PR with `gh pr merge <n> --merge` when gates green.
- Money adoption markers must be replaced with real arithmetic where possible — trivial `toDecimal(0)` is debt, not goal.
- Bundle diet must be measured before/after — `npm run build` + `bundle-check` + `stats.html`.
- 225 tasks must each have evidence file, not just doc bump.
- No PR created until 60h productive evidence (T225).

## Current debt from last 2 PRs

- PR #93 and #94 closed early per user — 40h debt.
- This PR covers debt + current 20h = 60h nonstop.
- Must produce substantial product evidence, not just doc bumps.

## Exit criteria (60h)

- SUPPORTED 30→39 (13→19 routes, 17→20+ caps)
- Money adoption 36.37%→45%+
- Bundle <2000KB gz (stretch <1950KB), warnings 0, critical <450KB gz, main <70KB gz
- Palette ≤5501
- Test files 1423→~1450 (new interop tests for cash/workforce/treasury/reports)
- All gates PASS: docs:verify, docs:links --strict, tsc --noEmit, eslint --max-warnings 0, prettier --check, test:sharded 8/8 (perf flakes documented as known), bundle-check, skills:verify, routemap:check, spine:evidence, governance:evidence, one-stop, missingIsNotZero, money:ast, money:adoption, ai-census, a11y-q5
- No PR created until 60h productive evidence (T225).
- 225 tasks with evidence pointers.

## Zero-Compromise Expansion — 350 Additional Useful Tasks (T226-T575) — 82h

> User directive 2026-10-23: add at least 350 more tasks, no useless tasks, zero compromises. These 350 tasks are not filler — each closes a real gap from COMPLETION_PLAN_86_100.md C1-C6, covers remaining routes/engines/money/oracles/governance/bundle/a11y/perf/owner-pack/RC/release.

### Epic E10 — Route Expansion 20-40 SUPPORTED (T226-T300) — 15h — 75 tasks

Promote 25 additional routes beyond the 19 in E2-E5 to SUPPORTED. Each route requires 3 tasks: audit+implement 4-state, interop tests, governance+register. Zero compromise: every SUPPORTED route must have journey/empty/error/loading + RBAC + audit + write-guard + spine + governance evidence.

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T226 | Audit /budgets detail pages: states missing | 0.2h | audit list, empty exists loading/error missing | financial-domain-modeling | page read |
| T227 | Implement 4-state for /budgets/version | 0.3h | Skeleton, ErrorState role=alert, EmptyState CTA | accessibility-wcag | BudgetsVersionPage.tsx |
| T228 | Interop 4-state + RBAC + audit for /budgets/version | 0.3h | 4 tests PASS, governance evidence | test-driven-development | interop.test.tsx |
| T229 | Audit /scenarios/detail | 0.2h | audit | financial-domain-modeling | page read |
| T230 | Implement 4-state /scenarios/detail | 0.3h | Skeleton etc | accessibility-wcag | ScenariosDetailPage.tsx |
| T231 | Interop + governance /scenarios/detail | 0.3h | PASS, spine:evidence | test-driven-development | interop.test.tsx |
| T232 | Audit /forecasts/rolling | 0.2h | audit | forecast-and-budget | page read |
| T233 | Implement 4-state /forecasts/rolling | 0.3h | Skeleton | accessibility-wcag | RollingForecastPage.tsx |
| T234 | Interop + governance /forecasts/rolling | 0.3h | PASS | test-driven-development | interop.test.tsx |
| T235 | Audit /consolidation/ic-elimination | 0.2h | audit | close-and-consolidation | page read |
| T236 | Implement 4-state /consolidation/ic-elimination | 0.3h | Skeleton | accessibility-wcag | ICEliminationPage.tsx |
| T237 | Interop + governance + ASC 810 tie-out /consolidation/ic-elimination | 0.4h | oracle PASS, elimination 100% regardless NCI | asc-810-consolidation-elimination | ic-elimination oracle |
| T238 | Audit /data/gl-explorer/detail | 0.2h | audit | data-integrity | page read |
| T239 | Implement 4-state /data/gl-explorer/detail | 0.3h | Skeleton | accessibility-wcag | GLExplorerDetailPage.tsx |
| T240 | Interop + governance /data/gl-explorer/detail | 0.3h | PASS | test-driven-development | interop.test.tsx |
| T241 | Audit /data/mapping | 0.2h | audit | import-and-mapping | page read |
| T242 | Implement 4-state /data/mapping | 0.3h | Skeleton | accessibility-wcag | MappingPage.tsx |
| T243 | Interop + governance /data/mapping | 0.3h | PASS, mapping confidence 0-1 | test-driven-development | interop.test.tsx |
| T244 | Audit /data/quarantine | 0.2h | audit | data-integrity | page read |
| T245 | Implement 4-state /data/quarantine | 0.3h | Skeleton, quarantine reason visible | accessibility-wcag | QuarantinePage.tsx |
| T246 | Interop + governance /data/quarantine | 0.3h | PASS, missingIsNotZero census | test-driven-development | interop.test.tsx |
| T247 | Audit /periods/close/checklist | 0.2h | audit | close-and-consolidation | page read |
| T248 | Implement 4-state /periods/close/checklist | 0.3h | Skeleton | accessibility-wcag | CloseChecklistPage.tsx |
| T249 | Interop + governance + write-guard /periods/close/checklist | 0.4h | close blocks write, audit hash-chained | close-and-consolidation | interop.test.tsx |
| T250 | Audit /reports/board-pack/detail | 0.2h | audit | reporting-and-analytics | page read |
| T251 | Implement 4-state /reports/board-pack/detail | 0.3h | Skeleton | accessibility-wcag | BoardPackDetailPage.tsx |
| T252 | Interop + tie-back XLSX/PDF/PPTX /reports/board-pack/detail | 0.4h | tie-back oracle PASS | reconciliation-and-tie-out | tie-back test |
| T253 | Audit /reports/variance | 0.2h | audit | reporting-and-analytics | page read |
| T254 | Implement 4-state /reports/variance | 0.3h | Skeleton, variance decomposition visible | accessibility-wcag | VariancePage.tsx |
| T255 | Interop + variance decomposition oracle /reports/variance | 0.4h | variance = actual-budget, oracle PASS | reconciliation-and-tie-out | variance oracle |
| T256 | Audit /reports/drilldown | 0.2h | audit | reporting-and-analytics | page read |
| T257 | Implement 4-state /reports/drilldown | 0.3h | Skeleton, drill-to-source visible | accessibility-wcag | DrilldownPage.tsx |
| T258 | Interop + lineage /reports/drilldown | 0.3h | lineage chain, audit | audit-trail-and-lineage | interop.test.tsx |
| T259 | Audit /admin/users | 0.2h | audit | security-and-permissions | page read |
| T260 | Implement 4-state /admin/users | 0.3h | Skeleton | accessibility-wcag | UsersPage.tsx |
| T261 | Interop + RBAC admin:users /admin/users | 0.3h | RBAC pinned, audit | security-and-permissions | interop.test.tsx |
| T262 | Audit /admin/settings | 0.2h | audit | security-and-permissions | page read |
| T263 | Implement 4-state /admin/settings | 0.3h | Skeleton | accessibility-wcag | SettingsPage.tsx |
| T264 | Interop + governance /admin/settings | 0.3h | PASS | test-driven-development | interop.test.tsx |
| T265 | Audit /admin/integrations | 0.2h | audit | import-and-mapping | page read |
| T266 | Implement 4-state /admin/integrations | 0.3h | Skeleton, D365 shape not claimed verified | accessibility-wcag | IntegrationsPage.tsx |
| T267 | Interop + no O1 claim /admin/integrations | 0.3h | grep O1 0, governance PASS | requirements-traceability | interop.test.tsx |
| T268 | Audit /data/corrections/detail | 0.2h | audit | close-and-consolidation | page read |
| T269 | Implement 4-state /data/corrections/detail | 0.3h | Skeleton | accessibility-wcag | CorrectionDetailPage.tsx |
| T270 | Interop + correction follow-through /data/corrections/detail | 0.4h | correction → audit → close checklist, one-stop PASS | audit-trail-and-lineage | interop.test.tsx |
| T271 | Audit /cash/position/detail (treasury drill) | 0.2h | audit | cash-and-treasury | page read |
| T272 | Implement 4-state /cash/position/detail | 0.3h | Skeleton | accessibility-wcag | CashPositionDetailPage.tsx |
| T273 | Interop + cash tie-out /cash/position/detail | 0.4h | cash = bank + adjustments, oracle PASS | cash-and-treasury | cash tie-out |
| T274 | Audit /workforce/compensation | 0.2h | audit | workforce-planning | page read |
| T275 | Implement 4-state /workforce/compensation | 0.3h | Skeleton | accessibility-wcag | CompensationPage.tsx |
| T276 | Interop + driver cascade /workforce/compensation | 0.4h | headcount driver → comp → P&L, oracle | driver-based-scenario-modeling | driver test |
| T277 | Audit /treasury/fx/detail | 0.2h | audit | cash-and-treasury | page read |
| T278 | Implement 4-state /treasury/fx/detail | 0.3h | Skeleton | accessibility-wcag | FXDetailPage.tsx |
| T279 | Interop + FX translation ASC 830 /treasury/fx/detail | 0.4h | FX oracle PASS | money-and-decimals | fx oracle |
| T280 | Audit /scenarios/assumptions | 0.2h | audit | scenario-modeling | page read |
| T281 | Implement 4-state /scenarios/assumptions | 0.3h | Skeleton, assumption owner visible | accessibility-wcag | AssumptionsPage.tsx |
| T282 | Interop + assumption lineage /scenarios/assumptions | 0.3h | lineage, audit | audit-trail-and-lineage | interop.test.tsx |
| T283 | Audit /forecasts/drivers | 0.2h | audit | driver-based-scenario-modeling | page read |
| T284 | Implement 4-state /forecasts/drivers | 0.3h | Skeleton, 5-7 drivers explain 80% variance | accessibility-wcag | DriversPage.tsx |
| T285 | Interop + driver-based modeling /forecasts/drivers | 0.4h | base/upside/downside consistent, oracle | driver-based-scenario-modeling | driver oracle |
| T286 | Audit /reports/balance-sheet/detail | 0.2h | audit | reporting-and-analytics | page read |
| T287 | Implement 4-state /reports/balance-sheet/detail | 0.3h | Skeleton | accessibility-wcag | BalanceSheetDetailPage.tsx |
| T288 | Interop + tie-back + formula-preserving /reports/balance-sheet/detail | 0.4h | <f> + <v> verified | excel-and-report-exports | tie-back |
| T289 | Audit /reports/cash-flow/detail | 0.2h | audit | reporting-and-analytics | page read |
| T290 | Implement 4-state /reports/cash-flow/detail | 0.3h | Skeleton | accessibility-wcag | CashFlowDetailPage.tsx |
| T291 | Interop + cash flow direct/indirect tie-out /reports/cash-flow/detail | 0.4h | CFO = NI + non-cash + WC, oracle | reconciliation-and-tie-out | cashflow oracle |
| T292 | Audit /reports/profit-loss/detail | 0.2h | audit | reporting-and-analytics | page read |
| T293 | Implement 4-state /reports/profit-loss/detail | 0.3h | Skeleton | accessibility-wcag | ProfitLossDetailPage.tsx |
| T294 | Interop + P&L tie-out /reports/profit-loss/detail | 0.4h | revenue - COGS = gross, oracle | reconciliation-and-tie-out | pl oracle |
| T295 | Update spine-evidence.json for 25 new routes (20-40) | 0.4h | 40 routes CONNECTED, test ids resolve, spine:evidence PASS | verification-before-completion | spine-evidence.json |
| T296 | Update governance-evidence.json for 25 new routes | 0.4h | 40 routes GOVERNED, RBAC+audit+write-guard, governance:evidence PASS | verification-before-completion | governance-evidence.json |
| T297 | Regenerate completion-register.json: 40 routes SUPPORTED | 0.3h | SUPPORTED 57 (40 routes + 17 caps), 695 rows, docs:verify PASS | docs-and-decisions | completion-register.json |
| T298 | Regenerate CAPABILITY_TRUTH_MATRIX.md + ROUTE_MAP.md | 0.2h | 40 CONNECTED GOVERNED, 0 REVIEW, matrix gen PASS | docs-and-decisions | matrix |
| T299 | Run docs:verify, docs:links --strict, tsc, eslint, bundle-check | 0.4h | PASS, bundle <2000KB | gates-and-ratchets | verify |
| T300 | TASKBOARD E10 DONE, HANDOVER 20-40 routes | 0.2h | DONE, no O1/O3/O4/O8/O9 claims | docs-and-decisions | TASKBOARD |

### Epic E11 — Engine Hardening & Reachability (T301-T375) — 15h — 75 tasks

180 engines total, 98 wired, 82 registered-only. Zero compromise: every engine must have caller or explicit EXPERIMENTAL with gap named, plus money safety, audit, tests.

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T301 | Audit engine-reachability: 180 reachable / 0 orphans vs docs:verify 98/82 | 0.2h | both counts documented, DEC-006 preserved | architecture-boundaries | engine-reachability.mjs |
| T302 | List 82 registered-only engines with gap | 0.2h | list with reason (not called by workflow) | docs-and-decisions | orphan list |
| T303 | Harden consolidation engine: 100% elimination regardless NCI | 0.4h | ASC 810-10-45-1/45-18, elimination oracle PASS | asc-810-consolidation-elimination | consolidation.test.ts |
| T304 | Harden consolidation: downstream vs upstream NCI attribution | 0.3h | downstream NCI attribution diff, oracle PASS | asc-810-consolidation-elimination | nci attribution test |
| T305 | Harden consolidation: VIE fees elimination | 0.3h | VIE fees eliminated, test PASS | asc-810-consolidation-elimination | vie test |
| T306 | Harden FX translation engine: current rate method | 0.3h | CTA calculation, oracle PASS | money-and-decimals | fx translation test |
| T307 | Harden FX: temporal method for non-monetary | 0.3h | temporal method, oracle | money-and-decimals | fx temporal test |
| T308 | Harden IC elimination engine: receivable/payable elimination | 0.3h | intercompany AR/AP eliminated, oracle | asc-810-consolidation-elimination | ic elimination test |
| T309 | Harden IC: interest/dividends/sales/unrealized profit elimination | 0.3h | 5 types eliminated, oracle | asc-810-consolidation-elimination | ic 5 types test |
| T310 | Harden revenue recognition engine: ASC 606 5-step | 0.4h | 5-step, oracle PASS | financial-domain-modeling | revenue test |
| T311 | Harden lease engine: ASC 842 ROU + liability | 0.4h | ROU = PV payments, oracle | financial-domain-modeling | lease test |
| T312 | Harden tax engine: deferred tax calculation | 0.3h | DTA/DTL, oracle | financial-domain-modeling | tax test |
| T313 | Harden multi-book engine: GAAP vs IFRS vs tax book | 0.3h | 3 books, tie-out | financial-domain-modeling | multi-book test |
| T314 | Harden driver-based scenario engine: 5-7 drivers explain 80% variance | 0.4h | driver → calc → output modular, oracle | driver-based-scenario-modeling | driver engine test |
| T315 | Harden rolling forecast engine: 12-18mo horizon, 5-day cycle, 75% auto-load | 0.4h | rolling forecast semantics, IBM 12% accuracy ref, oracle | rolling-forecast-implementation | rolling forecast test |
| T316 | Harden cash planning engine: direct method cash flow | 0.3h | cash = bank + adjustments, oracle | cash-and-treasury | cash engine test |
| T317 | Harden workforce engine: headcount → comp → P&L cascade | 0.3h | driver cascade, oracle | workforce-planning | workforce engine test |
| T318 | Harden CapEx engine: depreciation, connected to cash | 0.3h | CapEx → cash → P&L, assumption visible | financial-domain-modeling | capex engine test |
| T319 | Harden budget version engine: version control, assumptions owner-assigned | 0.3h | version diff, owner, audit | forecast-and-budget | budget version test |
| T320 | Harden scenario engine: base/upside/downside consistent | 0.3h | consistent drivers, oracle | scenario-modeling | scenario engine test |
| T321 | Harden variance engine: decomposition price/volume/mix | 0.4h | variance = price+volume+mix, oracle | reconciliation-and-tie-out | variance engine test |
| T322 | Harden exception rule engine: finding + disposition survives reload | 0.3h | disposition survives, audit | audit-trail-and-lineage | exception engine test |
| T323 | Harden close state machine: cannot bypass close | 0.3h | close blocks write, test PASS | close-and-consolidation | close engine test |
| T324 | Harden control totals engine: tie-out import → GL → TB | 0.3h | control totals tie, quarantine if short | data-integrity | control totals test |
| T325 | Harden lineage engine: source → transform → report chain | 0.3h | lineage chain, hash-chained audit | audit-trail-and-lineage | lineage test |
| T326 | Harden mapping engine: confidence 0-1, alias, manual override | 0.3h | confidence, alias, manual, test | import-and-mapping | mapping engine test |
| T327 | Harden validation engine: quarantine named, reason visible | 0.3h | quarantine, reason, missingIsNotZero | data-integrity | validation engine test |
| T328 | Harden exportExcel engine: sanitized, no live formula injection | 0.3h | F-0017, sanitizeSpreadsheetCell, no =cmd injection | excel-and-report-exports | exportExcel test |
| T329 | Harden exportPDF engine: dynamic jspdf, no static | 0.2h | dynamic import, bundle -179KB gz from main | performance-and-bundle | exportPDF engine |
| T330 | Harden financialPackageExport: formula-preserving <f> + <v> | 0.4h | live <f> + cached <v> exact, inspectFormulaWorkbookBytes PASS | excel-and-report-exports | financialPackageExport test |
| T331 | Harden boardPackExport: XLSX/PDF/PPTX tie-back | 0.3h | tie-back to screen, oracle | reporting-and-analytics | boardPack export test |
| T332 | Harden glXlsxTokenizer: DecompressionStream deflate-raw, no ExcelJS load | 0.3h | tokenizer 10x faster than ExcelJS, no ExcelJS in tokenizer | performance-and-bundle | tokenizer test |
| T333 | Harden ExcelImportEngine: dynamic, sanitized, streaming | 0.3h | dynamic, sanitize, streaming | excel-and-report-exports | import engine test |
| T334 | Harden MigrationEngine: column auto-detection, readiness scoring | 0.3h | autoMapColumns confidence, readiness score, rollback | import-and-mapping | migration engine test |
| T335 | Harden ImportEngine: CSV/XLSX intake, quarantine, control totals | 0.3h | intake → quarantine → tie-out | import-and-mapping | import engine test |
| T336 | Harden auditTrailStore: hash-chained, single canonical authority | 0.4h | hash chain, 10 modules classified via census, audit chain bounded | audit-trail-and-lineage | auditTrailStore test |
| T337 | Harden period close store: write-guards, checklist | 0.3h | write-guard, checklist, audit | close-and-consolidation | period close store test |
| T338 | Harden RBAC store: 409 pinned actions = 302 guarded + 107 reasoned exceptions | 0.3h | RBAC census closed, no O9 entity-scope claimed | security-and-permissions | rbac census |
| T339 | Harden dataGrid engine: keyboard <250ms, virtualized, a11y | 0.3h | keyboardPerf <250ms, virtualized, axe PASS | ag-grid-modular-optimization | DataGrid test |
| T340 | Harden chart engine: granular recharts, lazy Treemap/Heatmap | 0.3h | LineChart 9.5KB gz vs Treemap 99KB gz, lazy | recharts-tree-shaking | chart engine test |
| T341 | Harden reportDesigner engine: lazy framer-motion, no static in main | 0.3h | motion.lazy, main <70KB gz | performance-and-bundle | reportDesigner engine |
| T342 | Add unit tests for 10 orphan engines to prove EXPERIMENTAL gap named | 0.4h | 10 engines EXPERIMENTAL with certification gap, tests PASS | testing-strategy | orphan engine tests |
| T343 | Add unit tests for 10 more orphan engines | 0.4h | EXPERIMENTAL gap named | testing-strategy | orphan tests |
| T344 | Add unit tests for 10 more orphan engines | 0.4h | EXPERIMENTAL | testing-strategy | orphan tests |
| T345 | Add unit tests for 10 more orphan engines | 0.4h | EXPERIMENTAL | testing-strategy | orphan tests |
| T346 | Add unit tests for remaining 42 orphan engines | 0.6h | 82 orphan engines accounted, 0 hidden, docs:verify PASS | testing-strategy | orphan tests |
| T347 | Run money:ast on all 180 engines: 0 unsafe | 0.2h | 0 unsafe, 100% | money-and-decimals | money:ast |
| T348 | Run engine-reachability + docs:verify: counts match | 0.2h | 180 reachable, 98/82 split documented, PASS | docs-and-decisions | verify |
| T349 | Update completion-register.json: engines GOVERNED | 0.2h | 180 engines rows with GOVERNED where applicable, test ids | docs-and-decisions | completion-register |
| T350 | TASKBOARD E11 partial checkpoint | 0.1h | checkpoint, 50 engines hardened | docs-and-decisions | TASKBOARD |
| T351 | Harden driver-based planning: operational/financial/external drivers | 0.3h | 3 driver types, owner-assigned assumptions, oracle PASS | driver-based-scenario-modeling | driver types test |
| T352 | Harden rolling forecast: driver-based framework, 12-18mo horizon | 0.3h | driver-based framework, 12-18mo, oracle PASS | rolling-forecast-implementation | rolling framework test |
| T353 | Harden consolidation: intercompany elimination single economic entity | 0.3h | single economic entity, 100% elimination, ASC 810-10-45-1 | asc-810-consolidation-elimination | consolidation entity test |
| T354 | Harden consolidation: intercompany sales elimination | 0.2h | sales elimination, oracle | asc-810-consolidation-elimination | sales elimination test |
| T355 | Harden consolidation: unrealized profit elimination | 0.3h | unrealized profit eliminated, downstream vs upstream NCI diff | asc-810-consolidation-elimination | unrealized profit test |
| T356 | Harden GL trial balance engine: balanced, tie-out to GL | 0.2h | TB balanced, tie-out oracle | data-integrity | tb engine test |
| T357 | Harden GL journals engine: double-entry, audit trail | 0.2h | double-entry, hash-chained audit | audit-trail-and-lineage | gl journals test |
| T358 | Harden GL explorer: drill-to-source, lineage | 0.3h | drill-to-source, lineage chain | audit-trail-and-lineage | gl explorer test |
| T359 | Harden data import: D365 shapes F&O GL, journal entity, BC G/L | 0.4h | D365 shapes synthetic fixtures only, no verified claim O1, intake test | import-and-mapping | d365 shapes test |
| T360 | Harden data import: CSV/XLSX mapping confidence + alias | 0.3h | confidence 0-1, alias, manual, mapping test | import-and-mapping | csv xlsx mapping test |
| T361 | Harden data validation: control totals, quarantine, lineage | 0.3h | control totals tie, quarantine reason, lineage | data-integrity | validation test |
| T362 | Harden period close: scope period/entity, trial balance, tie-out | 0.3h | period/entity scope, TB tie-out, close state machine | close-and-consolidation | period close test |
| T363 | Harden close checklist: human attribution, reviews, approvals | 0.3h | checklist with attribution, reviews, approvals, audit | close-and-consolidation | close checklist test |
| T364 | Harden corrections: follow-through, RBAC, audit, one-stop | 0.3h | correction → audit → close, one-stop census PASS | audit-trail-and-lineage | corrections test |
| T365 | Harden budget: versions, assumptions, drivers/cascades | 0.3h | versions, assumptions owner, driver cascade | forecast-and-budget | budget test |
| T366 | Harden forecast: rolling forecast semantics O2 BLOCKED if unanswered | 0.3h | rolling semantics BLOCKED-ON-OWNER O2 unless answered, default not claimed | owner-decisions | forecast semantics test |
| T367 | Harden scenario: assumptions visible, driver-based, base/upside/downside | 0.3h | assumptions visible, driver-based, consistent | scenario-modeling | scenario test |
| T368 | Harden operational planning: cash connected to financial outcomes | 0.3h | cash planning → P&L, assumptions visible | cash-and-treasury | operational cash test |
| T369 | Harden operational: workforce connected to financial outcomes | 0.3h | workforce → P&L, assumptions visible | workforce-planning | operational workforce test |
| T370 | Harden reporting: statements variance decomposition, drill-to-source | 0.3h | variance decomposition, drill-to-source, findings disposition | reporting-and-analytics | reporting test |
| T371 | Harden reporting: board pack XLSX formula-preserving, PDF, PPTX editable | 0.4h | XLSX <f>+<v>, PDF, PPTX editable, tie-back | excel-and-report-exports | reporting export test |
| T372 | Harden workflow & governance: reviews, approvals, correction follow-through, RBAC, auditability | 0.4h | reviews, approvals, correction follow-through, RBAC, audit | security-and-permissions | workflow governance test |
| T373 | Harden admin: users, settings, integrations, backup/restore honesty | 0.3h | users, settings, integrations, backup/restore no "data safe" claim O3 | security-and-permissions | admin test |
| T374 | Run engine tests: all 180 engines have unit tests, 82 EXPERIMENTAL gap named | 0.4h | 180 engines tested, 0 hidden, docs:verify PASS | testing-strategy | engine test suite |
| T375 | TASKBOARD E11 DONE | 0.1h | DONE, 75 engines hardened, 82 EXPERIMENTAL accounted | docs-and-decisions | TASKBOARD |

### Epic E12 — Money Adoption 45%→100% (T376-T425) — 12h — 50 tasks

From 36.37% (371/1020) to 45% (459/1020) in E6, now to 100% (1020/1020). Zero compromise: every financial path must use Money, no ??0, no trivial toDecimal(0) debt.

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T376 | Measure money:adoption 45% baseline after E6 | 0.1h | 459/1020 recorded | money-and-decimals | adoption report |
| T377 | Migrate src/engines/budget/budgetEngine: Money | 0.3h | Money, oracle | money-and-decimals | budgetEngine.ts |
| T378 | Migrate src/engines/forecast/forecastEngine: Money | 0.3h | Money | money-and-decimals | forecastEngine.ts |
| T379 | Migrate src/engines/scenario/scenarioEngine: Money | 0.3h | Money | money-and-decimals | scenarioEngine.ts |
| T380 | Migrate src/engines/consolidation/consolidationEngine: Money exact | 0.3h | ExactConsolidationResult strings | money-and-decimals | consolidationEngine.ts |
| T381 | Migrate src/engines/fx/fxEngine: Money | 0.2h | Money | money-and-decimals | fxEngine.ts |
| T382 | Migrate src/engines/cash/cashEngine: Money | 0.2h | Money | money-and-decimals | cashEngine.ts |
| T383 | Migrate src/engines/workforce/workforceEngine: Money | 0.2h | Money | money-and-decimals | workforceEngine.ts |
| T384 | Migrate src/engines/capex/capexEngine: Money | 0.2h | Money | money-and-decimals | capexEngine.ts |
| T385 | Migrate src/services/export/* remaining: Money | 0.3h | Money | money-and-decimals | export services |
| T386 | Migrate src/services/import/*: Money | 0.3h | Money, control totals | money-and-decimals | import services |
| T387 | Migrate src/stores/* remaining: Money | 0.3h | Money stores, no number | money-and-decimals | stores |
| T388 | Migrate src/components/budget/*: Money display | 0.3h | Money, accounting format | money-and-decimals | budget components |
| T389 | Migrate src/components/forecast/*: Money | 0.3h | Money | money-and-decimals | forecast components |
| T390 | Migrate src/components/scenario/*: Money | 0.2h | Money | money-and-decimals | scenario components |
| T391 | Migrate src/components/consolidation/*: Money | 0.3h | Money, 100% elimination | money-and-decimals | consolidation components |
| T392 | Migrate src/components/cash/*: Money | 0.2h | Money | money-and-decimals | cash components |
| T393 | Migrate src/components/workforce/*: Money | 0.2h | Money | money-and-decimals | workforce components |
| T394 | Migrate src/components/treasury/*: Money | 0.2h | Money | money-and-decimals | treasury components |
| T395 | Migrate src/components/report/* remaining: Money | 0.3h | Money | money-and-decimals | report components |
| T396 | Migrate src/components/data/*: Money | 0.3h | Money, quarantine | money-and-decimals | data components |
| T397 | Migrate src/utils/* financial: Money | 0.3h | Money, no ??0 | money-and-decimals | utils |
| T398 | Remove trivial toDecimal(0) markers batch 1 (20 files) | 0.3h | -20 trivial, real arithmetic + | money-and-decimals | grep trivial |
| T399 | Remove trivial batch 2 (20 files) | 0.3h | -20 | money-and-decimals | grep |
| T400 | Remove trivial batch 3 (20 files) | 0.3h | -20 | money-and-decimals | grep |
| T401 | Remove trivial batch 4 (20 files) | 0.3h | -20, 0 trivial left | money-and-decimals | grep |
| T402 | Add oracle tests: budget version tie-out | 0.2h | oracle PASS | reconciliation-and-tie-out | oracle test |
| T403 | Add oracle: forecast driver cascade | 0.2h | oracle PASS | driver-based-scenario-modeling | oracle |
| T404 | Add oracle: scenario base/upside/downside | 0.2h | oracle PASS | scenario-modeling | oracle |
| T405 | Add oracle: consolidation twin | 0.3h | twin matches exact strings | reconciliation-and-tie-out | twin test |
| T406 | Add oracle: FX translation | 0.2h | FX * amount = translated | money-and-decimals | fx oracle |
| T407 | Add oracle: cash flow direct | 0.2h | cash tie-out | cash-and-treasury | cash oracle |
| T408 | Add oracle: workforce cascade | 0.2h | headcount → comp → P&L | workforce-planning | workforce oracle |
| T409 | Run money:ast: 0 unsafe, 100% over 1020 modules | 0.2h | 0 unsafe | money-and-decimals | money:ast |
| T410 | Run money:adoption: 100% (1020/1020) | 0.2h | 100% | money-and-decimals | adoption |
| T411 | Run missingIsNotZero census: 0 findings on supported surfaces | 0.2h | 0 findings, quarantine shown where total short | data-integrity | missingIsNotZero |
| T412 | Run financial:oracles 25/25 PASS | 0.2h | 25/25 | reconciliation-and-tie-out | oracle suite |
| T413 | tsc --noEmit, eslint --max-warnings 0 | 0.3h | PASS | gates-and-ratchets | tsc |
| T414 | test:sharded money shards | 0.3h | PASS | testing-strategy | vitest |
| T415 | Update baseline file 45%→100% | 0.1h | baseline updated | gates-and-ratchets | baseline |
| T416 | Document DEC-079 money 100% | 0.2h | DEC recorded, no trivial debt | docs-and-decisions | decision-log |
| T417 | TASKBOARD money 100% DONE | 0.1h | DONE | docs-and-decisions | TASKBOARD |
| T418 | Commit money 100% batch 1 | 0.1h | commit | verification-before-completion | git log |
| T419 | Commit money 100% batch 2 | 0.1h | commit | verification-before-completion | git log |
| T420 | Commit money 100% batch 3 | 0.1h | commit | verification-before-completion | git log |
| T421 | Verify no ??0 on money reads in all 40 SUPPORTED routes | 0.2h | grep ??0 on money → 0 on supported | data-integrity | grep |
| T422 | Verify accounting format #,##0.00;(#,##0.00) everywhere | 0.2h | accounting format, no $#,##0.00 raw | money-and-decimals | grep format |
| T423 | docs:verify money gates | 0.2h | PASS | docs-and-decisions | verify |
| T424 | Update COMPLETION_PLAN money row | 0.1h | 100% recorded | docs-and-decisions | COMPLETION_PLAN |
| T425 | HANDOVER money 100% | 0.1h | HANDOVER | docs-and-decisions | HANDOVER |

### Epic E13 — Reconciliation & Tie-out Oracles (T426-T475) — 12h — 50 tasks

Zero compromise: every financial calculation must have oracle-value test reproducing real arithmetic from typed inputs, not prose.

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T426 | Audit existing oracles: 25/25 financial oracles baseline | 0.2h | list of 25 oracles | reconciliation-and-tie-out | oracle list |
| T427 | Add oracle: ASC 805 goodwill = consideration - FV identifiable net assets | 0.3h | goodwill oracle PASS, exact strings | reconciliation-and-tie-out | goodwill oracle |
| T428 | Add oracle: ASC 810 elimination 100% regardless NCI | 0.3h | elimination oracle PASS | asc-810-consolidation-elimination | elimination oracle |
| T429 | Add oracle: ASC 810 NCI attribution downstream vs upstream | 0.3h | NCI diff oracle PASS | asc-810-consolidation-elimination | nci oracle |
| T430 | Add oracle: FX CTA = translated equity - historical equity | 0.3h | CTA oracle PASS | money-and-decimals | cta oracle |
| T431 | Add oracle: Revenue ASC 606 5-step | 0.3h | 5-step oracle PASS | financial-domain-modeling | revenue oracle |
| T432 | Add oracle: Lease ASC 842 ROU = PV payments | 0.3h | ROU oracle PASS | financial-domain-modeling | lease oracle |
| T433 | Add oracle: Tax DTA/DTL = temporary diff * rate | 0.2h | tax oracle PASS | financial-domain-modeling | tax oracle |
| T434 | Add oracle: Budget version diff = v2 - v1 | 0.2h | diff oracle PASS | forecast-and-budget | budget diff oracle |
| T435 | Add oracle: Rolling forecast 12-18mo horizon, 5-day cycle | 0.3h | rolling forecast oracle PASS | rolling-forecast-implementation | rolling forecast oracle |
| T436 | Add oracle: Scenario base/upside/downside consistent drivers | 0.3h | scenario oracle PASS | scenario-modeling | scenario oracle |
| T437 | Add oracle: Driver-based 5-7 drivers explain 80% variance | 0.3h | driver oracle PASS | driver-based-scenario-modeling | driver oracle |
| T438 | Add oracle: Cash flow direct CFO = receipts - payments | 0.2h | CFO direct oracle PASS | cash-and-treasury | cash direct oracle |
| T439 | Add oracle: Cash flow indirect CFO = NI + non-cash + WC | 0.3h | CFO indirect oracle PASS | cash-and-treasury | cash indirect oracle |
| T440 | Add oracle: Workforce headcount * avg comp = total comp | 0.2h | workforce oracle PASS | workforce-planning | workforce oracle |
| T441 | Add oracle: CapEx depreciation = cost / useful life | 0.2h | depreciation oracle PASS | financial-domain-modeling | capex oracle |
| T442 | Add oracle: Variance price + volume + mix = total variance | 0.3h | variance decomposition oracle PASS | reconciliation-and-tie-out | variance oracle |
| T443 | Add oracle: Trial balance debits = credits | 0.2h | TB oracle PASS | data-integrity | tb oracle |
| T444 | Add oracle: Control totals import = GL = TB | 0.2h | control totals oracle PASS | data-integrity | control totals oracle |
| T445 | Add oracle: Quarantine + valid = total imported | 0.2h | quarantine oracle PASS | data-integrity | quarantine oracle |
| T446 | Add oracle: Board pack XLSX tie-back to screen | 0.3h | tie-back oracle PASS, <f>+<v> | excel-and-report-exports | board pack tie-back |
| T447 | Add oracle: PDF export contains key metrics | 0.2h | PDF tie-back PASS | reporting-and-analytics | pdf tie-back |
| T448 | Add oracle: PPTX editable chart data tie-back | 0.2h | PPTX tie-back PASS | reporting-and-analytics | pptx tie-back |
| T449 | Add oracle: Mapping confidence weighted avg | 0.2h | mapping oracle PASS | import-and-mapping | mapping oracle |
| T450 | Add oracle: Validation quarantine reason visible | 0.2h | validation oracle PASS | data-integrity | validation oracle |
| T451 | Add oracle: Close checklist 100% before close | 0.2h | close checklist oracle PASS | close-and-consolidation | close checklist oracle |
| T452 | Add oracle: Correction follow-through audit chain | 0.3h | correction → audit → checklist, one-stop PASS | audit-trail-and-lineage | correction oracle |
| T453 | Add oracle: FX exposure = position * rate | 0.2h | FX exposure oracle PASS | cash-and-treasury | fx exposure oracle |
| T454 | Add oracle: Cash position = bank + adjustments | 0.2h | cash position oracle PASS | cash-and-treasury | cash position oracle |
| T455 | Add oracle: Treasury cash = sum entities | 0.2h | treasury oracle PASS | cash-and-treasury | treasury oracle |
| T456 | Add oracle: P&L revenue - COGS = gross profit | 0.2h | P&L oracle PASS | reporting-and-analytics | pl oracle |
| T457 | Add oracle: Balance sheet A = L + E | 0.2h | BS oracle PASS, A = L+E | reporting-and-analytics | bs oracle |
| T458 | Add oracle: Cash flow statement ties to BS cash change | 0.2h | cash change oracle PASS | reconciliation-and-tie-out | cash change oracle |
| T459 | Add oracle: Intercompany elimination sum = 0 | 0.2h | IC sum 0 oracle PASS | asc-810-consolidation-elimination | ic sum oracle |
| T460 | Add oracle: NCI = subsidiary equity * NCI% | 0.2h | NCI oracle PASS | asc-810-consolidation-elimination | nci calc oracle |
| T461 | Add oracle: Goodwill impairment = carrying - FV | 0.2h | impairment oracle PASS | financial-domain-modeling | impairment oracle |
| T462 | Add oracle: Driver cascade: driver → calc → output modular | 0.3h | modular inputs/calculations/outputs, oracle PASS | driver-based-scenario-modeling | driver cascade oracle |
| T463 | Add oracle: Rolling forecast accuracy 12% greater, 50% less prep (IBM ref) | 0.3h | rolling forecast benefits documented, not claimed as measured | rolling-forecast-implementation | rolling forecast doc |
| T464 | Run financial:oracles 50/50 PASS | 0.3h | 50 oracles PASS, up from 25 | reconciliation-and-tie-out | oracle suite |
| T465 | Wire oracles into docs:verify | 0.2h | docs:verify runs oracles | docs-and-decisions | docs:verify |
| T466 | Update completion-register: reconciliation capability GOVERNED | 0.2h | GOVERNED with test ids | docs-and-decisions | completion-register |
| T467 | tsc, eslint, test:sharded oracle shard | 0.3h | PASS | gates-and-ratchets | tsc |
| T468 | Document DEC-080 oracles 50/50 | 0.2h | DEC recorded | docs-and-decisions | decision-log |
| T469 | TASKBOARD oracles DONE | 0.1h | DONE | docs-and-decisions | TASKBOARD |
| T470 | Commit oracles batch 1 | 0.1h | commit | verification-before-completion | git log |
| T471 | Commit oracles batch 2 | 0.1h | commit | verification-before-completion | git log |
| T472 | Verify no invented figures in oracles | 0.2h | all oracles use exact strings, Money | money-and-decimals | grep |
| T473 | docs:links --strict for oracle docs | 0.1h | PASS | docs-and-decisions | links |
| T474 | Update COMPLETION_PLAN oracles row | 0.1h | 50/50 recorded | docs-and-decisions | COMPLETION_PLAN |
| T475 | HANDOVER oracles | 0.1h | HANDOVER | docs-and-decisions | HANDOVER |

### Epic E14 — Security & Governance Closure (T476-T525) — 12h — 50 tasks

Zero compromise: every SUPPORTED route must have RBAC, audit, write-guard, no O9 entity-scope claimed, no O4 SOX authority, no O3 data safe, no O1 D365 verified.

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T476 | Audit RBAC: 409 pinned actions = 302 guarded + 107 reasoned | 0.2h | RBAC census, list | security-and-permissions | rbac census |
| T477 | Verify no new unguarded actions after route expansion | 0.2h | 0 unguarded, census PASS | security-and-permissions | rbac census |
| T478 | Add RBAC guard to 10 new routes from E10 | 0.3h | 10 guards pinned | security-and-permissions | guard diff |
| T479 | Add RBAC guard to 10 more new routes | 0.3h | pinned | security-and-permissions | guard |
| T480 | Add RBAC guard to remaining 5 new routes | 0.2h | pinned, total 434 actions | security-and-permissions | guard |
| T481 | Audit auditTrailStore: hash-chained, single canonical authority | 0.2h | hash chain, 10 modules classified | audit-trail-and-lineage | auditTrailStore |
| T482 | Verify audit log for cash/workforce/treasury/report routes | 0.3h | audit logs present, hash-chained | audit-trail-and-lineage | audit log |
| T483 | Verify audit log for consolidation/budget/forecast/scenario | 0.3h | audit logs | audit-trail-and-lineage | audit log |
| T484 | Add audit log to 10 new routes from E10 | 0.3h | audit hash-chained | audit-trail-and-lineage | audit log |
| T485 | Audit write-guards: period-close blocks write on supported surfaces | 0.2h | write-guard list, close blocks | close-and-consolidation | write-guard census |
| T486 | Verify write-guard for cash/workforce/treasury | 0.2h | blocks, test PASS | close-and-consolidation | write-guard test |
| T487 | Verify write-guard for budgets/forecasts/scenarios | 0.2h | blocks | close-and-consolidation | write-guard test |
| T488 | Add write-guard to 10 new routes from E10 | 0.3h | blocks | close-and-consolidation | write-guard |
| T489 | Add write-guard to remaining 15 new routes | 0.3h | blocks, total 40 routes | close-and-consolidation | write-guard |
| T490 | Audit entity-scope: O9 BLOCKED-ON-OWNER, no entity-scope claimed | 0.2h | grep entity-scope GOVERNED → 0, O9 documented | owner-decisions | grep |
| T491 | Verify no entity-scope authorization in governance-evidence | 0.2h | 0 rows with entity-scope claimed, governance:evidence PASS | verification-before-completion | governance-evidence.json |
| T492 | Audit SOX authority: O4 BLOCKED, no SOX claim | 0.2h | grep SOX authority → 0, O4 documented | owner-decisions | grep |
| T493 | Audit D365 verified: O1 BLOCKED, no D365 verified claim | 0.2h | grep D365 verified → 0, O1 documented | owner-decisions | grep |
| T494 | Audit data safe: O3 BLOCKED, no "your data is safe" claim | 0.2h | grep data safe → 0, O3 documented | owner-decisions | grep |
| T495 | Audit CI green: O8 BLOCKED, no CI green claim | 0.2h | grep CI green → 0, O8 documented | owner-decisions | grep |
| T496 | Audit payload-source authentication: N3 bounded, no claim | 0.2h | N3 boundary stated, no auth claim | security-and-permissions | TASKBOARD N3 |
| T497 | Audit restart durability: N2 bounded, O7 BLOCKED | 0.2h | N2 boundary, O7 documented | owner-decisions | TASKBOARD N2 |
| T498 | Verify RBAC census closed, audit chain bounded, write-guards | 0.2h | 3 censuses PASS | security-and-permissions | census |
| T499 | Run governance:evidence for 40 routes | 0.3h | 40 GOVERNED, ids resolve, governance:evidence PASS | verification-before-completion | governance-evidence |
| T500 | Run spine:evidence for 40 routes | 0.3h | 40 CONNECTED, ids resolve, spine:evidence PASS | verification-before-completion | spine-evidence |
| T501 | Update completion-register: governance GOVERNED for 40 routes + 20 caps | 0.3h | SUPPORTED 60 (40 routes + 20 caps), GOVERNED 60 | docs-and-decisions | completion-register |
| T502 | Regenerate CAPABILITY_TRUTH_MATRIX.md: 40 GOVERNED | 0.2h | 40 GOVERNED, matrix gen PASS | docs-and-decisions | matrix |
| T503 | Run docs:verify, docs:links --strict | 0.2h | PASS | docs-and-decisions | verify |
| T504 | Run tsc, eslint, format:check | 0.3h | PASS | gates-and-ratchets | tsc |
| T505 | test:sharded governance shard | 0.3h | PASS | testing-strategy | vitest |
| T506 | Document DEC-081 governance closure 40 routes | 0.2h | DEC recorded, boundaries stated | docs-and-decisions | decision-log |
| T507 | Update OWNER_DECISION_PACKET O1-O9 with consequences | 0.3h | O1-O9 question, options, default not claimed, what blocks/unblocks | owner-decisions | OWNER packet |
| T508 | TASKBOARD governance DONE | 0.1h | DONE | docs-and-decisions | TASKBOARD |
| T509 | Commit governance batch 1 | 0.1h | commit | verification-before-completion | git log |
| T510 | Commit governance batch 2 | 0.1h | commit | verification-before-completion | git log |
| T511 | Verify no unverified claims in docs: grep O1/O3/O4/O8/O9 | 0.2h | 0 unverified claims, docs:links PASS | requirements-traceability | grep |
| T512 | Verify backticked paths resolve: docs:links --strict | 0.1h | PASS | docs-and-decisions | links |
| T513 | Update COMPLETION_PLAN governance row | 0.1h | 40 GOVERNED recorded | docs-and-decisions | COMPLETION_PLAN |
| T514 | HANDOVER governance | 0.1h | HANDOVER | docs-and-decisions | HANDOVER |
| T515 | Run one-stop acceptance census: 40 SUPPORTED routes, Excel optional | 0.3h | one-stop 40 routes, DEC-018 revision, census PASS | docs-and-decisions | oneStop:acceptance |
| T516 | Run missingIsNotZero census: 0 findings | 0.2h | 0 findings, quarantine shown | data-integrity | missingIsNotZero |
| T517 | Run money:ast: 0 unsafe | 0.1h | 0 unsafe | money-and-decimals | money:ast |
| T518 | Run money:adoption: 100% | 0.1h | 100% | money-and-decimals | adoption |
| T519 | Run bundle-check: <2000KB gz | 0.1h | PASS | performance-and-bundle | bundle-check |
| T520 | Run skills:verify, routemap:check | 0.1h | PASS, 56 skills, 231 routes | docs-and-decisions | verify |
| T521 | Verify no irreversible migration: decision authority delegated provisional reviewable | 0.2h | no irreversible migration, DEC | docs-and-decisions | decision-log |
| T522 | Verify breadth preserved: RETIRED requires DEC + commit, no deletion | 0.2h | DEC-006 preserved, 231 routes | docs-and-decisions | decision-log |
| T523 | Verify no gate weakened to pass | 0.2h | no gate weakened, DEC if rule wrong | gates-and-ratchets | decision-log |
| T524 | Commit security batch | 0.1h | commit | verification-before-completion | git log |
| T525 | Final security audit log | 0.1h | log | security-and-permissions | audit |

### Epic E15 — Perf/A11y/Bundle Stretch <1950KB + Determinism (T526-T550) — 8h — 25 tasks

Zero compromise: bundle below 1950KB gz so warning clears and bumps have headroom, critical <400KB gz, main <60KB gz, a11y AA on 40 SUPPORTED routes, perf budgets, determinism.

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T526 | Measure bundle after E1 diet: baseline <2000KB gz | 0.2h | <2000KB, 0 warnings | performance-and-bundle | bundle-check |
| T527 | Further split sector-pages per sector, dedup | 0.3h | sector-pages <60KB gz | vite-bundle-deep-optimization | vite.config.ts |
| T528 | Further split ui-primitives: Radix granular, lucide granular | 0.3h | ui-primitives <20KB gz | performance-and-bundle | vite.config.ts |
| T529 | Lazy-load all heavy pages: /reports/*, /admin/*, /data/* detail | 0.4h | heavy pages lazy, main <60KB gz | vite-bundle-deep-optimization | App.tsx lazy |
| T530 | Ensure excel-core-vendor only loads on export action | 0.2h | excel chunk 248KB gz not in main, loads on demand | performance-and-bundle | bundle-check |
| T531 | Ensure pdf-vendor only loads on pdf export | 0.2h | pdf 179KB gz not in main | performance-and-bundle | bundle-check |
| T532 | Ensure grid-vendor only loads on DataGrid routes | 0.2h | grid 206KB gz not in main | ag-grid-modular-optimization | bundle-check |
| T533 | Ensure chart-vendor only loads on chart routes, LineChart 9.5KB gz | 0.3h | chart-vendor <80KB gz, LineChart granular | recharts-tree-shaking | bundle-check |
| T534 | Build and measure: target <1950KB gz stretch | 0.3h | <1950KB gz, critical <400KB gz, main <60KB gz, bundle-check PASS no warning | performance-and-bundle | bundle-check output |
| T535 | Generate stats.html and document chunk sizes | 0.2h | stats.html, chunk table | performance-and-bundle | stats.html |
| T536 | Run a11y axe on 40 SUPPORTED routes: 0 critical | 0.4h | axe 0 critical, AA | accessibility-wcag | axe report |
| T537 | Fix color contrast: palette 5501→≤5400, semantic vars | 0.3h | palette ≤5400, no raw bg-slate-800 | accessibility-wcag | palette check |
| T538 | Keyboard navigation: DataGrid, modals, EmptyState CTA | 0.3h | keyboard enter triggers CTA, focus visible | accessibility-wcag | keyboard test |
| T539 | Focus trap: modals/dialogs, no focus leak | 0.2h | focus trap PASS | accessibility-wcag | focus trap test |
| T540 | srLabel + role=alert audit: all Skeletons + ErrorStates | 0.2h | srLabel present, role=alert asserted | accessibility-wcag | audit |
| T541 | Perf: DataGrid keyboard <250ms | 0.2h | <250ms, test PASS | performance-and-bundle | keyboardPerf test |
| T542 | Perf: glStore loadBench <10000ms | 0.2h | <10000ms, test PASS | performance-and-bundle | loadBench test |
| T543 | Perf: per-route budget <200ms interaction | 0.3h | per-route perf budget, 40 routes PASS | performance-and-bundle | perf budget test |
| T544 | Determinism census: no Date.now() in render, no Math.random() in calc | 0.3h | determinism census PASS | testing-strategy | determinism census |
| T545 | Run a11y-q5-gate | 0.2h | PASS | accessibility-wcag | q5 gate |
| T546 | Wire a11y+perf+determinism+bundle into docs:verify | 0.2h | docs:verify runs all | docs-and-decisions | docs:verify |
| T547 | test:sharded a11y+perf shards | 0.3h | PASS | testing-strategy | vitest |
| T548 | Document DEC-082 bundle <1950KB + a11y AA + perf | 0.2h | DEC recorded | docs-and-decisions | decision-log |
| T549 | TASKBOARD perf/a11y/bundle DONE | 0.1h | DONE | docs-and-decisions | TASKBOARD |
| T550 | Commit perf/a11y/bundle | 0.1h | commit | verification-before-completion | git log |

### Epic E16 — Owner Pack + RC + Release Snapshot (T551-T575) — 8h — 25 tasks

Zero compromise: O1-O9 consolidated with consequences, every blocked row states its question, release candidate hardening, rollback rehearsal, runbook, completion register snapshot = release notes.

| Task | Title | Hours | Exit Gate | Skills | Evidence |
|------|-------|-------|-----------|--------|----------|
| T551 | Audit O1-O9: question, options, default not claimed, what blocks/unblocks | 0.3h | O1-O9 list with question, options, default | owner-decisions | OWNER packet audit |
| T552 | Regenerate OWNER_DECISION_PACKET.md O1-O9 | 0.3h | packet with consequences, no unverified claims | owner-decisions | OWNER_DECISION_PACKET.md |
| T553 | Update completion-register: 7 BLOCKED-ON-OWNER rows with O-id + question | 0.2h | 7 BLOCKED rows have O-id, question stated | docs-and-decisions | completion-register.json |
| T554 | Verify 0 blank statuses in register | 0.1h | 0 blank, gate PASS | docs-and-decisions | register check |
| T555 | Regenerate COMPLETION_REGISTER.md view | 0.1h | view matches JSON, --check PASS | docs-and-decisions | COMPLETION_REGISTER.md |
| T556 | Regenerate CAPABILITY_TRUTH_MATRIX.md: 40 SUPPORTED, 60 rows SUPPORTED | 0.2h | 40 routes CONNECTED GOVERNED, matrix gen PASS | docs-and-decisions | matrix |
| T557 | Regenerate ROUTE_MAP.md: 231 routes, 0 REVIEW, 38 MIGRATE, 2 RETAIN, 7 EXPERIMENTAL | 0.2h | 231 routes, dispositions | docs-and-decisions | ROUTE_MAP.md |
| T558 | Update TASKBOARD.md: 575 tasks DONE, 40 routes SUPPORTED, money 100%, bundle <1950KB, oracles 50/50 | 0.3h | TASKBOARD DONE | docs-and-decisions | TASKBOARD.md |
| T559 | Update decision-log.md: DEC-076-090 | 0.4h | 15 DECs recorded, reason + commit | docs-and-decisions | decision-log.md |
| T560 | Update COMPLETION_PLAN_86_100.md with PR #95 actuals: SUPPORTED 60, 40 routes | 0.3h | SUPPORTED 60 actuals, no unverified claims, C1-C6 | docs-and-decisions | COMPLETION_PLAN |
| T561 | Run docs:verify full | 0.3h | PASS | docs-and-decisions | verify |
| T562 | Run docs:links --strict | 0.2h | PASS, backticked *.md resolve | docs-and-decisions | links |
| T563 | Run tsc --noEmit | 0.3h | PASS | gates-and-ratchets | tsc |
| T564 | Run eslint src --max-warnings 0 | 0.3h | PASS | gates-and-ratchets | eslint |
| T565 | Run prettier --check | 0.2h | PASS | gates-and-ratchets | prettier |
| T566 | Run test:sharded 8/8 shards sequentially (400s per shard) | 0.8h | 8/8 PASS, 2 perf flakes fixed (DataGrid <250ms, loadBench <10000ms) | testing-strategy | sharded output |
| T567 | Run bundle-check, skills:verify, routemap:check, spine:evidence, governance:evidence, one-stop, missingIsNotZero, money:ast, money:adoption, ai-census, a11y-q5, determinism | 0.4h | ALL PASS, <1950KB gz, 0 warnings, 56 skills, 231 routes, 40 CONNECTED GOVERNED, one-stop 40, missingIsNotZero 0, money:ast 0 unsafe, money:adoption 100%, ai-census 0 ungated, a11y-q5 PASS | gates-and-ratchets | full gates output |
| T568 | RC hardening: clean checkout, full suite, build, all ratchets | 0.3h | clean checkout PASS, every gate green | release-and-handover | rc log |
| T569 | Rollback rehearsal: migration/rollback, backup/restore honesty | 0.3h | rollback rehearsal PASS, runbook | release-and-handover | runbook |
| T570 | Write runbook.md: rollback, backup/restore, CI posture | 0.3h | runbook with steps, no "data safe" claim | release-and-handover | runbook.md |
| T571 | Write HANDOVER.md for PR #95: what changed (575 tasks), what not claimed (O1-O9, N2/N3 bounded), next (PR #96-#100) | 0.4h | HANDOVER with failing-first evidence, gate lines, no O1/O3/O4/O8/O9 claims, 575 tasks evidence | docs-and-decisions | HANDOVER.md |
| T572 | Final git push and PR body file with 575 tasks evidence table | 0.3h | push PASS, body file with evidence, 575 tasks | verification-before-completion | git push |
| T573 | Verify no PR created until 142h productive evidence (575 tasks * avg 0.247h = 142h) | 0.2h | evidence: 575 tasks, git log shows 575 commits or batched with 142h wall-time log, no idle | verification-before-completion | plan + log |
| T574 | Verify README/VISION claims match measurement: no D365 verified, no data safe, no SOX, no CI green, no entity-scope | 0.2h | README/VISION claims = measurement, check-readme-claims PASS | requirements-traceability | check-readme-claims |
| T575 | Tag RC: completion register snapshot = release notes, grades re-derived | 0.2h | register snapshot = release notes, C1-C6 all green, tag | release-and-handover | tag + release notes |

---

## Sequencing (parallel where possible) — 575 tasks, 142h productive, ~3h wall with 50 workers

```
E1 T001-T030 bundle diet (8h) ─┐
                               ├─► E2 cash T031-T055 (6h) ─┐
                               ├─► E3 workforce T056-T080 (6h) ─┼─► E5 reports T106-T135 (8h) ─┐
                               ├─► E4 treasury T081-T105 (6h) ─┘                               │
                                                                                               ├─► E6 money 45% T136-T160 (6h) ─┐
                                                                                               │                               ├─► E10 routes 20-40 T226-T300 (15h) ─┐
                                                                                               │                               │                                              ├─► E11 engines T301-T375 (15h) ─┐
                                                                                               │                               │                                              │                              ├─► E12 money 100% T376-T425 (12h) ─┐
                                                                                               │                               │                                              │                              │                                 ├─► E13 oracles 50/50 T426-T475 (12h) ─┐
                                                                                               │                               │                                              │                              │                                 │                                    ├─► E14 governance 40 routes T476-T525 (12h) ─┐
                                                                                               │                               │                                              │                              │                                 │                                    │                                          ├─► E7 AI T161-T185 (8h) ─┐
                                                                                               │                               │                                              │                              │                                 │                                    │                                          │                    ├─► E15 perf/a11y/bundle <1950KB T526-T550 (8h) ─► E16 owner+RC+release T551-T575 (8h)
                                                                                               │                               │                                              │                              │                                 │                                    │                                          │
                                                                                               └─► E8 a11y+perf T186-T205 (6h) ─┴─► E9 docs+owner T206-T225 (6h) ────────────┴──────────────────────────────┴─────────────────────────────────┴────────────────────────────────────┘
```

Wall-time compression: 142h productive / ~50 parallel workers = ~2.8h wall with unlimited tokens (as per user quota).

## Failure controls (zero compromise)

- No gate weakened to pass — if rule wrong, DEC in public with reason.
- No breadth deleted to make numbers look better (DEC-006) — RETIRED requires DEC + commit.
- No unverified claims: O1 D365 verified, O3 data safe, O4 SOX, O8 CI green, O9 entity-scope, N2 restart durability O7, N3 payload-source auth, Q6 server authority.
- Backticked paths must resolve — `docs:links --strict` treats backticked *.md as real path.
- Repo-only deliverables; merge PR with `gh pr merge <n> --merge` when gates green.
- Money adoption trivial `toDecimal(0)` is debt, not goal — must be real arithmetic.
- Bundle diet measured before/after — `npm run build` + `bundle-check` + `stats.html`, target <1950KB gz so warning clears.
- 575 tasks must each have evidence file, not just doc bump — C4: every grade reproduced by named test/script, not prose.
- No PR created until 142h productive evidence (T573).
- One PR, one criterion — register updated same commit, grade only via generator, no hand-edited matrix.
- Completion contract C1-C6 fixed: C1 register, C2 one-stop, C3 money+missingIsNotZero, C4 matrix reproduced, C5 a11y/perf/bundle/determinism/RBAC, C6 not-supported stated with decision.

## Current debt from last 2 PRs + zero-compromise expansion

- PR #93 and #94 closed early per user — 40h debt.
- Original PR #95 20h + debt 40h = 60h, expanded 25× to 225 tasks (60h).
- User directive: +350 more useful tasks, zero compromises → +82h, total 142h productive, 575 tasks.
- Must produce substantial product evidence, not just doc bumps — every task has evidence pointer.

## Exit criteria (142h, 575 tasks, zero compromise)

- SUPPORTED 30→60 (13→40 routes, 17→20 caps), 695 rows, spine 40/120, gov 40/120, one-stop 40, missingIsNotZero 0
- Money adoption 36.37%→45%→100% (1020/1020), money:ast 0 unsafe, palette ≤5400
- Bundle <1950KB gz (stretch <1950KB), warnings 0, critical <400KB gz, main <60KB gz, stats.html
- Palette ≤5400, no raw bg-slate-800, semantic vars
- Test files 1423→~1550 (new interop tests for 40 routes + oracles + engines)
- Financial oracles 25→50/50 PASS, ASC 810 100% elimination, ASC 805 goodwill, ASC 606, ASC 842, tax, driver cascade, rolling forecast, variance decomposition, TB debits=credits, control totals, quarantine+valid=total
- All gates PASS: docs:verify, docs:links --strict, tsc --noEmit, eslint --max-warnings 0, prettier --check, test:sharded 8/8 (perf flakes fixed), bundle-check, skills:verify, routemap:check, spine:evidence, governance:evidence, one-stop:acceptance, missingIsNotZero, money:ast, money:adoption, ai-census, a11y-q5, determinism
- No PR created until 142h productive evidence (T573)
- 575 tasks with evidence pointers, no useless tasks, zero compromises
- README/VISION claims = measurement, check-readme-claims PASS, no O1/O3/O4/O8/O9 claims
- Owner pack O1-O9 with question, options, default not claimed, what blocks/unblocks
- RC hardening: clean checkout, full suite, rollback rehearsal, runbook, CI posture recorded

## Notes

- Use skill library explicitly (56 methods), state which skills applied per PR; skill never upgrades claim.
- Ponytail on every coding task (docs/agent/skills/ponytail.md level full): smallest change that fully solves, finish callers/tests/fixtures, end every reply with 1-2 lines on what skipped/not checked and risk.
- Sandbox facts: node_modules wiped → npm ci --ignore-scripts; never npx <tool>, use node node_modules/vitest/vitest.mjs, prettier, eslint, tsc; single-process npm test dies (Worker not defined) → only recordable full run is npm run test:sharded; git push and full gate chains under start_process; gh pr edit silently fails → use gh api -X repos/.../pulls/<n> -F body=@file; --seed keeps existing rows → delete completion-register.json to re-derive; generated artifacts must be .prettierignore; adding test file breaks verify-readme-stats until README count bumped (currently 1419+).
- 25× expansion: 225 tasks, each micro-task 0.15-0.45h, evidence required, no idle.
- Zero-compromise expansion: +350 useful tasks (T226-T575), 82h additional, total 575 tasks 142h productive, every task closes real gap from COMPLETION_PLAN_86_100.md, no filler, no gate weakened, no breadth deleted, no unverified claims.
