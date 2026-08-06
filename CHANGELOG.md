# Changelog

All notable changes to FinPlan Pro are documented here.

## [1.0.0] — 2026-08-06 — Release

### Phase 6 — Performance (verified)

- **Engine performance audit green** — `FormulaEngine.performance.test.ts` 23/23
  (calculation speed + memory-leak prevention); `ValidationEngine` 1,000-cell perf gate
  hardened with warm-up + best-of-5 sampling (steady-state <10ms contract kept
  falsifiable for O(n) regressions, no longer flaky on loaded CI machines).
- **Web-worker offloading verified** — 90/90 worker tests (consolidation, monte-carlo,
  batch-calc, storage, worker-pool + chaos + unavailable-fallback suites); load benches
  refreshed: monte-carlo 10k warm 14ms, ag-grid 100k-row prep 178ms, 500-row PDF 281ms.
- **New 5,000-row keyboard responsiveness gate** — `DataGrid.keyboardPerf.test.ts`:
  full-grid ArrowDown traversal (5,000 synchronous keystroke computations) in <100ms
  total with position-independence assertions that catch any O(row) scan regression.
- **Bundle budgets pass** — G3 + G19: total JS 2,021KB gzip within limit; excel-core /
  pdf / chart vendor chunks each ≤300KB gzip.
- Evidence: `reports/perf/phase-6-performance-verification-2026-08-06.md`.

### Phase 8 — Security Hardening (verified)

- **610+ security tests green** — `security.test.ts` 102, `ThreatModel` 75,
  `SecurityHeaders-CsrfProtection` 61, `PIIRedactor` 70, `SecretsVault` 75,
  secure-storage batch 208.
- **New GDPR outbound-governance suite** — `zeroRetentionEnforcer.test.ts` (19 tests)
  for the previously untested choke point: restricted PII/compensation data blocked
  outbound, `X-No-Retention`/`X-No-Training` headers with bounded 24h expiry, complete
  audit entries, mask/hash redaction before anything leaves the app.
- **Strict production CSP confirmed** — script-src hash-pinned (no `unsafe-inline`
  or `unsafe-eval` in script-src), `csp-hash-check.js` pass; secret-literal scan of
  `src/**` clean.
- **GDPR retention/deletion hooks verified** across audit logs
  (`auditTrailGdprEvents` + persistence suites, 20/20).
- Evidence: `reports/audit/phase-8-security-verification-2026-08-06.md`.

### Phase 9 — Tauri Desktop (verified)

- **Native integration verified** — `tauri.conf.json` (strict desktop CSP, NSIS bundle,
  tray, updater explicitly disabled), SQL migrations, `secure_storage.rs` +
  `crash_reporter.rs`; version 1.0.0 consistent across `package.json`,
  `tauri.conf.json`, `Cargo.toml`, `lib.rs` (`check-version-consistency.mjs` pass).
- **Desktop capabilities green** — `TauriSecureStorage`, `tauriSqlStorage` (SQLite
  persistence), `masterStorage` fail-closed + security suites, `useTauriGlobalShortcuts`
  7/7, `useTauriMenu` 12/12; offline mode via PWA service worker (468 precached entries).
- Native installer build (`npm run tauri:build`) documented as environment-bound
  (Rust toolchain) in RELEASE_CHECKLIST.md.
- Evidence: `reports/audit/phase-9-tauri-desktop-verification-2026-08-06.md`.

### Phase 10 — Release v1.0.0

- **Full clean-clone gate executed**: `npm ci` → `tsc --noEmit` 0 errors →
  `eslint src --max-warnings 0` clean → `vite build` green → **full `vitest run`:
  11,985+ tests passing, 0 failures** (one flaky wall-clock perf assertion stabilized,
  see Phase 6) → `test:a11y` 441 passing → `test:bench` 59/59 → Playwright enumeration
  534 tests clean.
- **Zero-defect check**: money ratchet 229/910 modules (baseline 209 held), 0 raw
  `toFixed` sites frontend + server; `verify-readme-stats.mjs` documentation truth
  check pass.
- **PROGRESS_TRACKER.html**: all 14 waves marked 100% Done; corrupted stats block from
  a former tracker-hook regex bug repaired.

## [2026-08-03] — money migration wave 2, GAP-4 decision, debt data entry

### Added

- **Money primitive adoption 16.67% → 21.11%** (59 → 76 modules, 0 raw `toFixed` sites) —
  14 more engines migrated to `src/utils/money.ts` (decimal.js, ROUND_HALF_UP), each with a
  falsified known-answer suite: `HealthcareEngine`, `BondPricingEngine`, `ImpairmentEngine`,
  `FairValueEngine`, `SegmentReportingEngine`, `RatioAnalysisEngine`, `WaterfallBridgeEngine`,
  `TaxEngine`, `EnergyEngine`, `VarianceAttributionEngine`, `ManufacturingEngine`,
  `AllocationRuleEngine`, `AssumptionEngine` (currency unit), `BudgetCollectionEngine`.
  **285 known-answer tests**; 83 pre-migration drift cases caught.
