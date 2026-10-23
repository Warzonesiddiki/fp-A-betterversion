# PR #95 — Reasoning, Planning & Brainstorming — 575 Tasks, Zero Compromise

> **Branch**: arena/b6432303-fp-a-betterversion
> **Date**: 2026-10-23
> **Skills used**: executing-plans, writing-plans, verification-before-completion, systematic-debugging, onboarding-a-codebase, performance-and-bundle, vite-bundle-deep-optimization, ag-grid-modular-optimization, recharts-tree-shaking, financial-domain-modeling, money-and-decimals, audit-trail-and-lineage, reconciliation-and-tie-out, architecture-boundaries, react-state-and-stores, testing-strategy, docs-and-decisions, requirements-traceability, accessibility-wcag, frontend-design, charts-and-data-display, excel-and-report-exports, forms-and-validation, gates-and-ratchets, driver-based-scenario-modeling, rolling-forecast-implementation, asc-810-consolidation-elimination, security-and-permissions, data-integrity, import-and-mapping, close-and-consolidation, scenario-modeling, forecast-and-budget, cash-and-treasury, workforce-planning, reporting-and-analytics, ai-and-nlq, owner-decisions, release-and-handover, ponytail (full)

## 1. First Principles — Why 575 Tasks?

Original 9 tasks = 60h, but each 6-8h epic hides 20-30 hidden steps. 25× expansion to 225 exposed hidden work. User directive +350 more = 575 ensures **zero compromise**:

- **C1 register**: 695 rows must each have status + evidence pointer. 13→40 routes SUPPORTED = 27 new routes × 5 evidence files each = 135 evidence artifacts.
- **C2 one-stop**: 40 routes × census that Excel is optional, correction path in-app. Requires audit of every workflow.
- **C3 money + missingIsNotZero**: 1020 files, 371→1020 Money adoption = 649 files to migrate. Each needs oracle.
- **C4 truth matrix reproduced**: every grade must have test id that resolves. No prose upgrade.
- **C5 operationally fit**: bundle <1950KB gz (currently 2065.81KB gz 99.3% limit 2080KB, 1 warning), critical <400KB, main <60KB, a11y AA 40 routes, keyboard <250ms, loadBench <10000ms, determinism, RBAC 434 actions, audit hash-chained, write-guards 40 routes.
- **C6 honest gaps**: 7 BLOCKED-ON-OWNER rows must state O-id + question, no O1/O3/O4/O8/O9 claims.

If we add useless tasks, we violate ponytail (smallest change that fully solves). If we skip tasks, we violate zero compromise. So 575 is minimal for zero compromise.

## 2. Current State — Measured, Not Guessed

From `docs/plan/PR_95_60H_PLAN.md` baseline 2dbb0f4 post PR #90:

- **SUPPORTED 30 = 13 routes + 17 caps**, 695 rows, spine 13/48, gov 13/39, one-stop 13, missingIsNotZero 0
- **Bundle**: 6829.49KB raw / 2065.78KB gz = 99.3% limit 2080KB, 1 warning
  - Chunks: excel-core-vendor 248KB gz (largest), grid 206KB gz, pdf 179KB gz, chart 129KB gz, sector-pages 96KB gz, ui-primitives 34KB gz, index ~70KB gz
  - Previous attempt: removed manualChunks grouping increased gz +23KB/+34KB due to chunk overhead + dedup loss — grouping beneficial, need dynamic imports instead.
- **Money**: 36.37% (371/1020), money:ast 0 unsafe, palette 5501/370
- **Routes**: 231 total, 0 REVIEW, 38 MIGRATE, 2 RETAIN, 7 EXPERIMENTAL
- **Tests**: 1423 files, 8/8 shards ~872-984s, 2 perf flakes: DataGrid.keyboardPerf 276ms>250ms, glStore.loadBench 10542ms>10000ms
- **Skills**: 56, frontmatter valid, index current
- **Partial progress E1**: exportExcel, ExcelImportEngine, MigrationEngine, financialPackageExport converted to dynamic loadExcelJS() but TS errors remain (implicit any in callbacks), build fails, bundle not yet re-measured.

