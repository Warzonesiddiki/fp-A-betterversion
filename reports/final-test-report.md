# FinPlan FP&A — Final Test Coverage Report

> Generated: 2026-05-23 | No coverage runner (`@vitest/coverage-v8` not installed)

---

## Overall Summary

| Metric | Value |
|--------|-------|
| **Total source files** | 781 |
| **Total test files** | 615 |
| **File-level coverage** | **78.7%** |
| **Untested source files** | 166 |
| **Coverage runner** | Not available (`@vitest/coverage-v8` missing) |

> **Note:** Coverage is calculated at the *file* level — whether a `.test.ts`/`.test.tsx` counterpart exists for each source file. Line/branch/function coverage requires `@vitest/coverage-v8` to be installed and a successful `vitest run --coverage` pass.

---

## Per-Category Breakdown

### 1. Engines (`src/engines/`) — 98.9% file coverage

| Metric | Value |
|--------|-------|
| Source files | 189 |
| Test files | 187 |
| Untested | 3 |

**Untested files:**
- `src/engines/index.ts` — barrel export (low priority)
- `src/engines/report-builder-export.ts`
- `src/engines/report-builder-types.ts`

**Assessment:** Near-complete coverage. Engines are the backbone of the FP&A platform and are exceptionally well tested.

---

### 2. Store (`src/store/`) — 100% file coverage

| Metric | Value |
|--------|-------|
| Source files | 31 |
| Test files | 32 |
| Untested | 0 |

**Assessment:** Every store file has a dedicated test file. Some stores (e.g., `glStore.cube.test.ts`) have additional targeted test files. Fully covered.

---

### 3. Hooks (`src/hooks/`) — 100% file coverage

| Metric | Value |
|--------|-------|
| Source files | 33 |
| Test files | 33 |
| Untested | 0 |

**Assessment:** Every custom hook has a corresponding test. Fully covered.

---

### 4. Services (`src/services/`) — 72.2% file coverage

| Metric | Value |
|--------|-------|
| Core service files | 4 |
| API integration files | 6 |
| Mock data files | 20 |
| Test files | 10 |
| Untested | 20 |

**Untested files:**
- `src/services/api-integration/BaseConnector.ts`
- `src/services/mockData/accounts.ts`
- `src/services/mockData/activity.ts`
- `src/services/mockData/analytics.ts`
- `src/services/mockData/budgets.ts`
- `src/services/mockData/cellAuditEntries.ts`
- `src/services/mockData/collaboration.ts`
- `src/services/mockData/data.ts`
- `src/services/mockData/departments.ts`
- `src/services/mockData/entities.ts`
- `src/services/mockData/exchangeRates.ts`
- `src/services/mockData/forecasts.ts`
- `src/services/mockData/generators.ts`
- `src/services/mockData/glData.ts`
- `src/services/mockData/notifications.ts`
- `src/services/mockData/reports.ts`
- `src/services/mockData/scenarios.ts`
- `src/services/mockData/settings.ts`
- `src/services/mockData/users.ts`
- `src/services/mockData/variances.ts`

**Assessment:** Core services (`api.ts`, `reportService.ts`, etc.) are tested. `mockData/` files are static data generators — testing them is optional but recommended for data integrity.

---

### 5. Pages (`src/pages/`) — 98.4% file coverage

| Metric | Value |
|--------|-------|
| Source files | 183 |
| Test files | 180 |
| Smoke test files | 18 |
| Untested | 3 |

**Smoke tests:** 18 smoke test files cover broad page categories (banking, bonds, credit, energy, ESG, retail, SaaS, tax, telecom, treasury, workforce, scenarios, settings, reports, sectors, data pages, uncovered pages).

**Assessment:** Excellent coverage. Smoke tests provide breadth; individual page tests provide depth.

---

### 6. Components (`src/components/`) — 66.9% file coverage

| Metric | Value |
|--------|-------|
| Source files | 209 |
| Test files | 140 |
| Untested | 69 |

**Notable untested component groups:**

| Group | Untested count | Risk |
|-------|---------------|------|
| `ui/` (general UI) | 26 | Medium |
| `charts/` | 7 | Low |
| `ai/` (Copilot components) | 5 | Medium |
| `reports/` | 4 | Medium |
| `data/` | 3 | Medium |
| `errors/` (ErrorBoundaries) | 3 | Low |
| `ui/RuleEditor/` | 5 | Low |
| `variance/` | 1 | Low |
| Other | 15 | Varies |

