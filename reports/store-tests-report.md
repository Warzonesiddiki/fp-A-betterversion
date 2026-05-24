# Store Tests Report

**Generated:** 2026-05-23
**Project:** FinPlan Pro FP&A
**Test Runner:** Vitest 4.1.7

---

## Summary

| Metric | Value |
|--------|-------|
| New test files created | 9 |
| New tests added | 136 |
| All new tests | ✅ 136/136 passing |
| Total store tests (full suite) | 564 across 34 files |
| Pre-existing failures | 4 (not introduced by this work) |

---

## New Test Files

| Store | File | Tests | Selectors Tested |
|-------|------|-------|-----------------|
| capexStore | `src/store/capexStore.test.ts` | 16 | `getProjectsByStatus`, `getTotalBudget`, `getTotalActual`, `getAssetsByCategory` |
| educationStore | `src/store/educationStore.test.ts` | 15 | `getTotalEnrollment`, `getActiveProgramCount` |
| esgStore | `src/store/esgStore.test.ts` | 14 | `getMetricsByCategory`, `getOverallScore` |
| fxRateStore | `src/store/fxRateStore.test.ts` | 11 | `rates`, `rateCount`, `hasRates`, `findRate` (via `fxRateSelectors`) |
| governmentStore | `src/store/governmentStore.test.ts` | 15 | `getTotalUtilization`, `getFundsByStatus` |
| logisticsStore | `src/store/logisticsStore.test.ts` | 16 | `getActiveShipmentCount`, `getOnTimeRate` |
| retailStore | `src/store/retailStore.test.ts` | 16 | `getLowStockProducts`, `getTopStores`, `getTotalRevenue` |
| telecomStore | `src/store/telecomStore.test.ts` | 16 | `getTotalSubscribers`, `getAverageARPU` |
| workforceStore | `src/store/workforceStore.test.ts` | 17 | `getEmployeesByDepartment`, `getTotalPayroll`, `getHeadcountByDepartment` |

---

## Test Coverage Per Store

Each test file covers:

- **CRUD actions**: set, add, update, remove for primary entities
- **Edge cases**: empty arrays, null values, zero denominators, non-existent IDs
- **Computed selectors**: derived calculations with empty-populated-boundary data
- **State management**: loading, error, clearAll resets
- **State immutability**: non-existent update targets leave state unchanged

---

## Pre-existing Failures (not introduced)

| File | Test | Root Cause |
|------|------|-----------|
| `uiStore.test.ts` | `should set theme` | `localStorage.setItem` not mocked in test env |
| `forecastStore.test.ts` | `should update a driver` | `updateDriver` doesn't mutate driver in place |
| `collaborationStore.test.ts` | `should update approval status` | `reviewApproval` doesn't set `comments` field |

---

## How to Run

```bash
# Run only the 9 new test files
node node_modules/vitest/vitest.mjs run src/store/capexStore.test.ts src/store/educationStore.test.ts src/store/esgStore.test.ts src/store/fxRateStore.test.ts src/store/governmentStore.test.ts src/store/logisticsStore.test.ts src/store/retailStore.test.ts src/store/telecomStore.test.ts src/store/workforceStore.test.ts --reporter=verbose

# Run all store tests
node node_modules/vitest/vitest.mjs run src/store/ --reporter=verbose
```

---

## Store Inventory (all 28 stores)

| Store | Test File | Status |
|-------|-----------|--------|
| analyticsStore | ✅ analyticsStore.test.ts | Pre-existing |
| authStore | ✅ authStore.test.ts | Pre-existing |
| budgetStore | ✅ budgetStore.test.ts | Pre-existing |
| **capexStore** | ✅ capexStore.test.ts | **NEW** |
| collaborationStore | ✅ collaborationStore.test.ts | Pre-existing |
| constructionStore | ✅ constructionStore.test.ts | Pre-existing |
| cubeStore | ✅ cubeStore.test.ts | Pre-existing |
| dataStore | ✅ dataStore.test.ts | Pre-existing |
| driverStore | ✅ driverStore.test.ts | Pre-existing |
| **educationStore** | ✅ educationStore.test.ts | **NEW** |
| energyStore | ✅ energyStore.test.ts | Pre-existing |
| **esgStore** | ✅ esgStore.test.ts | **NEW** |
| forecastStore | ✅ forecastStore.test.ts | Pre-existing |
| **fxRateStore** | ✅ fxRateStore.test.ts | **NEW** |
| glStore | ✅ glStore.test.ts + glStore.cube.test.ts | Pre-existing |
| **governmentStore** | ✅ governmentStore.test.ts | **NEW** |
| healthcareStore | ✅ healthcareStore.test.ts | Pre-existing |
| insuranceStore | ✅ insuranceStore.test.ts | Pre-existing |
| **logisticsStore** | ✅ logisticsStore.test.ts | **NEW** |
| notificationStore | ✅ notificationStore.test.ts | Pre-existing |
| realEstateStore | ✅ realEstateStore.test.ts | Pre-existing |
| reportStore | ✅ reportStore.test.ts | Pre-existing |
| **retailStore** | ✅ retailStore.test.ts | **NEW** |
| scenarioStore | ✅ scenarioStore.test.ts | Pre-existing |
| settingsStore | ✅ settingsStore.test.ts | Pre-existing |
| **telecomStore** | ✅ telecomStore.test.ts | **NEW** |
| tourStore | ✅ tourStore.test.ts | Pre-existing |
| uiStore | ✅ uiStore.test.ts | Pre-existing |
| varianceStore | ✅ varianceStore.test.ts | Pre-existing |
| **workforceStore** | ✅ workforceStore.test.ts | **NEW** |
| migration/* | ✅ cubeMigration.test.ts + cubeEngine.test.ts | Pre-existing |

**Result: 100% store test coverage** — all 28 main stores have test files.
