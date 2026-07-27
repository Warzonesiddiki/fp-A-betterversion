# FINANCIAL ENGINE TEST REPORT — SPOT CHECK (10 ENGINES)

**Audit Date:** 2026-07-27  
**Sample Size:** 10 engines (representative across categories)  
**Method:** Read engine source files; verify input validation, edge cases, floating-point arithmetic, determinism, and unit consistency.

---

## ENGINE 1: `SageConnector` (API Integration / GL)

- **Category:** GL / Consolidation
- **File:** `src/services/api-integration/SageConnector.ts`
- **Input Validation:** `SageAuthConfig` validated at constructor (`type === 'oauth2_sage'`, `sender` fields present). `PaginationParams` not strictly validated (defaults applied). `accountId` used in SQL string interpolation (`C-07`).
- **Edge Cases:** Division by zero not applicable. Negative values allowed (`DEBITAMOUNT`, `CREDITAMOUNT` can be negative — not validated). `NaN` / `Infinity` not checked.
- **Floating-Point:** Uses `number` for amounts (`DEBITAMOUNT`, `CREDITAMOUNT`, `TOTAMOUNT`). No `decimal.js` or integer-cents representation (`C-06`). `aggregateGLBalance()` computes `netChange = totalDebits - totalCredits` with floating-point subtraction — potential rounding errors.
- **Determinism:** No `Math.random()` used (good for GL connector). `getTransactions()` uses `ORDER BY ENTRYDATE DESC` — deterministic.
- **Unit Consistency:** `AMOUNT` fields are numbers; no unit label (e.g., USD, EUR) enforced in amount field (`CURRENCY` is separate). `mapAccount()` maps `ACCOUNTTYPE` to `type` but defaults to `'asset'` for unknown types — could misclassify accounts.
- **Evidence:** `SageConnector.ts` lines 300-350 (`mapAccount`), 420-460 (`aggregateGLBalance`), 470-490 (`getTransactions` — SQL interpolation).
- **Status:** ❌ FAIL (SQL injection, floating-point currency, silent error swallowing)

---

## ENGINE 2: `CellAuditTrailEngine`

- **Category:** Audit / Data Integrity
- **File:** `src/engines/CellAuditTrailEngine.ts` (implied from `AuditTrailPage` import)
- **Input Validation:** `RecordInput` requires `cellId`, `userId`, `operation`, `dataType`, `newValue`. `previousValue` optional. `approvalStatus` optional. `metadata` optional (`Record<string, unknown>`).
- **Edge Cases:** No validation that `newValue` matches `dataType` (e.g., `newValue` is string but `dataType` is `'number'`). `revertToState()` allows mutation without validation (`C-03`).
- **Floating-Point:** Not a financial calculation engine (audit log). Uses `number` for `newValue` and `oldValue`. No decimal rules.
- **Determinism:** `getAllEntries()` returns array sorted by insertion order (not guaranteed). `AuditTrailPage` applies sorting externally.
- **Unit Consistency:** Not applicable (audit data, not currency).
- **Evidence:** `src/pages/audit/AuditTrailPage.tsx` uses `auditEngine.getAllEntries()` and applies filters/sort externally. `auditTrailStore` defines `revertToState()` but does not validate data types.
- **Status:** ⚠️ WARNING (mutable audit trail, no data type validation, no hash chain)

---

## ENGINE 3: `AIEngine` (Monte Carlo / Scenario Analysis)

- **Category:** Scenario / Forecasting
- **File:** `src/engines/AIEngine.ts`
- **Input Validation:** Not fully audited (file is large). `Monte Carlo` uses `Math.random()` (expected). No input schema validation (`Zod`) verified.
- **Edge Cases:** `division by zero` not checked in scenario calculations. `negative values` allowed (scenarios may include negative growth). `Infinity` / `NaN` not validated.
- **Floating-Point:** Uses `number` for all calculations. `benchmark` and `benchmark` tests exist but coverage not verified. No `decimal.js` usage confirmed.
- **Determinism:** `Monte Carlo` is non-deterministic by design (uses `Math.random()`). `AIEngine` may have non-deterministic results if using LLM/NIM outputs (`VITE_NIM_API_KEY` exposure).
- **Unit Consistency:** Percentages (e.g., `0.15` vs `15`) — not verified if consistent across engines.
- **Evidence:** `src/engines/AIEngine.ts` (partial read). `benchmark` tests (`AIEngine.benchmark.test.ts`) exist but not fully audited.
- **Status:** ⚠️ WARNING (floating-point currency, non-determinism expected, input validation unverified)

---

## ENGINE 4: `AICopilotEngine`

