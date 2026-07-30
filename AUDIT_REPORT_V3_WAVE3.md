# AUDIT REPORT V3 — WAVE 3

## Executive Summary

This wave continues the zero-compromise forensic audit of the FinPlan Pro (fp-A-betterversion) repository. The primary focus was on **KILL-002 (Money Primitive Adoption)**, **KILL-003 (Server-Side Authorization)**, **KILL-013 (Period Close State Machine)**, and **F-0013 (GitHub Actions SHA Pinning)**.

### Critical Fixes Applied

| #      | Finding                                                          | Severity | Status      | Fix                                                                                                                                                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-0001 | ThreeStatementEngine uses raw `number` for ALL financial amounts | **KILL** | **FIXED**   | Migrated to Decimal.js via `@/utils/money` — all financial arithmetic now uses `toDecimal()`, `sumMoney()`, `moneyEquals()`, `subtractMoney()`, `addMoney()`, `isWithinTolerance()`                                                                                                                               |
| F-0002 | SafeMathParser financial functions use raw float arithmetic      | **KILL** | **FIXED**   | Migrated NPV, IRR, PMT, PV, FV, CAGR, MIRR, XNPV, XIRR, SLN, SYD, DDB, CUMIPMT, CUMPRINC, RRI, NPER, RATE, PDURATION, YIELD, PRICE, DURATION, ISPMT to Decimal.js                                                                                                                                                 |
| F-0004 | Period close state machine not integrated into server            | **KILL** | **FIXED**   | Server periods.ts now uses `close_state` column, state machine transitions, `period_close_audit` table, entity scoping, `/transition` endpoint, `/state` endpoint, `/audit` endpoint                                                                                                                              |
| F-0009 | Audit and export routes missing entity scoping                   | **KILL** | **FIXED**   | Added `filterByEntityAccess` middleware to both audit.ts and export.ts                                                                                                                                                                                                                                            |
| F-0013 | GitHub Actions not pinned by SHA                                 | **KILL** | **FIXED**   | All actions pinned to immutable commit SHAs: `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683`, `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020`, `actions/upload-artifact@6f51ac03b9356f520e9adb1b1b7802705f340c2b`, `actions/download-artifact@fa0a91b85d4f404e444e00e005971372dc801d16` |
| F-0014 | No cargo audit in CI                                             | **KILL** | **PARTIAL** | Added server-test job to CI; cargo audit blocked by Rust toolchain absence                                                                                                                                                                                                                                        |
| F-0015 | Missing npm scripts for evidence commands                        | **KILL** | **FIXED**   | Added `export:verify`, `license:check`, `sbom`, `architecture:guardrails`, `financial:oracles`, `compliance:evidence`, `release:dry-run`                                                                                                                                                                          |

---

## Detailed Changes

### 1. ThreeStatementEngine — Money Primitive Migration (F-0001)

**Before:** All financial amounts used `number` type. Balance verification used `Math.abs(imbalance) <= this.BALANCE_TOLERANCE` (0.01). Display formatting used `value.toFixed(2)`. All arithmetic used raw `+`, `-`, `*`, `/`.

**After:** All financial calculations use Decimal.js via `@/utils/money`:

- `toDecimal()` for number-to-Decimal coercion
- `sumMoney()` for summing AccountEntry and CashFlowLineItem amounts
- `sumDividends()` for summing DividendEntry amounts
- `isWithinTolerance()` for comparing financial values (replaces `Math.abs(x) <= 0.01`)
- `moneyEquals()` for exact comparisons
- `fmt()` for display formatting (replaces `toFixed(2)`)
- `absDecimal()` for absolute value comparisons

**Key insight:** The `verifyBalance()` method now uses `toDecimal()` for all inputs and `isWithinTolerance()` for the imbalance check, eliminating IEEE-754 float drift in the Assets = Liabilities + Equity check.

### 2. SafeMathParser — Financial Functions Decimal Migration (F-0002)

**Before:** NPV, IRR, PMT, PV, FV, CAGR, MIRR, XNPV, XIRR used raw `number` arithmetic with `Math.pow()` and `+`/`-`/`*`/`/`.

