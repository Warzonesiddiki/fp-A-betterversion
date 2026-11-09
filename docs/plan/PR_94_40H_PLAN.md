# PR #94 — 40-Hour Quota Plan (covers PR #89 shortfall + PR #94)

> **Historical planning snapshot (2026-10-23):** This plan's O4-blocked language predates DEC-102. Current owner decision: this product is not a SOX compliance system; its local chain is client evidence, not SOX authority. O4 is resolved, not a current blocker.

> **Rule**: 20h productive per PR, no idle time. Last PR #89 broke rule (1-line fix merged). This PR must deliver 40h productive work (20h + 20h).
> **Status**: planning, adopted 2026-10-23, branch `arena/0c09f26a-fp-a-betterversion`
> **Skills activated**: ponytail (full), executing-plans, writing-plans, verification-before-completion, systematic-debugging, test-driven-development, onboarding-a-codebase, performance-and-bundle, financial-domain-modeling, money-and-decimals, audit-trail-and-lineage, reconciliation-and-tie-out, architecture-boundaries, react-state-and-stores, testing-strategy, docs-and-decisions, requirements-traceability, accessibility-wcag, frontend-design, charts-and-data-display, excel-and-report-exports, forms-and-validation, gates-and-ratchets
> **External skills acquired**:
> - vite-bundle-deep-optimization (from vitejs/vite discussions #9440, shaxadd.medium.com, mykolaaleksandrov.dev) — manualChunks function form, route-level lazy, avoid barrel, ESM, sideEffects false, visualizer
> - ag-grid-modular-optimization (from ag-grid.com/modules, blog.ag-grid.com/minimising-bundle-size) — cherry-pick modules, ModuleRegistry.registerModules, up to 40% reduction in v33
> - recharts-tree-shaking (from github.com/recharts/recharts/issues/7018, jamesrossjr.com) — granular imports, avoid barrel, dynamic import for heavy charts
> - driver-based-scenario-modeling (from pigment.com, farseer.com, getaleph.com) — 5-7 key drivers, base/upside/downside, what-if, driver ownership, scenario capability core
> - rolling-forecast-implementation (from cubesoftware.com, cleoai.tech, metapraxis.com) — driver-based framework, 12-18 month horizon, 5-day cycle, IBM 12% accuracy gain
> - asc-810-consolidation-elimination (from houseblend.io, dart.deloitte.com ASC 810-10-45-1, pwc viewpoint) — 100% elimination regardless of NCI, single economic entity, ELIM entries

## Reasoning before tasks (zero compromise)

**Current baseline** (measured 2026-10-23, b20730f):
- SUPPORTED 27 = 10 routes + 17 caps, 695 rows, spine 10/36, gov 10/30, one-stop 10, missingIsNotZero 0
- Bundle: 6825.56KB raw / 2064.16KB gzip = 99.2% of 2080KB limit, 1 warning (excel 248KB gz, grid 206KB gz, pdf 179KB gz, chart 129KB gz, sector-pages 109KB gz, index 69KB gz)
- Money adoption 31.27% (319/1020), money:ast 0 unsafe
- 231 routes, 0 REVIEW, 84 EXPERIMENTAL, 141 MIGRATE, 6 RETAIN
- Test suite 8/8 shards 872s, 1412 files

**Why 40h needed**:
- Last PR merged 1-line fix (spineEvidence expectation) without 20h productive work — broke rule.
- This PR must deliver 40h to cover debt + current.

**What counts as productive (no idle)**:
- Code that changes bundle size (measured before/after)
- Route promotion with 4-state evidence + tests that fail first
- Governance evidence with RBAC/audit/write-guard tests
- Money adoption migration (module-by-module)
- Docs updated in same commit as work

**Zero compromise rules**:
- No gate weakened to pass (DEC required if rule wrong)
- No breadth deleted to make numbers look better (DEC-006)
- No unverified claims (O1 D365 verified, O3 data safe, O4 SOX, O8 CI green, O9 entity-scope)
- Backticked paths must resolve (docs:links --strict)
- Repo-only deliverables, merge with gh pr merge --merge when gates green

## 40-Hour Breakdown (measurable)

| # | Task | Hours | Exit Gate | Skill | Evidence |
|---|------|-------|-----------|-------|----------|
| 1 | Bundle deep analysis + visualizer report | 2h | `npm run build` + `bundle-check` before/after numbers, stats.html exists | performance-and-bundle, vite-bundle-deep-optimization | bundle-report/stats.html, bundle-check output |
| 2 | vite.config: remove sector-pages manualChunk, split into per-sector lazy, verify no preload regression | 4h | build + bundle-check total < 2050KB gz, critical path < 500KB gz, G19 PASS | performance-and-bundle, vite-bundle-deep-optimization | vite.config.ts diff, bundle-check |
| 3 | ag-grid modular audit: ensure only needed modules registered, ValidationModule dev-only | 3h | DataGrid.tsx already modular, verify bundle no regression, tests PASS | ag-grid-modular-optimization, performance-and-bundle | DataGrid.tsx, bundle-check |
| 4 | recharts optimization: dynamic import for heavy chart components (Treemap, Heatmap, etc.) in sector pages | 5h | sector-pages chunk < 80KB gz, chart-vendor < 120KB gz, total < 2000KB gz | recharts-tree-shaking, performance-and-bundle, charts-and-data-display | chart components, bundle-check |
| 5 | /consolidation promotion to SUPPORTED (11th route) — 4-state handling + interop tests | 6h | journey/empty/error/loading tests PASS, spine-evidence 11/40, governance 11/33, docs:verify PASS | financial-domain-modeling, asc-810-consolidation-elimination, test-driven-development, react-state-and-stores, frontend-design, accessibility-wcag | ConsolidationDashboard.test.tsx 4 states, spine-evidence.json, governance-evidence.json |
| 6 | /scenarios promotion (12th route) — add loading/error + journey/empty tests | 6h | 4-state tests PASS, spine 12/44, gov 12/36, docs:verify PASS | driver-based-scenario-modeling, test-driven-development, forms-and-validation | ScenarioListPage.test.tsx + deep.test.tsx |
| 7 | /forecasts promotion (13th route) — add loading/error + journey/empty tests | 6h | 4-state tests PASS, spine 13/48, gov 13/39, docs:verify PASS | rolling-forecast-implementation, driver-based-scenario-modeling, test-driven-development | ForecastListPage.test.tsx + deep |
| 8 | Money adoption N8: migrate 20 modules from number to Money (target 35%) | 5h | money:adoption 35%+, money:ast 0 unsafe, financial:oracles 25/25 | money-and-decimals, determinism-and-reproducibility | money adoption output |
| 9 | Docs + decision log + taskboard + handover + plan update, full gates | 3h | docs:verify, docs:links --strict, tsc, eslint, format:check, test:sharded 8/8, bundle-check, skills:verify, routemap:check all PASS | docs-and-decisions, requirements-traceability, verification-before-completion, finishing-a-branch | TASKBOARD, decision-log, HANDOVER, COMPLETION_PLAN |

**Total**: 40h productive, no idle.

## Sequencing and Dependencies

```
1 bundle analysis (2h) ─┐
2 vite.config split (4h) ├─ 3 ag-grid audit (3h) ─┐
4 recharts dynamic (5h) ─┘                         ├─ 5 /consolidation (6h) ─ 6 /scenarios (6h) ─ 7 /forecasts (6h) ─ 8 money adoption (5h) ─ 9 docs+gates (3h)
```

Parallelizable: 2,3,4 can run in parallel after 1. 5,6,7 can be prepared in parallel but must update register sequentially.

## Failure Modes and Controls

| Failure | Control |
|---------|---------|
| Bundle reduction increases total due to chunk overhead | Measure after each step, revert if total rises |
| Route promotion without 4-state evidence | verify-spine-evidence.mjs fails on missing file/title |
| Governance claim without RBAC test | verify-governance-evidence.mjs fails |
| Money migration breaks existing tests | money:ast + financial:oracles + tsc + sharded |
| Docs links broken | docs:links --strict |
| 40h not verifiable | This plan logs hours per task with gate outputs |

## What it does NOT claim

- D365 shapes verified (O1) — still synthetic
- Data safe / backup (O3) — still blocked
- SOX authority (O4) — still blocked
- CI green (O8) — still UNVERIFIABLE (403)
- Entity-scope authorization (O9) — still BLOCKED-ON-OWNER
- Native desktop / offline auth (O7) — still blocked
- Bundle below 1950KB target — aiming for <2000KB first, then 1950KB in follow-up PR #97

## Gates before merge

- docs:verify PASS
- docs:links --strict PASS
- tsc --noEmit PASS
- eslint src --max-warnings 0 PASS
- format:check PASS
- test:sharded 8/8 PASS
- bundle-check PASS (no increase, ideally decrease)
- skills:verify PASS
- routemap:check PASS