**Key untested files:**
- `src/components/ui/ChatPanel.tsx`, `ChatMessage.tsx`, `ChatChart.tsx` — AI chat UI
- `src/components/ui/FormulaAutocomplete.tsx` — formula helper
- `src/components/ui/ConditionalFormattingPanel.tsx`
- `src/components/errors/EngineErrorBoundary.tsx`, `GridErrorBoundary.tsx`
- `src/components/ai/CopilotSidebar.tsx`, `CopilotChatTab.tsx`
- `src/components/charts/WaterfallChart.tsx`, `TreemapChart.tsx`, `HeatmapChart.tsx`
- `src/components/migration/MigrationWizard.tsx`

**Assessment:** Largest coverage gap. UI components are the most labor-intensive to test but also the most user-visible. Prioritize error boundaries and interactive components.

---

### 7. Utils (`src/utils/`) — 47.5% file coverage

| Metric | Value |
|--------|-------|
| Source files | 40 |
| Test files | 19 |
| Untested | 21 |

**Untested files:**
- `accessibilityTesting.ts`
- `animations.ts`
- `apiDocumentation.ts`
- `bulkOperations.ts`
- `bundleAnalyzer.ts`
- `clipboardUtils.ts`
- `demoDataSeeder.ts`
- `encryption.ts`
- `featureFlags.ts`
- `financialFormatting.ts`
- `lazyWithRetry.ts`
- `memoization.ts`
- `memoryMonitor.ts`
- `performance.ts`
- `performanceBudget.ts`
- `performanceMonitor.ts`
- `performanceTesting.ts`
- `persistenceDebouncer.ts`
- `routePreloader.ts`
- `searchEngine.ts`
- `securityHeaders.ts`

**Assessment:** Critical financial utils (`calculations.ts`, `validation.ts`, `formatters.ts`) are tested. Performance, security, and feature-flag utils are not. These are lower-risk but should be addressed.

---

### 8. Workers (`src/workers/`) — 27.3% file coverage

| Metric | Value |
|--------|-------|
| Source files | 11 |
| Test files | 3 |
| Untested | 8 |

**Untested files:**
- `batch-calc.worker.ts`
- `consolidation.worker.ts`
- `consolidationWorker.ts`
- `exportWorker.ts`
- `formulaWorker.ts`
- `index.ts` (barrel)
- `monte-carlo.worker.ts`
- `scenarioWorker.ts`
- `types.ts`
- `WorkerPool.ts`

**Tested:** `worker-pool.test.ts`, `worker-compute.test.ts`, `exports.test.ts`

**Assessment:** Lowest coverage category. Worker files run in Web Workers (off main thread) and may need specialized test harnesses. High priority for financial correctness.

---

## Coverage Summary Table

| Category | Source | Tests | Untested | Coverage |
|----------|--------|-------|----------|----------|
| Engines | 189 | 187 | 3 | **98.9%** |
| Store | 31 | 32 | 0 | **100%** |
| Hooks | 33 | 33 | 0 | **100%** |
| Services | 26 | 10 | 20 | **72.2%** |
| Pages | 183 | 180 | 3 | **98.4%** |
| Components | 209 | 140 | 69 | **66.9%** |
| Utils | 40 | 19 | 21 | **47.5%** |
| Workers | 11 | 3 | 8 | **27.3%** |
| **TOTAL** | **781** | **615** | **166** | **78.7%** |

---

## Recommendations

### Immediate (High Priority)

1. **Install `@vitest/coverage-v8`** — `npm i -D @vitest/coverage-v8` — to get line/branch/function coverage metrics
2. **Add tests for workers** — `formulaWorker.ts`, `consolidation.worker.ts`, `monte-carlo.worker.ts` compute financial results; untested workers risk silent calculation errors
3. **Test error boundaries** — `EngineErrorBoundary.tsx`, `GridErrorBoundary.tsx`, `PluginErrorBoundary.tsx` — these catch runtime failures; broken error boundaries crash the entire app

### Short-Term (Medium Priority)

4. **Component tests for interactive UI** — `ChatPanel.tsx`, `FormulaAutocomplete.tsx`, `ConditionalFormattingPanel.tsx`, `MigrationWizard.tsx` — user-facing interactions that could break silently
5. **Utils gap** — `encryption.ts`, `securityHeaders.ts`, `bulkOperations.ts` — security and data-integrity utilities
6. **Services mockData** — Add snapshot tests for mock data generators to catch schema drift

### Long-Term (Lower Priority)

7. **Chart components** — Visual components (charts, treemaps, heatmaps) are harder to unit test; consider visual regression testing
8. **Performance utils** — `performance.ts`, `performanceMonitor.ts`, `memoryMonitor.ts` — monitoring utilities, less critical for correctness
9. **Feature flags** — `featureFlags.ts` — ensure flag toggling logic is tested before production launch

---

## How to Run Coverage

```bash
cd "C:\Users\Tahir\Desktop\frontend that i want\fp&A"
npm i -D @vitest/coverage-v8
npx vitest run --coverage
```

This will generate a detailed HTML coverage report with line-by-line metrics.
