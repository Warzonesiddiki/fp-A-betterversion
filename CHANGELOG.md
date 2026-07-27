# Changelog

All notable changes to FinPlan Pro are documented here.

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