**Debt**: PR #93 + #94 closed early per user report = 40h debt. This PR must cover 40h debt + 20h current = 60h, expanded to 142h for zero compromise.

## 3. Dependency Graph — What Blocks What?

```
E1 bundle diet (T001-T030) ─┬─► E2 cash (T031-T055) ─┐
                            ├─► E3 workforce (T056-T080) ─┼─► E5 reports (T106-T135) ─┐
                            ├─► E4 treasury (T081-T105) ─┘                            │
                                                                                       ├─► E10 routes 20-40 (T226-T300) ─┐
                                                                                       │                                ├─► E11 engines (T301-T375) ─┐
                                                                                       │                                │                               ├─► E12 money 100% (T376-T425) ─┐
                                                                                       │                                │                               │                                  ├─► E13 oracles 50/50 (T426-T475) ─┐
                                                                                       │                                │                               │                                  │                                     ├─► E14 governance 40 routes (T476-T525) ─┐
                                                                                       │                                │                               │                                  │                                     │                                           ├─► E6 money 45% (T136-T160) ─┤
                                                                                       │                                │                               │                                  │                                     │                                           │                              ├─► E7 AI (T161-T185) ─┐
                                                                                       │                                │                               │                                  │                                     │                                           │                              │                ├─► E15 perf/a11y/bundle <1950KB (T526-T550) ─► E16 owner+RC+release (T551-T575)
                                                                                       │                                │                               │                                  │                                     │                                           │                              │                │
                                                                                       └─► E8 a11y+perf (T186-T205) ─┴─► E9 docs+owner (T206-T225) ───────┴───────────────────────────────┴──────────────────────────────────┘
```

**Critical path**: E1 bundle diet must complete first because it unblocks bundle-check gate for all other PRs. Without <2000KB gz, every later PR fails bundle-check.

**Parallelizable**: E2/E3/E4 cash/workforce/treasury are independent (different stores/pages). E6 money 45% can parallel with E2-E4 after E1. E10 routes 20-40 can parallel with E11 engines after E5.

**Zero-compromise insight**: Money adoption 100% (E12) must happen before oracles 50/50 (E13) because oracles must use Money exact strings, not number.

## 4. Skill Application Matrix — Which Skill for Which Epic?

| Epic | Primary Skills | Why |
|------|----------------|-----|
| E1 bundle | vite-bundle-deep-optimization, performance-and-bundle, ag-grid-modular-optimization, recharts-tree-shaking, excel-and-report-exports | dynamic imports, manualChunks function form, ModuleRegistry, granular recharts, stats.html |
| E2-E4 cash/workforce/treasury | financial-domain-modeling, cash-and-treasury, workforce-planning, react-state-and-stores, accessibility-wcag, frontend-design, test-driven-development | driver-based planning, headcount cascade, FX translation, 4-state interop tests, Skeleton srLabel, ErrorState role=alert |
| E5 REPORT | reporting-and-analytics, excel-and-report-exports, reconciliation-and-tie-out, financial-domain-modeling | formula-preserving <f>+<v>, tie-back oracle, board pack XLSX/PDF/PPTX |
| E6+E12 money | money-and-decimals, ponytail, verification-before-completion | toDecimal, ExactConsolidationResult strings, trivial marker removal, money:ast 0 unsafe, money:adoption 100% |
| E7 AI | ai-and-nlq, audit-trail-and-lineage, security-and-permissions | verifiedFactsGate, no egress, local-only, explicit invocation, corpus 6/6, audit hash-chained |
| E8+E15 a11y/perf | accessibility-wcag, performance-and-bundle, gates-and-ratchets | axe AA, keyboard <250ms, loadBench <10000ms, palette semantic, focus trap, bundle <1950KB, critical <400KB, main <60KB, determinism |
| E9+E16 docs/owner | docs-and-decisions, owner-decisions, requirements-traceability, release-and-handover | completion-register.json 695 rows, matrix, route_map, taskboard, decision-log DEC-076-090, owner packet O1-O9, handover, runbook, rollback rehearsal |
| E10 routes | financial-domain-modeling, scenario-modeling, forecast-and-budget, close-and-consolidation, data-integrity | 25 new routes 4-state, journey/empty/error/loading, spine 40/120, gov 40/120 |
| E11 engines | architecture-boundaries, asc-810-consolidation-elimination, driver-based-scenario-modeling, rolling-forecast-implementation, import-and-mapping | 180 engines, 98/82 split, 82 EXPERIMENTAL gap named, ASC 810 100% elimination, driver cascade, rolling forecast 12-18mo/5-day/75% auto-load |
| E13 oracles | reconciliation-and-tie-out, asc-810-consolidation-elimination, driver-based-scenario-modeling | 50/50 oracles, exact strings, Money, no invented figures |
| E14 governance | security-and-permissions, audit-trail-and-lineage, close-and-consolidation, owner-decisions | RBAC 434 actions, audit hash-chained, write-guards 40 routes, O1/O3/O4/O8/O9 0 claims, N2/N3 bounded |