- **Category:** AI / Copilot
- **File:** `src/engines/AICopilotEngine.ts`
- **Input Validation:** Not fully audited. Uses `NIM` API (`src/services/nim.ts`). `NIM` prompts (`nim-prompts.ts`) generate prompts based on user input.
- **Edge Cases:** `nim.ts` uses `axios` for HTTP requests. `post` method does not validate response shape against `Zod` schema (`C-07` — similar SQL injection risk does not apply, but API response manipulation is possible if server response is malicious).
- **Floating-Point:** Not a financial calculation engine (prompt generation / LLM interaction).
- **Determinism:** LLM output is non-deterministic. `AICopilotEngine` may return different results for the same prompt (expected).
- **Unit Consistency:** Not applicable.
- **Evidence:** `src/services/nim.ts` (partial). `AICopilotEngine.ts` (partial). `nim-prompts.ts` (partial).
- **Status:** ⚠️ WARNING (non-determinism expected, input validation unverified, `VITE_NIM_API_KEY` exposure)

---

## ENGINE 5: `AdvancedExcelEngine`

- **Category:** Export / Reporting
- **File:** `src/engines/AdvancedExcelEngine.ts`
- **Input Validation:** Not fully audited. `AdvancedExcelEngine` exports data to `.xlsx`. `ExcelJS` (`exceljs`) is used. No `Zod` validation on exported data shapes verified.
- **Edge Cases:** `ExcelJS` writes cells as strings/numbers. If a cell contains a formula (`=1+1`), it will be interpreted by Excel upon opening (potential formula injection). No stripping of formulas (`=`, `+`, `-`, `@`) verified.
- **Floating-Point:** `ExcelJS` uses JavaScript `number` for cell values. No decimal encoding. Rounding errors may appear in exported spreadsheets.
- **Determinism:** Export is deterministic (same input → same file). `ExcelJS` does not use random values.
- **Unit Consistency:** Not verified if currency units are labeled in header rows.
- **Evidence:** `AdvancedExcelEngine.ts` (partial). `package.json` shows `exceljs: ^3.4.0`.
- **Status:** ⚠️ WARNING (potential formula injection, floating-point currency)

---

## ENGINE 6: `AggregateTableEngine`

- **Category:** OLAP / Reporting
- **File:** `src/engines/AggregateTableEngine.ts`
- **Input Validation:** Not fully audited. `AggregateTableEngine` aggregates data from `cubeStore` or similar.
- **Edge Cases:** Aggregation of `NaN` or `Infinity` values not validated. Negative amounts allowed (expenses). Division by zero if computing ratios (e.g., `expense / total`) without guard.
- **Floating-Point:** Uses `number` for aggregates. `benchmark.test.ts` and `test.ts` exist but not fully audited.
- **Determinism:** Aggregation is deterministic (sum, count, average — deterministic operations).
- **Unit Consistency:** Not verified if percentages are consistent (`0.15` vs `15`).
- **Evidence:** `AggregateTableEngine.benchmark.test.ts`, `AggregateTableEngine.test.ts`, `AggregateTableEngine.ts` (partial).
- **Status:** ⚠️ WARNING (floating-point currency, division by zero unverified)

---

## ENGINE 7: `GLTrialBalanceStore` / `GLTrialBalanceEngine`

- **Category:** GL / Accounting
- **File:** `src/store/glTrialBalanceStore.ts`, `src/store/glStore.ts`
- **Input Validation:** `GLUploadStore` validates CSV upload (`validateEntries`). `GLTrialBalanceStore` applies trial balance logic. Not fully audited.
- **Edge Cases:** Double-entry bookkeeping (`debit` = `credit`) enforced in `glAnalysis.ts` (`validateEntries`)? Not fully verified. `GLTrialBalancePage` displays balance — if unbalanced, it may show incorrect totals.
- **Floating-Point:** Trial balance uses `number` for amounts. `sum(debits) === sum(credits)` comparison with floating-point may fail due to rounding errors (`0.1 + 0.2 !== 0.3`).
- **Determinism:** Deterministic.
- **Unit Consistency:** Not verified.
- **Evidence:** `glStore.ts` (partial), `glTrialBalanceStore.ts` (partial), `GLTrialBalancePage` (not fully audited).
- **Status:** ⚠️ WARNING (floating-point trial balance equality may fail, double-entry enforcement unverified)

---

## ENGINE 8: `ForecastEngine` / `ForecastStore`

- **Category:** Forecasting / Scenario
- **File:** `src/store/forecastStore.ts`, `src/engines/` (forecast-related)
- **Input Validation:** `forecastStore` uses `persist()` with `masterStorage`. No `partialize` (sensitive forecast data persisted unencrypted — `H-01`). `forecast` actions not audited for RBAC (`C-02`).
- **Edge Cases:** Forecast calculations use `number` (floating-point). Negative values allowed (loss forecasts). `division by zero` if computing growth rates with zero base.
- **Floating-Point:** `forecast` values stored as `number`. No decimal rules enforced.
- **Determinism:** Deterministic (no random values in forecast calculations unless scenario analysis uses Monte Carlo).
- **Unit Consistency:** Not verified.
- **Evidence:** `forecastStore.ts`, `scenarioStore.ts` (partial).
- **Status:** ⚠️ WARNING (floating-point currency, unencrypted persistence, RBAC unverified)

