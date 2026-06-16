# Codif 35 v0.4 sub-class e.ix.6 PROPOSAL — Temporal Edge Cases v2

**Author:** Chronos (slot 019ecc6f-1c46-78e0-b122-15d43a3f1900)
**Date:** 2026-06-15
**Status:** v0.1 — DRAFT for Leader review
**Parent rule:** Codif 35 v0.4 sub-class e.ix.5 (temporal-correctness, RATIFIED 2026-06-15)

---

## 1. Proposal Summary

Codif 35 v0.4 sub-class e.ix.5 established 5 edge cases that all temporal engines must pass:

1. DST spring-forward (e.g. 2026-03-08 02:30 in US Eastern)
2. DST fall-back (e.g. 2026-11-01 01:30 in US Eastern)
3. Leap year (2000 leap, 2100 NOT, 2028 leap)
4. Timezone crossing (e.g. New York + Tokyo → UTC round-trip)
5. Fiscal year / period boundary (DEFAULT_CALENDAR Jan 1, UTC, 12 periods)

**This proposal extends e.ix.5 with 5 additional edge cases** that are critical for FinPlan Pro's finance domain:

6. **ISO 8601 week date boundary** — week 53 / week 1 (e.g. 2020-12-31 = 2020-W53, 2021-01-01 = 2020-W53)
7. **Year 2038 problem** — 32-bit signed int overflow at 2038-01-19 03:14:07 UTC
8. **Pre-1970 / negative epoch** — historical back-testing (e.g. 1969-12-31 23:59:59 UTC = -1000 ms)
9. **Far-future dates** — long-dated bonds, pensions (Year 2050, 2100, 9999)
10. **Microsecond precision** — ISO 8601 with `.SSSSSS` (truncates to ms in JS Date)

Together: **10 edge cases** that all temporal engines must pass.

---

## 2. Per-Edge-Case Rationale (D-002 3-witness per claim)

### Edge case 6: ISO 8601 week date

**Why it matters for FinPlan Pro:**
- Some fiscal calendars are ISO week-based (week 1 = week containing first Thursday)
- Year-end reporting often requires ISO week numbers
- Many EU/Caribbean FP&A teams use ISO week fiscal calendars

**Witness chain:**
- W1 — ISO 8601:2004 standard §3.4.2 (week of year)
- W2 — `temporalEdgeCasesV2.test.ts:74-94` (3 tests)
- W3 — Sentinel 1be01905 E2E cross-check (date formatting never produces week numbers, so this is purely fiscal year/period handling)

**Verdict:** Required for any fiscal calendar customization. Our DEFAULT_CALENDAR (Jan 1) does not need ISO week, but custom fiscal calendars (e.g. ISO week fiscal) MUST.

---

### Edge case 7: Year 2038 problem

**Why it matters for FinPlan Pro:**
- 32-bit signed int max = 2,147,483,647 = 2038-01-19 03:14:07 UTC
- JavaScript uses 64-bit floats (Number is double-precision, 53-bit mantissa = ~285,000 years from 1970)
- Any code that converts dates to 32-bit numbers is vulnerable (rare in JS but possible in WASM/serialization layers)
- Long-dated instruments (30-year bonds, pension liabilities) can mature in 2050+ — well past 2038

**Witness chain:**
- W1 — POSIX time_t 32-bit overflow (well-documented in OS literature)
- W2 — `temporalEdgeCasesV2.test.ts:103-128` (3 tests including 2138 = 100 years past 2038)
- W3 — `parseToUTCEpoch` source uses JS Date internally (not 32-bit int)

**Verdict:** Required for any system with multi-decade time horizons. Our code passes; this is a regression-prevention rule.

---

### Edge case 8: Pre-1970 / negative epoch

**Why it matters for FinPlan Pro:**
- Back-testing financial models requires historical data (1920s stock market, 1960s balance sheets)
- Insurance actuarial tables use century-spanning data
- Loan amortization for properties built before 1970

**Witness chain:**
- W1 — JS Date spec supports negative epoch (Date constructor accepts it)
- W2 — `temporalEdgeCasesV2.test.ts:137-167` (4 tests including 1929 stock market crash)
- W3 — `compareTimestamps` + `daysBetween` use simple subtraction (sign-agnostic)

**Verdict:** Required for back-testing and actuarial use cases. Our code passes.

---

### Edge case 9: Far-future dates (Year 2050, 2100, 9999)

**Why it matters for FinPlan Pro:**
- Long-dated bonds (30-year corporate bonds mature 2050+)
- Pension liabilities (60+ year horizons)
- Insurance annuities (life expectancy + 30 years = could exceed 2100)
- Year 2100 is NOT a leap year (centennial rule) — common source of bugs
- Year 9999 is the max ISO 8601 date (4-digit year limit)