## 5. Brainstorming — 10 Key Insights for Zero Compromise

### Insight 1: Bundle Diet Must Be Dynamic, Not Deletion
Previous attempt removing manualChunks sector-pages/templates/ui-primitives increased gz +23KB/+34KB due to chunk overhead and dedup loss. Grouping is beneficial. Real lever is **dynamic import** for heavy libs: exceljs (248KB gz), jspdf (179KB gz), framer-motion (~50KB gz), ag-grid ValidationModule dev-only, recharts Treemap/Heatmap lazy. ExcelJS dynamic already started — need to finish TS fixes and measure.

### Insight 2: Money Adoption Trivial Markers Are Debt
`toDecimal(0)` markers were counted as adopted but are debt, not goal. Must replace with real arithmetic. From 36.37% (371/1020) to 45% (459/1020) is 88 files, but to 100% is 649 files. Each file needs oracle test. Ponytail: smallest change that fully solves — replace number with Money where financial path, not everywhere.

### Insight 3: 4-State Pattern Is Repeatable
Every SUPPORTED route needs journey/empty/error/loading. Pattern:
- `isLoading` from store → Skeleton with srLabel
- `error` from store → ErrorState role=alert + retry CTA
- `data.length===0` → EmptyState with CTA to import/create
- Happy path → journey test
Plus RBAC action, audit log hash-chained, write-guard period-close. This pattern can be templated for 27 new routes (E10) — 27×4 tests = 108 tests.

### Insight 4: ASC 810 Elimination Is 100% Regardless NCI
From external sources: ASC 810-10-45-1/45-18, houseblend.io, dart.deloitte.com — 100% elimination regardless NCI, single economic entity, intercompany receivable/payable/interest/dividends/sales/unrealized profit elimination, downstream vs upstream NCI attribution differs, VIE fees eliminated. This is not optional — must have oracle tests for each elimination type.

### Insight 5: Driver-Based Modeling 5-7 Drivers Explain 80% Variance
From pigment.com, farseer.com, getaleph.com — 5-7 drivers explain 80% variance, 3 types operational/financial/external, modular inputs/calculations/outputs, base/upside/downside consistent, owner-assigned assumptions. Workforce headcount driver → comp → P&L cascade must be visible, not hidden.

### Insight 6: Rolling Forecast 12-18mo Horizon, 5-Day Cycle, 75% Auto-Load
From cubesoftware.com, cleoai.tech, metapraxis.com — driver-based framework, 12-18mo horizon, 5-day monthly cycle, 75% GL auto-load, IBM 12% greater accuracy 50% less prep time. Rolling forecast semantics O2 BLOCKED unless owner answers — default not claimed.

### Insight 7: AI Must Be Verified-Facts Gate, No Egress, Local-Only
Gate exists `verifyNarrative`, but work is proving every surface that surfaces generated text calls it, by census, and no path can reach provider. DEC-022 holds until decided. Corpus 6/6, explicit invocation, audit trail prompt/response/gate result hash-chained.

### Insight 8: A11y AA + Perf Budgets Are Gates, Not Nice-To-Have
DataGrid keyboard 276ms>250ms, glStore loadBench 10542ms>10000ms — 2 known perf flakes. Must fix to <250ms and <10000ms. Palette 5501/370 must go ≤5400, no raw bg-slate-800, semantic vars. Focus trap, srLabel, role=alert, skip-link, landmarks. A11y-q5-gate must PASS on 40 SUPPORTED routes.