---

## ENGINE 9: `CapExEngine` / `CapExStore`

- **Category:** CapEx / Capital Expenditure
- **File:** `src/store/capexStore.ts`
- **Input Validation:** `capexStore` uses `persist()` with `masterStorage`. No `partialize`. `capex` actions (`approve`, `update`) not audited for RBAC.
- **Edge Cases:** Depreciation calculations (`depreciationEngine` implied) use `number`. Negative depreciation not validated. `ROI` calculations (`ROI = (gain - cost) / cost`) may divide by zero if `cost = 0`.
- **Floating-Point:** `depreciation` amounts stored as `number`. `ROI` percentages as `number` (e.g., `0.15` for 15%). No decimal encoding.
- **Determinism:** Deterministic.
- **Unit Consistency:** `ROI` percentages — not verified if consistent (`0.15` vs `15`).
- **Evidence:** `capexStore.ts` (partial).
- **Status:** ⚠️ WARNING (floating-point currency, division by zero unverified, unencrypted persistence)

---

## ENGINE 10: `SyncEngine` (Offline-First / Conflict Resolution)

- **Category:** Data Integrity / Sync
- **File:** `src/engines/SyncEngine.ts`
- **Input Validation:** Not fully audited (`SyncEngine.ts` exists but not fully read).
- **Edge Cases:** Conflict resolution is `timestamp-based`. Clock skew (`two offline users create conflicting entries`) can cause silent overwrites. No `vector clock` or `CRDT` mechanism verified (`C-04` in data integrity section — conflict resolution not audited in detail).
- **Floating-Point:** Not applicable (sync engine manages entries, not calculations).
- **Determinism:** Timestamp-based resolution is deterministic given same timestamps.
- **Unit Consistency:** Not applicable.
- **Evidence:** User notes: "Conflict resolution is timestamp-based. What happens with clock skew? Can two offline users create conflicting entries that silently overwrite?" `SyncEngine.ts` not fully audited.
- **Status:** ❌ FAIL (conflict resolution mechanism unverified; clock skew risk; no CRDT)

---

## SUMMARY OF ENGINE TESTS

| Engine | Category | Pass / Fail / Warning | Key Issues |
|---|---|---|---|
| `SageConnector` | GL / Integration | ❌ FAIL | SQL injection, floating-point currency, silent errors |
| `CellAuditTrailEngine` | Audit | ⚠️ WARNING | Mutable audit, no hash chain, no data type validation |
| `AIEngine` | Scenario / Forecast | ⚠️ WARNING | Floating-point currency, non-determinism expected |
| `AICopilotEngine` | AI / Copilot | ⚠️ WARNING | `VITE_NIM_API_KEY` exposure, input validation unverified |
| `AdvancedExcelEngine` | Export / Report | ⚠️ WARNING | Potential CSV/formula injection, floating-point currency |
| `AggregateTableEngine` | OLAP / Aggregate | ⚠️ WARNING | Division by zero unverified, floating-point currency |
| `GLTrialBalanceStore` | GL / Accounting | ⚠️ WARNING | Trial balance equality with floating-point may fail |
| `ForecastStore` / `ForecastEngine` | Forecasting | ⚠️ WARNING | Unencrypted persistence, RBAC unverified, floating-point |
| `CapExStore` / `CapExEngine` | CapEx / Investment | ⚠️ WARNING | Division by zero (ROI), floating-point, unencrypted |
| `SyncEngine` | Offline / Sync | ❌ FAIL | Timestamp-based conflict resolution; clock skew; no CRDT |

---

## RECOMMENDATIONS FOR ENGINE CORRECTNESS

1. **Enforce decimal arithmetic** (`decimal.js`, `big.js`, or integer-cents) for ALL currency fields in ALL engines and stores (`C-06`).
2. **Add `Zod` input validation** to all engine entry points (`SageConnector.getTransactions`, `AdvancedExcelEngine.export`, `ForecastStore.createForecast`, etc.).
3. **Validate division by zero** before any ratio/percentage calculation (`ROI`, `growth rate`, `net change`).
4. **Remove SQL string interpolation** (`SageConnector`) — use parameterized queries or strict regex validation (`C-07`).
5. **Add `Math.random()` checks** — any engine that uses random values must be documented. Non-deterministic results must not affect audit trails or compliance reports.
6. **Verify double-entry bookkeeping** (`GLTrialBalanceStore`) — enforce at data model level (`debit` = `credit` for every transaction). Use exact arithmetic (not floating-point equality) for balance verification.
7. **Implement conflict resolution** (`SyncEngine`) with `vector clock` or `CRDT` (e.g., `Yjs`, `automerge`) instead of timestamp-based overwrite.