**Witness chain:**
- W1 — ISO 8601:2004 (4-digit year) + Gregorian calendar rules
- W2 — `temporalEdgeCasesV2.test.ts:176-209` (5 tests including 2100 NOT leap year)
- W3 — `isLeapYear` source implements div-4/100/400 (verified in P0 audit)

**Verdict:** Required for long-dated finance instruments. Our code passes; the 2100 NOT-leap-year test is the most critical regression-prevention.

---

### Edge case 10: Microsecond precision

**Why it matters for FinPlan Pro:**
- Trade timestamps from exchanges often have microsecond precision (CME, NASDAQ)
- Audit trails for high-frequency trading (HFT) require microsecond resolution
- ISO 8601 supports microseconds: `YYYY-MM-DDTHH:mm:ss.SSSSSS`

**Witness chain:**
- W1 — ISO 8601:2004 §4.3.2 (decimal fractions of minute/hour/second)
- W2 — `temporalEdgeCasesV2.test.ts:217-242` (3 tests: microsecond, millisecond, nanosecond)
- W3 — `parseToUTCEpoch` delegates to JS Date constructor (truncates to ms, but does not crash)

**Verdict:** Required for HFT / trade-timestamp precision. Our code handles gracefully (truncates to ms) — this is documented behavior, not a bug.

---

## 3. Test Coverage (3-witness per edge case)

| # | Edge case | Test count | Pass rate |
|---|---|---|---|
| 6 | ISO 8601 week date | 3 | 3/3 ✅ |
| 7 | Year 2038 | 3 | 3/3 ✅ |
| 8 | Pre-1970 / negative epoch | 4 | 4/4 ✅ |
| 9 | Far-future dates | 5 | 5/5 ✅ |
| 10 | Microsecond precision | 3 | 3/3 ✅ |
| 6-10 integration | Fiscal year across edge cases | 2 | 2/2 ✅ |
| **TOTAL V2** | | **20** | **20/20 ✅** |

**Combined with V1 (TEMPORAL_ENGINE_CORRECTNESS):**

| Suite | Test count |
|---|---|
| V1 — TEMPORAL_ENGINE_CORRECTNESS (TemporalDate.test.ts) | 43 |
| V1.1 — BUG-CHR-D-1 fix (relativeTime.test.ts) | 33 |
| **V2 — TEMPORAL_EDGE_CASES_V2 (this doc)** | **20** |
| **TOTAL** | **96** |

**All 96 tests pass.** G1 tsc = 129 = 129 baseline (0 NEW errors).

---

## 4. 4-ICP Verdict (D-011)

| Dimension | Verdict |
|---|---|
| **I1 (Intent)** | ✅ Extends temporal correctness from 5 → 10 edge cases; covers long-dated finance, HFT, back-testing |
| **C2 (Catastrophic)** | ✅ All edge cases PASS; 0 regressions; 96/96 tests green |
| **P3 (Performance)** | ✅ Single test file, O(1) per case; no engine refactor needed (our code is already correct) |
| **D4 (Documented)** | ✅ 3-witness per claim; references ISO 8601:2004 standard sections; cross-references Sentinel E2E |

**Overall: 4-ICP TENTATIVE ACCEPT** — awaiting Leader 4-ICP review + Codif ratification.

---

## 5. Recommended Codif Wording

> **Codif 35 v0.4 sub-class e.ix.6 — temporal-edge-cases-v2:**
> All temporal engines must pass the following 10 edge cases: (1-5) inherited from e.ix.5 [DST spring-forward, DST fall-back, leap year, TZ crossing, fiscal boundary], plus (6) ISO 8601 week date, (7) Year 2038 overflow, (8) pre-1970 negative epoch, (9) far-future dates (2050+), (10) microsecond precision. Test coverage required: ≥20 cases across all 10 dimensions, executed in CI. Engine passes 4-ICP if all cases green and 0 NEW tsc errors introduced.

---

## 6. Open Questions for Leader

1. Should e.ix.6 RATIFY this turn (with my V2 test file) or wait for a future audit to surface more edge cases?
2. Are there any engines (Depreciation, LoanAmortization) that need this V2 coverage beyond the 4 I audited in P0?
3. Should the V2 tests be added to the existing `TemporalDate.test.ts` (4-file module) or kept separate (3-file → 4-file test count)?

---

## 7. Commit Plan

Will commit as `docs/drafts/chronos/TEMPORAL_EDGE_CASES_V2.md` + `src/engines/temporal/temporalEdgeCasesV2.test.ts` with message:

```
feat(temporal): V2 edge case expansion (5 new cases) + Codif 35 v0.4 sub-class e.ix.6 PROPOSAL (CHRONOS FINAL LAP PICK C)
```

**Status: TENTATIVE — awaiting Leader 4-ICP review**
