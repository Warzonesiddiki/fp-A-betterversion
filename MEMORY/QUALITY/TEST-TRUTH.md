---
id: MEMORY/QUALITY/TEST-TRUTH.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# QUALITY/TEST-TRUTH — what the tests actually prove

- [MEASURE 2026-08-18] 1239 files matching `*.test.ts*` under `src/`. Count ≠ coverage ≠ truth.
- Last full-suite figure on record (session 002 journal): 1212 files, 13,738 passed, 1 skipped;
  server 207/207. **Not re-run this session.**

## Known ways tests here have lied

1. **Whole-engine `vi.mock`** — the board-pack suites asserted `$4.2M` from their own fixture while
   `$12.4M` shipped. Also live: `src/pages/healthcare/PatientRevenuePage.test.tsx` mocks
   `@/engines` while the page imports `@/engines/HealthcareEngine`, so the mock never applies —
   a vacuous mock that merely *looks* like isolation.
2. **A test that pins a fabrication.** `CashForecastPage.money.test.ts` asserted
   `buildCashCategorySplit(...)[0].inflows === 210.14` because `300.20 * 0.7`, locking an invented
   70% revenue weight into the product under the name "money known answers" (deleted, session 018).
   `__tests__/sectors/EducationDashboardPage.test.tsx` asserted the invented KPI labels and mocked
   `useEducationStore` with a `kpis` shape the store never had.
   `__tests__/sectors/GovernmentDashboardPage.test.tsx` rendered with an EMPTY store and asserted
   departments and charts appeared — it passed only because of the demo fallback, so it actively
   protected the fabrication (rewritten, session 019).
   `__tests__/sectors/LogisticsDashboardPage.test.tsx` was the same shape: empty store, asserted
   charts rendered, passing only because of module fixtures (rewritten, session 020).
   `ForecastBuilderPage.money.test.ts` asserted 940,000 / 1,060,000 then 925,000 / 1,075,000 for a
   flat 1,000,000 forecast — i.e. the invented 6% + 1.5%/period band, encoded as an oracle
   (rewritten, session 021). `InsuranceEngine.test.ts` pinned
   `netWrittenPremium === 1250000 * 0.85`, `policyCount === 0`, and a six-month Jan–Jun trend
   produced by a noise generator (rewritten, session 022).
   **Four such tests in six sessions: when you remove a fabrication, grep the test suite for the
   numbers you are deleting.**
   The inverse also happens: a session-022 assertion added two ratios as JS floats and expected
   `77.83000000000001` where the decimal engine returns `77.83`. Tests can carry float drift too.
3. **A fake oracle** — `VDB(10000,1000,5,2,4) === 4704` (correct 2304). A test named "oracle" is
   only an oracle if the expected value came from the vendor.
4. **Explicit-args blindness** — 381 SafeMathParser tests passed every optional argument, missing
   five zeroed defaults.
5. **Snapshot tests** (`DashboardPage.populated.contract.test.tsx`) lock DOM structure, not
   numbers. They pass happily while a figure is wrong.

## The standard this repo now requires

- A **source guard** (comments stripped, assignment patterns matched) *plus* a **DOM probe against
  the real engine** for every derivation extracted in W0.1.1.
- **Teeth check**: back up the production file to `/tmp`, reintroduce the defect, confirm the new
  test FAILS, restore. A test that passes against the bug is worthless.
- Known-answer unit tests on the derivation module with hand-computed values.
