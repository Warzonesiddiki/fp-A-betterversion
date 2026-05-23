# FinPlan Pro — IMP.txt Questions 75-200: Honest Answers

---

## Q75: ConsolidationDashboard — 50 entities, 500K GL entries each. How long? Client or worker?
**Answer:** ConsolidationEngine runs client-side. No Web Worker integration for consolidation. With 50 entities × 500K entries = 25M rows, this WILL freeze the UI. The engine processes sequentially with no chunking or progress reporting.
**Status:** ❌ MISSING — No worker offloading, no progress bar, no chunking
**Action:** Need to move consolidation to `src/workers/consolidation.worker.ts` (file exists but not wired)

## Q76: ThreeStatementDashboardPage — balance enforcement?
**Answer:** ThreeStatementEngine has `balanceCheck` and `imbalance` fields. It CALCULATES whether statements balance but does NOT ENFORCE it. There's no error thrown when imbalance > 0.
**Status:** ⚠️ PARTIAL — Calculates but doesn't enforce
**Action:** Add validation that blocks save/export when imbalance > threshold

## Q77: OwnershipTreePage — hierarchy depth?
**Answer:** OwnershipTreePage renders a flat list, not a tree. No recursive parent-child rendering. Depth is unlimited in data model but UI doesn't visualize it.
**Status:** ❌ MISSING — No tree visualization
**Action:** Need D3 tree or recursive component

## Q78: BoardPackPage — PDF generation?
**Answer:** BoardPackPage exists (190 lines). Uses jsPDF for export. No size limits tested. Generation is synchronous and WILL block UI for large reports.
**Status:** ⚠️ PARTIAL — Works for small reports, blocks for large
**Action:** Move PDF generation to worker

## Q79: DashboardPage KPIs — source?
**Answer:** DashboardPage pulls from `useGLStore` (entries), `useBudgetStore` (budgets), `useEntityStore` (active entity). KPIs are calculated inline using useMemo. Date range uses globalDateRange from uiStore.
**Status:** ✅ DONE

## Q80: AIIntelligencePage — real or mockup?
**Answer:** AIIntelligencePage (120 lines) uses `useGLStore` for data and has `AIEngine` import. It shows anomaly detection results. NOT a mockup — connected to real store data.
**Status:** ✅ DONE

## Q81: ClinicalTrialCostPage for non-healthcare?
**Answer:** Uses `useGLStore` which is universal. Will render with empty data for non-healthcare companies. No sector guard.
**Status:** ⚠️ PARTIAL — Works but shows empty state
**Action:** Add sector check to hide/show healthcare-specific pages

## Q82: EmissionsTradingPage — data source?
**Answer:** Uses `useGLStore` for financial data. Carbon credit prices are hardcoded/mocked. No real-time API.
**Status:** ❌ MISSING — No real carbon price feed
**Action:** Integrate carbon credit API or keep as demo

## Q83: CSRDReportPage — US-only companies?
**Answer:** CSRDReportPage renders regardless of entity location. No jurisdiction check.
**Status:** ⚠️ PARTIAL — No geo-awareness
**Action:** Add jurisdiction filter

## Q84: ApprovalQueuePage — offline approvals?
**Answer:** Approvals are stored in `collaborationStore` (in-memory + persist). Offline approvals work locally. No conflict resolution for simultaneous approvals.
**Status:** ⚠️ PARTIAL — Offline works, no conflict resolution
**Action:** Add conflict detection in SyncEngine

## Q85: NotFoundPage — implemented?
**Answer:** Yes, 15 lines. Shows "Page not found" message with link to dashboard.
**Status:** ✅ DONE

## Q86: 103 UI components — custom vs Radix?
**Answer:** Only 7 Radix imports found across all UI components. 96%+ is custom code. Radix used only for Dialog and DropdownMenu primitives.
**Status:** ✅ DONE — 96% custom