**After:** All financial functions use `Decimal` for arithmetic:

- `NPV`: `Decimal` accumulator for present value sums
- `IRR`: Newton-Raphson with `Decimal` guess and iterations
- `PMT`: `Decimal` for loan payment calculations
- `PV`: `Decimal` for present value calculations
- `FV`: `Decimal` for future value calculations
- `CAGR`: `Decimal.pow()` for compound growth
- `MIRR`: `Decimal` for modified IRR
- `XNPV`: `Decimal` for date-based NPV
- `XIRR`: Newton-Raphson with `Decimal`
- `SLN`, `SYD`, `DDB`: `Decimal` for depreciation
- `CUMIPMT`, `CUMPRINC`: `Decimal` for cumulative interest/principal
- `RRI`, `NPER`, `RATE`, `PDURATION`: `Decimal` for investment calculations
- `YIELD`, `PRICE`, `DURATION`: `Decimal` for bond calculations
- `ISPMT`: `Decimal` for interest payment

### 3. Period Close State Machine — Server Integration (F-0004)

**Before:** Server `periods.ts` used binary `is_closed` flag with simple close/reopen endpoints.

**After:** Full state machine integration:

- `close_state` column (open/soft-close/hard-close/locked)
- `VALID_TRANSITIONS` table enforcing state progression
- `TRANSITION_ROLES` for role-based authorization
- `period_close_audit` table for immutable audit trail
- `/transition` endpoint for state machine transitions
- `/state` endpoint for querying current state
- `/audit` endpoint for period close audit trail
- Legacy `/close` and `/reopen` endpoints backward-compatible
- `filterByEntityAccess` middleware for entity scoping
- Force-reopen requires Admin approval with `approvalId`
- Reopen from soft-close/hard-close requires approval

### 4. Entity Scoping on Audit and Export Routes (F-0009)

**Before:** `audit.ts` and `export.ts` had no entity scoping — any authenticated Admin/Manager could see all entities' audit data and export any entity's data.

**After:** Both routes now use `filterByEntityAccess` middleware:

- Admin users see all entities (no filter)
- Non-admin users see only their accessible entities
- Entity filter applied to all list/query endpoints

### 5. GitHub Actions SHA Pinning (F-0013)

**Before:** All GitHub Actions referenced by mutable tags (`@v4`).

**After:** All actions pinned to immutable commit SHAs:

- `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (v4)
- `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4)
- `actions/upload-artifact@6f51ac03b9356f520e9adb1b1b7802705f340c2b` (v4)
- `actions/download-artifact@fa0a91b85d4f404e444e00e005971372dc801d16` (v4)

### 6. New npm Scripts and Verification Tools

| Script                    | Purpose                                   | Status        |
| ------------------------- | ----------------------------------------- | ------------- |
| `export:verify`           | Verify export security and fidelity       | ✅ Passes     |
| `license:check`           | Verify dependency licenses are compatible | ✅ Created    |
| `sbom`                    | Generate Software Bill of Materials       | ✅ Created    |
| `architecture:guardrails` | Verify architectural invariants           | ✅ 21/21 pass |
| `financial:oracles`       | Run financial statement oracle tests      | ✅ Created    |
| `compliance:evidence`     | Generate compliance evidence report       | ✅ 22/22 pass |
| `release:dry-run`         | Verify release build without errors       | ✅ Created    |

### 7. CI Improvements

- Added `server-test` job to CI workflow
- Server tests run in parallel with other jobs
- Build job now depends on server-test passing
- Summary gate includes server-test result

---

## Verification Evidence

### Commands That Pass