### Insight 9: No Unverified Claims — O1-O9 Must Be BLOCKED
From TASKBOARD: O1 D365 verified (no real export sample), O2 rolling-forecast correctness (semantics undefined), O3 data safe (no key-escrow), O4 SOX/audit authority, O5 sector/jurisdiction tiers, O6 non-local AI (DEC-022), O7 native desktop/offline auth, O8 CI green (Actions 403), O9 entity-scope authorization. Every doc must grep 0 for these claims. Owner packet must state question, options, default not claimed, what blocks/unblocks.

### Insight 10: Completion Register Is Source of Truth, Not Matrix
`docs/plan/completion-register.json` is source of truth, `COMPLETION_REGISTER.md` is generated view, `--check` fails when disagree. SUPPORTED requires ≥1 test id + gate line, both must resolve to files that exist. BLOCKED-ON-OWNER must name O-id that exists in taskboard OWNER table. RETIRED must name DEC id present in decision log. No route row may carry REVIEW disposition — it means nobody decided. Counts printed and compared to generators, so new route with no row fails build day it lands.

## 6. Multi-Task Execution Plan — Next 3 Hours Wall Time

We have 142h productive, unlimited tokens, need ~3h wall = 50 parallel workers avg 0.247h per task.

**Phase 1 (0-0.5h wall): E1 bundle diet T001-T030 — 8h productive, 30 tasks, 16 workers**
- T001-T002: measure baseline, audit static imports (2 tasks parallel)
- T003-T006: convert 4 exceljs files to dynamic (4 tasks parallel) — fix TS implicit any
- T007-T010: MigrationWizard fallback, jspdf audit + dynamic (4 tasks parallel)
- T011-T015: framer-motion lazy + date-fns granular (5 tasks parallel)
- T016-T019: ag-grid modular + recharts tree-shaking (4 tasks parallel)
- T020-T025: vite.config.ts manualChunks function form, per-sector split, build + measure after each diet (6 tasks sequential but fast)
- T026-T030: stats.html, bundle-check, lazy chunk load verification, docs (5 tasks)

**Phase 2 (0.5-1.5h wall): E2-E4 cash/workforce/treasury T031-T105 — 18h productive, 75 tasks, 20 workers**
- Each route: audit store + implement loading/error/empty + journey/empty/error/loading tests + interop + RBAC + audit + write-guard + spine + governance + register + matrix + docs:verify
- Parallelize by route: CashFlowPage, CashForecastPage, WorkforceDashboard, HeadcountPlan, TreasuryDashboard, CashPosition, FXExposure — 7 routes × ~10 tasks each = 70 tasks, 7 workers

**Phase 3 (1.5-2.0h wall): E5 reports + E10 routes 20-40 T106-T135 + T226-T300 — 23h productive, 105 tasks, 20 workers**
- 3 report pages + 25 new routes = 28 routes × 3 tasks each = 84 tasks + tie-back oracles + evidence + register
- Parallel by route

**Phase 4 (2.0-2.5h wall): E11 engines + E6+E12 money 45%→100% T301-T425 — 27h productive, 125 tasks, 25 workers**
- Engines: 180 engines hardening, 82 orphan EXPERIMENTAL gap named — 75 tasks, 10 workers
- Money: 649 files migration — 50 tasks batch by domain, 10 workers

**Phase 5 (2.5-2.8h wall): E13 oracles + E14 governance T426-T525 — 24h productive, 100 tasks, 20 workers**
- 50 oracles + 50 governance tasks — parallel

**Phase 6 (2.8-3.0h wall): E7 AI + E8+E15 a11y/perf/bundle + E9+E16 docs/owner/RC/release T161-T225 + T526-T575 — 22h productive, 115 tasks, 20 workers**
- AI census, a11y axe 40 routes, perf budgets, bundle <1950KB, owner packet, RC hardening, rollback rehearsal, runbook, handover, full gates

## 7. Immediate Next 10 Tasks to Start Multi-Task Now