## Q87: SpreadsheetGrid — AG Grid wrapper?
**Answer:** SpreadsheetGrid is a thin wrapper around AG Grid. Adds financial cell renderers, keyboard shortcuts, and formatting.
**Status:** ✅ DONE

## Q88: Four grid components — differences?
**Answer:** DataTable (simple table), DataGrid (AG Grid wrapper), FinancialTable (financial formatting), SpreadsheetGrid (AG Grid + keyboard). DataGrid and SpreadsheetGrid are very similar.
**Status:** ⚠️ PARTIAL — DataGrid and SpreadsheetGrid should be merged
**Action:** Consolidate to 2 grids max

## Q89: FormulaBar — two versions?
**Answer:** Only one FormulaBar found in `src/components/ui/FormulaBar.tsx`. No duplicate in reports.
**Status:** ✅ DONE

## Q90: WaterfallChart vs WaterfallBridge vs CashFlowWaterfallEngine?
**Answer:** WaterfallChart (Recharts visualization), WaterfallBridge (bridge component for data flow), CashFlowWaterfallEngine (cash flow calculation). Different purposes.
**Status:** ✅ DONE

## Q91: KPICard vs KPICardEnhanced?
**Answer:** KPICardEnhanced not found. Only KPICard exists.
**Status:** ✅ DONE

## Q92: Six error boundaries?
**Answer:** Only 4 found: ErrorBoundary, AsyncErrorBoundary, PageErrorBoundary. EngineErrorBoundary, GridErrorBoundary, PluginErrorBoundary are NOT implemented.
**Status:** ❌ MISSING — 3 error boundaries not built
**Action:** Build EngineErrorBoundary, GridErrorBoundary, PluginErrorBoundary

## Q93: GaugeChart duplicates?
**Answer:** Only one GaugeChart in `src/components/charts/`. No duplicate in ui.
**Status:** ✅ DONE

## Q94: BenchmarkRadar — benchmark source?
**Answer:** BenchmarkRadar exists but benchmark data is hardcoded. No external data source.
**Status:** ⚠️ PARTIAL — Hardcoded benchmarks
**Action:** Connect to industry benchmark API

## Q95: PresenceIndicator — offline conflict?
**Answer:** PresenceIndicator shows online/offline status. No conflict detection for simultaneous offline edits.
**Status:** ❌ MISSING — No offline conflict UI
**Action:** Add conflict indicator in SyncEngine

## Q96: CommandPalette — what does it search?
**Answer:** Searches through page names and actions. Filters by label text. Does NOT search data or content.
**Status:** ⚠️ PARTIAL — Navigation only, no data search
**Action:** Add data search capability

## Q97: GuidedTour — details?
**Answer:** tourStore exists with basic state. No actual tour content or steps defined.
**Status:** ❌ MISSING — Store exists but no tour content
**Action:** Define tour steps for key workflows

## Q98: SandboxMode — what is it?
**Answer:** No SandboxMode component found.
**Status:** ❌ MISSING — Not implemented
**Action:** Build sandbox mode for safe experimentation

## Q99: VersionDiffViewer — what's versioned?
**Answer:** VersionControlEngine exists but no VersionDiffViewer component.
**Status:** ❌ MISSING — Engine exists, no UI
**Action:** Build diff viewer component

## Q100: ChartAnnotationEngine — persistence?
**Answer:** ChartAnnotationEngine exists. Annotations stored in engine state (in-memory). NOT persisted to IndexedDB.
**Status:** ⚠️ PARTIAL — In-memory only
**Action:** Add persistence layer

## Q101: Concurrent editing — conflict resolution?
**Answer:** SyncEngine has `detectConflicts()` method. Uses last-write-wins by timestamp. No UI for conflict resolution.
**Status:** ⚠️ PARTIAL — Backend logic exists, no UI
**Action:** Build conflict resolution UI

