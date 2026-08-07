# FinPlan Pro v1.0 Release Checklist

## Pre-Release Gates (ALL must pass)

### Build & Quality

- [x] `npx tsc --noEmit` — Zero TypeScript errors
- [x] `npm run lint` — Zero errors, zero warnings
- [x] `npm run build` — Production build succeeds
- [x] `node scripts/bundle-check.js` — Main chunk ≤150KB gzip
- [x] `npm run build && npm run preview` — Preview server works

### Testing

- [ ] Full suite green. STATUS 2026-07-29: `vitest run` now TERMINATES (894/894 files, 10,589 tests, 1001s) after the N-0001 deadlock fix, but exits non-zero — ~20 failures remain (N-0012). The previous "[x] 3,070+ tests passing" claim was false: the suite could not complete.
- [x] A11y suite runs and passes: `npm run test:a11y` exit 0, 441 passed / 2 skipped, enforced in CI (N-0007)
- [x] Engine tests: 100+ files, 1000+ tests passing
- [x] Store tests: 40+ files, 133+ tests passing
- [x] Page tests: 100+ files passing
- [ ] Full E2E test run with Playwright (requires browser)
- [ ] Performance benchmark suite (requires dedicated run)

### Security

- [x] Zero `@ts-nocheck` directives
- [x] Security utilities implemented (CSRF, rate limiting, PIIRedactor)
- [x] Zero-retention policy enforcer
- [x] Data classification and redaction
- [x] CSP: script-src uses a hash, no unsafe-eval. `style-src 'unsafe-inline'` retained and documented.
- [x] Dependency vulnerability scan: `npm audit --omit=dev` exit 0, 0 production vulnerabilities; blocking CI job added (N-0004)

### Accessibility

- [x] WCAG 2.2 AA a11y tests passing
- [x] Keyboard navigation tests passing
- [x] Focus management tests passing
- [x] Live region tests passing
- [ ] Full axe-core audit on all pages
- [ ] Screen reader verification (manual)

### Desktop (Tauri)

- [x] Tauri config complete (window, CSP, NSIS, updater)
- [x] SQL migrations (initial + cube schema)
- [x] 9 Tauri plugins configured
- [ ] `npm run tauri:build` — Desktop build succeeds (requires Rust toolchain)
- [ ] SQLite persistence end-to-end test
- [ ] Auto-update verification
- [ ] NSIS installer build and test

### Documentation

- [x] README.md comprehensive
- [x] CHANGELOG.md created
- [x] ARCHITECTURE.md exists
- [x] CONTRIBUTING.md exists
- [x] SECURITY.md exists
- [x] Clean up 145 codif/endorsement process docs — **DONE 2026-08-07 (MISSION D):** `docs/_archive/codif/` (145 files) + 64 more ritual/process docs deleted; docs/ 321 files / 5.8MB → 112 files / 1.7MB; `scripts/docs-link-check.mjs` (npm run docs:links) enforces a clean graph — 0 broken links / 0 broken citations (was 4 + 651)
- [ ] Final user guide review

## Release Steps

1. Run full test suite: `npm test`
2. Run E2E tests: `npm run test:e2e`
3. Build production: `npm run build`
4. Verify bundle: `node scripts/bundle-check.js`
5. Build desktop: `npm run tauri:build`
6. Tag release: `git tag v1.0.0`
7. Push tag: `git push origin v1.0.0`
8. Create GitHub release with CHANGELOG

## MISSION C Status (2026-08-07)

- [x] Period-close client UI shipped (F-01): `/periods/close` — fiscal-period grid, close checklist, state machine, money-exact pre-close validation, chained audit panel, post-close report export; 35 new tests (store/page/money/a11y)
- [x] Period-close RBAC: `period:read` (all), `period:close` (Admin + FP&A_Manager), `period:reopen` (Admin) — matrix + negative-auth tests green
- [x] Zero-mock-data completion (F-04): 23 synthetic arrays → 7 wired to real stores/engines, 16 labeled demo defaults; `scripts/mock-data-audit.mjs` enforces the disposition list (exit 1 on violations)
- [ ] Full E2E test run with Playwright — STILL UNVERIFIED_BLOCKED (browser CDN egress blocked in sandbox; box stays unchecked, not faked)

## MISSION E Status (2026-08-08)

- [x] Bottom-24 engine coverage push: engines layer coverage moved from **81.72% stmts / 83.54% lines → 89.69% stmts / 91.25% lines / 94.59% funcs / 74.69% branches** (20,610/22,977 stmts; 18,435/20,201 lines; 4,725/4,995 funcs).
- [x] SafeMathParser: coverage elevated from 62.05% → **92.36%** stmts (+524 covered stmts, +23 comprehensive oracle matrix tests across all 100+ functions).
- [x] AdvancedPDFEngine & ExportEngine: coverage elevated to **98.62%** and **100.00%** stmts respectively (TOC, watermarks, headers/footers, autoTable formatting, PDF bookmarks, and CSV formula sanitization).
- [x] Excel & Streaming Import: `exportExcel.ts` (100.00%) and `StreamImportEngine.ts` (95.50%) with chunking, validation error accumulation, and conditional formatting.
- [x] Performance & Optimization Layer: `CubePartitioner.ts` (97.59%), `ReportCacheEngine.ts` (88.04%), and `QueryCache.ts` (83.82%) with LRU/LFU/FIFO eviction and TTL expiration.
- [x] Full Math & Engineering Suite: `formula-functions/math.ts` (97.89%), `formula-functions/logical.ts` (100.00%), `formula-functions/statistical.ts` (95.97%), `formula-functions/financial.ts` (96.31%), `formula-functions/lookup.ts` (95.94%), and `formula-functions/text.ts` (87.62%).
- [x] Domain Engines: `SolverEngine.ts` (100%), `InsuranceEngine.ts` (100%), `XBRLEngine.ts` (97.61%), `WorkflowBuilderEngine.ts` (98.08%), `PivotTableEngine.ts` (96.29%), `VisualWorkflowEngine.ts` (95.40%), `WorkflowActionEngine.ts` (96.61%), `WorkflowTriggerEngine.ts` (90.19%), `WorkflowSchedulerEngine.ts` (94.11%), `MultiCurrencyEngine.ts` (97.59%), `PluginEngine.ts` (86.51%), `SmartImportMapper.ts` (83.47%), `DrillThroughEngine.ts` (81.57%), `EngineRegistry.ts` (88.70%).
- [x] Server-Side Period Close Synchronization: wired client store sync to `POST /api/periods/:id/transition` with graceful offline fallback; verified server lifecycle test suite (25/25 passed).
- [ ] Full E2E test run with Playwright — STILL UNVERIFIED_BLOCKED (env-bound; browser CDN egress blocked in sandbox; box stays unchecked, not faked).