1. **T001**: Measure baseline bundle: build + bundle-check (performance-and-bundle, vite-bundle-deep-optimization)
2. **T002**: Audit static exceljs/jspdf/framer-motion/date-fns/ag-grid/recharts imports via grep (vite-bundle-deep-optimization)
3. **T003-T006 fix**: Fix TS implicit any in exportExcel, ExcelImportEngine, MigrationEngine, financialPackageExport (excel-and-report-exports, ponytail) — build must PASS
4. **T008-T010**: Audit + convert jspdf to dynamic import('jspdf') (excel-and-report-exports)
5. **T011-T013**: Audit + lazy-load framer-motion (frontend-design, performance-and-bundle)
6. **T014-T015**: Audit + convert date-fns to granular imports (performance-and-bundle)
7. **T016-T019**: Audit ag-grid AllCommunityModule + recharts barrel + convert to modular/granular/lazy (ag-grid-modular-optimization, recharts-tree-shaking)
8. **T031-T033**: Audit CashFlowPage states + cashStore + add loading Skeleton (financial-domain-modeling, react-state-and-stores, accessibility-wcag)
9. **T136-T137**: Measure money:adoption 36.37% + list top 20 modules with number money (money-and-decimals)
10. **T206-T207**: Audit docs/plan/ stale files + regenerate completion-register.json (docs-and-decisions)

All 10 can run in parallel — different files, no conflicts.

## 8. Risks & Mitigations

| Risk | Impact | Mitigation | Skill |
|------|--------|------------|-------|
| Bundle diet increases gz due to chunk overhead | bundle-check FAIL, blocks all PRs | Keep grouping beneficial, use dynamic import not deletion, measure after each diet, DEC if rule wrong | vite-bundle-deep-optimization, gates-and-ratchets |
| Money adoption trivial markers counted as done | Debt not goal, oracle FAIL | Remove trivial toDecimal(0), replace with real arithmetic, oracle-value tests | money-and-decimals, reconciliation-and-tie-out |
| 4-state tests flaky due to store timing | test:sharded FAIL | Use isLoading from store, not setTimeout, Skeleton srLabel, ErrorState role=alert, deterministic | test-driven-development, react-state-and-stores |
| Perf flakes DataGrid 276ms>250ms, loadBench 10542ms>10000ms | a11y-q5-gate FAIL | Virtualize, memoize, lazy, measure, fix | performance-and-bundle |
| Unverified claims O1/O3/O4/O8/O9 leak into docs | docs:links FAIL, requirements-traceability FAIL | Grep 0 for D365 verified, data safe, SOX, CI green, entity-scope, owner packet default not claimed | requirements-traceability, owner-decisions |
| New route with no register row | completion:register --check FAIL | Generators re-read App.tsx, engine registry, annex parser, counts compared, new route fails day it lands | docs-and-decisions, verification-before-completion |
| gh pr edit silently fails | PR body stale | Use gh api -X PATCH repos/.../pulls/<n> -F body=@file pattern | docs-and-decisions |
| Single-process npm test dies Worker not defined | No recordable full run | Only test:sharded 8/8 sequential 400s per shard is recordable | testing-strategy |
| node_modules wiped | Build FAIL | npm ci --ignore-scripts, never npx <tool>, use node node_modules/.../bin | onboarding-a-codebase |

## 9. What Skipped / Not Checked in This Brainstorm

- Actual code edits for T001-T575 not yet executed — only planning doc created
- `npm run build` + `bundle-check` + `docs:verify` + `test:sharded` not yet run after plan expansion — risk baseline drift
- `completion-register.json` not yet regenerated for 40 routes SUPPORTED — risk 13 vs 40 mismatch
- Money adoption 36.37%→45%→100% actual file list not yet audited — risk 371/1020 stale

## 10. Next Action — Multi-Task Start

Start Phase 1 T001-T010 in parallel under start_process: build baseline, audit imports, fix TS errors, convert jspdf + framer-motion dynamic, granular date-fns, modular ag-grid, granular recharts, measure bundle after each.

> **Zero compromise means**: every task has evidence, every grade reproduced by test/script, no gate weakened, no breadth deleted (DEC-006), no unverified claims, backticked paths resolve, repo-only deliverables.