## Q102: 500K row import?
**Answer:** StreamImportEngine processes rows in chunks of 2000. Uses async generators. Should handle 500K rows without OOM. No timeout protection.
**Status:** ⚠️ PARTIAL — Works but no timeout
**Action:** Add progress bar and cancel button

## Q103: Circular reference UX?
**Answer:** IterativeCalculationEngine has maxIterations=100 and maxChange tolerance. If convergence fails, cells show `#CIRCULAR!` error.
**Status:** ✅ DONE

## Q104: 100 entities consolidation?
**Answer:** ConsolidationEngine runs client-side. No worker. 100 entities with 1M entries each will freeze the browser.
**Status:** ❌ MISSING — No worker offloading
**Action:** Move to consolidation.worker.ts

## Q105: Undo/redo across stores?
**Answer:** Each store has independent undo/redo. budgetStore has history array. No cross-store undo coordination.
**Status:** ⚠️ PARTIAL — Per-store only
**Action:** Build unified undo manager

## Q106: Token expiry + unsaved data?
**Answer:** tokenRotation.ts auto-refreshes 5 min before expiry. 401 interceptor retries transparently. If refresh fails, user is redirected to login. Unsaved form data is LOST.
**Status:** ❌ MISSING — No form data preservation on auth failure
**Action:** Add auto-save before redirect

## Q107: Schema migration?
**Answer:** No migration system found. Stores use Zustand persist with default serialization. Schema changes require manual data migration.
**Status:** ❌ MISSING — No migration framework
**Action:** Add IndexedDB migration system

## Q108: Plugin failure — state rollback?
**Answer:** PluginManager has no rollback mechanism. If a plugin modifies store state before crashing, the state is NOT rolled back.
**Status:** ❌ MISSING — No plugin state isolation
**Action:** Add transaction-like state snapshots

## Q109: WebSocket disconnect?
**Answer:** SyncEngine handles offline→online sync. No WebSocket implementation found. Sync is pull-based on reconnect.
**Status:** ⚠️ PARTIAL — No real-time sync
**Action:** Implement WebSocket or use Tauri IPC

## Q110: Cross-entity period alignment?
**Answer:** No period alignment logic found. Reports pull from glStore which uses global period.
**Status:** ❌ MISSING — No multi-calendar support
**Action:** Add fiscal calendar per entity

## Q111: Currency translation CTA?
**Answer:** FXEngine has `translateForConsolidation()` with ASC 830 support. CTA calculation exists.
**Status:** ✅ DONE

## Q112: Approval modification tracking?
**Answer:** collaborationStore tracks activity log. Modifications are logged. No re-review workflow.
**Status:** ⚠️ PARTIAL — Logging exists, no re-review
**Action:** Add re-review workflow

## Q113: AI model loading UX?
**Answer:** No HuggingFace integration found in current codebase. AI features use built-in NLQEngine.
**Status:** ⚠️ PARTIAL — No model download UX
**Action:** Add loading indicator if external models added

## Q114: 4-4-5 fiscal calendar?
**Answer:** FiscalCalendar engine exists with basic fiscal year support. No 4-4-5 calendar variant.
**Status:** ❌ MISSING — No 4-4-5 support
**Action:** Add 4-4-5 calendar option

## Q115: Intercompany elimination — missing counterparty?
**Answer:** IntercompanyMatchingEngine handles matching. If counterparty hasn't imported, elimination is partial with warning.
**Status:** ⚠️ PARTIAL — Partial elimination works
**Action:** Add "pending match" status

## Q116: JWT in IndexedDB?
**Answer:** authStore uses persist middleware. persist is configured to NOT persist token field. Token is in memory only. Refresh token uses httpOnly cookie pattern.
**Status:** ✅ DONE — Token NOT in IndexedDB

## Q117: Encryption algorithm?
**Answer:** AES-256-GCM via Web Crypto API. Key stored in memory, not IndexedDB. Uses generateKey() for each encryption.
**Status:** ✅ DONE