- `npx tsc --noEmit` → 0 (TypeScript compilation)
- `npm run money:adoption` → 0 (6/354 modules, 1.69%, ratchet holds)
- `npm run engines:verify` → 0 (179 engines)
- `npm run docs:verify` → 0 (all claims match)
- `npm run export:verify` → 0 (all export checks pass)
- `npm run architecture:guardrails` → 0 (21/21 guardrails pass)
- `npm run compliance:evidence` → 0 (22/22 compliance checks pass)
- `npm audit --omit=dev` → 0 (0 production vulnerabilities)
- `cd server && npm test` → 0 (38/38 tests pass)
- ThreeStatementEngine tests → 32/32 pass
- SafeMathParser tests → 381/381 pass
- PeriodCloseStateMachine tests → 35/35 pass
- Money property tests → 13/13 pass
- Financial statement oracles → 21/21 pass
- WorkingCapitalEngine tests → 10/10 pass
- Money utility tests → 29/29 pass

---

## Remaining Open Items

| #         | Finding                                                     | Severity | Status                                     |
| --------- | ----------------------------------------------------------- | -------- | ------------------------------------------ |
| F-0006    | Tauri secure_storage unlock bypass (any non-empty password) | **KILL** | OPEN — Requires Rust toolchain             |
| F-0010    | No fiscal calendar model (4-4-5, leap year)                 | **KILL** | OPEN                                       |
| F-0014    | No cargo audit in CI                                        | **KILL** | PARTIAL — Server tests in CI, Rust blocked |
| F-0017    | No OpenAPI/API contract specification                       | **KILL** | OPEN                                       |
| KILLX-002 | Print/PDF fidelity not verified                             | **KILL** | OPEN                                       |
| KILLX-003 | Identity/MFA/SSO not implemented                            | **KILL** | OPEN                                       |
| KILLX-004 | API contracts not specified                                 | **KILL** | OPEN                                       |
| KILLX-005 | Telemetry privacy not verified                              | **KILL** | OPEN                                       |
| KILLX-006 | No release signing                                          | **KILL** | OPEN                                       |
| KILLX-008 | Data governance not enforced                                | **KILL** | OPEN                                       |
| KILLX-009 | Fiscal calendar model missing                               | **KILL** | OPEN                                       |
| KILLX-011 | Workflow controls not implemented                           | **KILL** | OPEN                                       |
| KILLX-012 | Notifications not implemented                               | **KILL** | OPEN                                       |
| KILLX-013 | Integration governance not implemented                      | **KILL** | OPEN                                       |
| KILLX-014 | Visual regression not implemented                           | **KILL** | OPEN                                       |
| KILLX-015 | Offline/local-first not verified                            | **KILL** | OPEN                                       |
| KILLX-016 | Error taxonomy not defined                                  | **KILL** | OPEN                                       |
| KILLX-017 | Legal/licensing not verified                                | **KILL** | OPEN                                       |
| KILLX-018 | Extended accessibility not verified                         | **KILL** | OPEN                                       |
| KILLX-019 | Threat model not documented                                 | **KILL** | OPEN                                       |
| KILLX-020 | Desktop hardening not complete                              | **KILL** | OPEN                                       |
| KILLX-021 | Architecture guardrails not in CI                           | **KILL** | OPEN                                       |
| KILLX-022 | Observability not defined                                   | **KILL** | OPEN                                       |
| KILLX-023 | AI safety not verified                                      | **KILL** | OPEN                                       |
| KILLX-024 | Support/diagnostics not implemented                         | **KILL** | OPEN                                       |
| KILLX-025 | No-area-left-behind certification not complete              | **KILL** | OPEN                                       |
| KILL-002  | Money adoption at 1.69% (6/354)                             | **KILL** | OPEN — 102 toFixed sites remain            |
| KILL-009  | E2E not reproducibly executable                             | **KILL** | BLOCKED — No browser in sandbox            |

---

## Next Steps

1. **Migrate more engines to money primitive**: ReconciliationEngine, SignConventionEngine, ValidationEngine, BudgetEngine, ForecastEngine
2. **Create fiscal calendar model**: 4-4-5 calendar, leap year handling, period boundaries
3. **Add OpenAPI specification**: Define API contracts for all server routes
4. **Add architecture:guardrails to CI**: Wire into the CI workflow as a blocking gate
5. **Create threat model document**: Document attack surface, threat actors, mitigations
6. **Add error taxonomy**: Define error codes, severity levels, and response patterns
7. **Migrate remaining toFixed sites**: 102 raw toFixed sites remain in financial code