- **GAP-4 product decision** — soft-close permits adjusting entries: server `is_closed` now
  only flips for hard-close/locked, so `canPost` and the GL route agree (the frontend
  `PeriodCloseStateMachine` already implemented this policy).
- **Phase 2 fixture debt closed** — 20 test files now build GL fixtures with the required
  `amount` (typed `GLEntry[]` in the sector-page suite) + a 4-test regression suite pinning
  `InvalidMoneyError` on `undefined` amounts (the `$NaN` class of defect).
- **Phase 4 — DebtSchedulePage real data entry** — `DebtForm` with blocking validation
  (exact 6.25% → 0.0625, round-trip real-date check), add/edit/delete through the persisted
  RBAC-gated `debtStore`, reachable empty state. 28 new tests.

### Fixed

- `main` after PR #24 did not typecheck: restored the dropped money import in
  `FinancialInstrumentsEngine` (78 tsc errors), fixed a stray `.toNumber()` on a number in
  `ForecastReconciliationEngine`, removed 4 unused imports and re-ran prettier on 7 files
  (tsc 79 errors → 0; eslint 25 problems → 0).
- `FairValueEngine` DCF returned `Infinity` when discount rate equals terminal growth rate;
  it now throws `InvalidMoneyError` loudly (pinned by a test).
- README money-adoption claim synced to the measured importer count (now verified by
  `check-readme-claims`).

### Changed

- `architecture:guardrails` still fails on GAP-7 (52 unpinned workflow refs — blocker:
  GitHub App lacks `workflows` permission; tooling + patch already in repo).

## [Unreleased] — 2026-07-27

### Added

- **Precision Math Engine** (`src/utils/precisionMath.ts`) — BigInt-based financial arithmetic eliminating floating-point drift. 27 tests.
- **DAG Engine** (`src/engines/DAGEngine.ts`) — Directed Acyclic Graph for formula calculations with topological sort, circular dependency detection, and incremental recalculation. 13 tests.
- **ERP Write-Back Service** (`src/services/writeback.ts`) — Transactional push to external ERP systems (QuickBooks, NetSuite, SAP) with atomic operations and rollback. 14 tests.
- **CRDT Sync Engine** (`src/services/crdtSync.ts`) — Offline conflict-free replication with vector clocks, LWW-Registers, and conflict resolution strategies. 11 tests.
- **Operational Driver Engine** (`src/engines/OperationalDriverEngine.ts`) — Maps non-financial inputs (headcount, utilization, infrastructure) to financial outputs via driver chains with sensitivity analysis. 8 tests.
- **Cell Lineage Store** (`src/store/cellLineageStore.ts`) — Immutable per-cell provenance tracking with blockchain-style hash chains for complete audit trails.
- **Data Permission Filter** (`src/utils/dataPermissionFilter.ts`) — Row/column-level RBAC filtering with masking, read-only columns, and filtered views. 14 tests.
- **Zero-Retention Policy Enforcer** (`src/services/zeroRetentionEnforcer.ts`) — Outbound data governance with no-retention headers, data classification, and sensitive field redaction.
- **Rolling Forecast Hook** (`src/hooks/useRollingForecast.ts`) — 12/18/24-month automated fiscal period management.
- **7 Enterprise Type Systems** — precision, writeback, DAG, CRDT, cell-lineage, permissions, zero-retention.

### Fixed

- SageConnector duplicate return block causing 30 TypeScript errors
- masterStorage type compatibility with Zustand's PersistStorage
- AuditTrailPage conditional hooks (refactored into wrapper + content components)
- AuditTrailStore ExtendedAuditEntry type reconciliation
- tokenRotation test missing console.info/debug stubs
- masterStorage test expecting raw values (now expects encrypted)
- OnboardingWizard a11y tests matching real i18n translations
- Missing i18n translation keys for onboarding flow

### Changed

- Zero TypeScript errors (was 30)
- Zero lint errors/warnings (was 20 warnings)
- Production build passes cleanly (was broken)
- 428/430 accessibility tests passing (was 423/430)
- 3,070+ total tests verified passing

## [6f7494f] — 2026-07-23 (Baseline)

### Existing

- 200+ financial calculation engines
- 40+ Zustand stores with persistence
- 193 page components across 30+ domains
- 915 test files
- 6 Web Workers
- Plugin system with sandbox
- Audit trail with GDPR compliance
- 8-language i18n
- Tauri desktop shell with 9 plugins
- ERP connectors (QuickBooks, NetSuite, Sage, Salesforce, Xero, Dynamics)
- RBAC enforcer (528 lines)
- Formula engine with autocomplete and function registry