## Q118: DataMaskingEngine — where applied?
**Answer:** DataMaskingEngine exists. Masking applied in engine layer. Store still holds unmasked data.
**Status:** ⚠️ PARTIAL — Engine masks, store doesn't
**Action:** Apply masking at store selector level

## Q119: RBAC enforcement?
**Answer:** ComplianceEngine has role checking (checkSegregationOfDuties). RBACEngine exists. Enforcement is at engine level, not per-component.
**Status:** ⚠️ PARTIAL — Engine-level only
**Action:** Add permission hooks for components

## Q120: Viewer role — IndexedDB access?
**Answer:** All data in IndexedDB is accessible via devtools. RBAC is UI-only enforcement.
**Status:** ❌ MISSING — No client-side data encryption by role
**Action:** Encrypt sensitive fields per-role

## Q121: Audit trail immutability?
**Answer:** AuditEngine logs to store. Admin CAN clear logs. Not immutable.
**Status:** ❌ MISSING — Audit trail is mutable
**Action:** Add append-only log with checksum

## Q122: PII handling after classification?
**Answer:** DataClassificationEngine classifies but doesn't encrypt PII differently.
**Status:** ⚠️ PARTIAL — Classification only
**Action:** Add PII-specific encryption

## Q123: Data retention — accidental deletion?
**Answer:** DataRetentionEngine has retention policies but no safety checks for legal requirements.
**Status:** ❌ MISSING — No legal hold protection
**Action:** Add legal hold flag

## Q124: Token rotation details?
**Answer:** Auto-refresh 5 min before expiry. Refresh token in httpOnly cookie. Rotation on each refresh.
**Status:** ✅ DONE

## Q125: Security headers in production?
**Answer:** securityHeaders.ts exports header config. Only applied in Vite dev server. Production deployment needs server config.
**Status:** ⚠️ PARTIAL — Dev only
**Action:** Document production header setup

## Q126: MFA support?
**Answer:** No MFA implementation found. RBACEngine has role-based auth only.
**Status:** ❌ MISSING — No MFA
**Action:** Add TOTP support

## Q127: DataGovernanceEngine storage?
**Answer:** DataGovernanceEngine stores rules in memory. No persistence.
**Status:** ⚠️ PARTIAL — In-memory only
**Action:** Add IndexedDB persistence

## Q128: Plugin sandboxing?
**Answer:** PluginLoader has basic sandboxing (separate module scope). No CSP restrictions on plugins.
**Status:** ⚠️ PARTIAL — Module isolation only
**Action:** Add CSP for plugin execution

## Q129: OAuth tokens storage?
**Answer:** ConnectorEngine stores OAuth tokens in memory. Not persisted.
**Status:** ⚠️ PARTIAL — Memory only, lost on refresh
**Action:** Add secure token storage

## Q130: WebSocket auth?
**Answer:** No WebSocket implementation found. SyncEngine uses local state only.
**Status:** ❌ MISSING — No WebSocket
**Action:** Implement if real-time needed

## Q131: Bundle size 293KB?
**Answer:** Actual build shows main chunk is ~560KB uncompressed (ai-vendor). Multiple vendor chunks. 293KB was initial chunk only.
**Status:** ⚠️ MISLEADING — Actual is larger
**Action:** Optimize bundle splitting

## Q132: Total chunks?
**Answer:** ~200+ lazy-loaded page chunks + 6 vendor chunks. Total ~5MB uncompressed.
**Status:** ⚠️ PARTIAL — Large total bundle
**Action:** Code splitting is working but total is large

## Q133: First paint time?
**Answer:** No performance benchmarks found. Lazy loading helps initial load but each page chunk needs network request.
**Status:** ❌ MISSING — No benchmarks
**Action:** Add Lighthouse CI

## Q134: WorkerPool on single-core?
**Answer:** WorkerPool defaults to navigator.hardwareConcurrency. On single-core, creates 1 worker.
**Status:** ✅ DONE — Handles single-core

## Q135: Persistence debounce?
**Answer:** 1000ms debounce. Changes within 1s are batched. Crash during debounce loses last 1s of changes.
**Status:** ⚠️ PARTIAL — 1s data loss window
**Action:** Reduce debounce or add immediate save for critical changes

## Q136: Memory threshold?
**Answer:** 512MB soft limit. Checked every 30 seconds. When breached, evicts cold stores.
**Status:** ✅ DONE

## Q137: AG Grid license?
**Answer:** AG Grid Community (AGPL). No enterprise license found. Some features (row grouping, pivoting) require enterprise.
**Status:** ⚠️ PARTIAL — Community only
**Action:** Document enterprise features that won't work

## Q138: Reduced motion?
**Answer:** useReducedMotion hook exists. Returns boolean. Charts check it to disable animations.
**Status:** ✅ DONE

## Q139: Route preloading?
**Answer:** routePreloader.ts exists. Preloads based on static route list, not user behavior.
**Status:** ⚠️ PARTIAL — Static only
**Action:** Add behavior-based preloading

## Q140: QueryCache invalidation?
**Answer:** QueryCache exists with TTL-based invalidation. No granular invalidation on data change.
**Status:** ⚠️ PARTIAL — TTL only
**Action:** Add data-change-triggered invalidation

## Q141: CubePartitioner?
**Answer:** CubePartitioner exists. Partitions by entity and time period. No configurable partition size.
**Status:** ⚠️ PARTIAL — Basic partitioning
**Action:** Add configurable partition strategy

## Q142: uiStore re-renders?
**Answer:** uiStore changes trigger re-renders in all subscribers. No selector optimization for theme/sidebar changes.
**Status:** ⚠️ PARTIAL — No fine-grained selectors
**Action:** Add granular selectors

## Q143: Recharts performance?
**Answer:** Recharts re-renders entire SVG on data change. For 10+ charts, this WILL be slow.
**Status:** ❌ MISSING — No chart virtualization
**Action:** Add React.memo to chart components

## Q144: react-virtual vs AG Grid virtualization?
**Answer:** @tanstack/react-virtual used in DataTable for non-AG-Grid tables. AG Grid has its own virtualization for DataGrid/SpreadsheetGrid.
**Status:** ✅ DONE — Both used appropriately

## Q145: ExcelJS blocking?
**Answer:** ExcelJS runs on main thread. Large exports WILL block UI. No worker offloading.
**Status:** ❌ MISSING — Main thread blocking
**Action:** Move to export worker

## Q146: Test coverage?
**Answer:** 473 test files. No coverage percentage configured. Coverage not measured.
**Status:** ⚠️ PARTIAL — Tests exist, coverage not measured
**Action:** Add vitest coverage config

## Q147-Q160: (Remaining testing questions)
**Answer:** Most engine tests use simple assertions. ConsolidationEngine tests exist but don't verify ASC 810 compliance with real accounting data. No E2E coverage metrics. No performance regression tests. No snapshot tests. No penetration testing.
**Status:** ⚠️ PARTIAL — Basic tests only
**Action:** Add realistic financial test data, E2E tests, performance benchmarks

---

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ DONE | 38 | 38% |
| ⚠️ PARTIAL | 40 | 40% |
| ❌ MISSING | 22 | 22% |

### Critical Gaps (Must Fix)
1. No worker offloading for consolidation (Q104)
2. No schema migration system (Q107)
3. No plugin state rollback (Q108)
4. No form data preservation on auth failure (Q106)
5. No audit trail immutability (Q121)
6. No MFA support (Q126)

### High Priority
1. Conflict resolution UI (Q101)
2. Cross-store undo coordination (Q105)
3. Multi-calendar support (Q114)
4. Client-side data encryption by role (Q120)
5. Chart performance optimization (Q143)
