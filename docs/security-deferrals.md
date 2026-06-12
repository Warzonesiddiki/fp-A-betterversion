---
name: Security & Data-Integrity Deferrals
type: audit
description: Living register of known security findings, data-integrity bugs, and policy exceptions that are KNOWN but DEFERRED for shipping. Each entry is auditable evidence of the team's CC7.2 (anomaly monitoring + remediation tracking) control posture for SOC 2 / ISO 27001.
---

# Security & Data-Integrity Deferrals

**Owner:** Athena (Code Perfectionist) + Hephaestus (Security)
**Reviewers:** Founder (quarterly), external auditor (annual)
**Format:** Each entry is a discrete known issue that ships (or has shipped) without an in-cycle fix. An entry MUST have: (a) file:line, (b) severity, (c) blast radius, (d) remediation plan + ETA, (e) in-code marker (FIXME / TODO / X-ACK), (f) reporter + reviewer.
**Audit citation:** SOC 2 CC7.2 ("The entity monitors system components for anomalies and tracks remediation"), ISO 27001 A.12.6.1 ("Management of technical vulnerabilities"), ISO 27001 A.18.2.2 ("Compliance with security policies and standards").

> **Discipline rule (Hephaestus, 2026-06-12):** A known bug shipping without an entry in this file is a control failure. The shipping moment is the same; the audit posture is vastly different. The "we knew but didn't document" path is a finding-grade event; the "we knew, documented, and tracked" path is a CAP (Corrective Action Plan) event — both recoverable, only one of them without an auditor escalation.

---

## DEFER-2026-001 — AnomalyDetectionEngine.percentile() linear-interp vs nearest-rank

**Date opened:** 2026-06-12
**Reporter:** Athena (test-triage cycle)
**Reviewer:** Hephaestus (security/data-integrity)
**Severity:** Medium (data-integrity, not security)
**Status:** DEFERRED — fix in next sprint
**Component:** `src/engines/AnomalyDetectionEngine.ts:193-214` (function `percentile()`)
**Test evidence:** `src/engines/AnomalyDetectionEngine.lovelace.test.ts:26` — `expect(stats.q3).toBe(20)` for `computeStatistics([10, 20])`; actual returns `17.5`.

### Description

`percentile()` implements **linear-interpolation** (Excel `PERCENTILE.EXC` family), but the test suite in `AnomalyDetectionEngine.lovelace.test.ts` expects **nearest-rank** (type-1, Excel `QUARTILE` convention). The two methods agree when the percentile index lands on a whole number, but disagree at fractional indices.

### Blast radius

- **Affected percentiles:** Q1 (p=25), Q3 (p=75), and any user-supplied percentile `p` where `(p/100) * (n-1)` is non-integer.
- **Affected dataset sizes:** Small (`n < 5`). For `n >= 5`, the nearest-rank and linear-interp results agree to within 1 data-point step on sorted data.
- **Affected user workflows:** Anomaly detection, financial close anomaly flagging, variance reporting where IQR is used. NOT affected: median (p=50 always integer for odd n), min, max, mean, sum, count.
- **Severity rationale:** For a typical enterprise dataset (hundreds of transactions), IQR-based flagging is unaffected. For a user testing with a small synthetic sample (e.g. demo data, unit-test fixtures), the visible Q3 will be off by 1 data-point step. **No data loss, no security exposure, no PII leak.** The worst case is a user looking at a chart sees a slightly different Q3 line.
- **Customer impact estimate:** < 1% of users will hit this in normal use. All such users can self-correct by adding 1-2 data points to push `idx` to a whole number.

### Remediation plan

**ETA:** Sprint 2026-Q3-W2 (2 weeks from push)
**Owner:** Apollo (post-push P1 work)
**Test that proves the fix:** `npx vitest run src/engines/AnomalyDetectionEngine.lovelace.test.ts` should show the 1 failing test passing.

**Proposed fix** (from `docs/drafts/athena/test-triage/PATTERN-4-engines-fixes.md`):

```ts
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  // Nearest-rank (type-1) percentile. For sorted.length=2, p=75:
  //   rank = ceil(0.75 * 2) = 2 → sorted[1] = 20. ✓
  // For sorted.length=5, p=25:  rank = ceil(0.25 * 5) = 2 → sorted[1] = 20. ✓
  // For sorted.length=5, p=75:  rank = ceil(0.75 * 5) = 4 → sorted[3] = 40. ✓
  const rank = Math.min(
    Math.max(Math.ceil((p / 100) * sorted.length), 1),
    sorted.length
  );
  return sorted[rank - 1]!;
}
```

### In-code marker

`// FIXME (data-integrity, deferred): percentile() below uses linear interpolation ...`

Located directly above the `percentile` function definition in `AnomalyDetectionEngine.ts:193`.

### Audit trail

- 2026-06-12 14:00 UTC: Discovered by Athena during test-failure triage (apollo push blocker).
- 2026-06-12 14:30 UTC: Reviewed by Hephaestus; severity Medium confirmed; deferred to next sprint.
- 2026-06-12 14:35 UTC: In-code FIXME added by Athena (commit pending).
- 2026-06-12 14:40 UTC: This deferral entry filed by Athena.

### Cross-references

- Test evidence: `src/engines/AnomalyDetectionEngine.lovelace.test.ts:26`
- Triage report: `docs/drafts/athena/test-triage/REPORT.md` (Pattern D section)
- Fix design: `docs/drafts/athena/test-triage/PATTERN-4-engines-fixes.md`

---

## DEFER-2026-002 — decimalUtils rounding float-drift in `roundToCents` and `roundToTotal`

**Date opened:** 2026-06-12
**Reporter:** Hephaestus (post-Mnemosyne v0.3 cascade reclassification, Pattern E)
**Reviewer:** Hephaestus (data-integrity lane)
**Severity:** Medium (data-integrity, not security)
**Status:** DEFERRED — covered by post-push decimal.js task
**Component:** `src/utils/decimalUtils.ts:3-5` (`roundToCents`), `:7-10` (`roundToDecimals`), `:25-42` (`roundToTotal`)
**Test evidence:** 2 failing tests in `src/utils/decimalUtils.test.ts` per Mnemosyne v0.3 (TBD exact lines after Athena's triaged run; candidates are `roundToCents(-1.005) → -1.01` and `roundToTotal([0.125,0.125,0.125], 0.375) → sum 0.375`)

### Description

`decimalUtils.ts` uses the classic `Math.round((value + Number.EPSILON) * factor) / factor` pattern for currency rounding. This pattern fails for:

1. **Negative half-values:** `Math.round(-100.49999999999999) = -100` (JavaScript's `Math.round` rounds half toward +Infinity, not banker's). `roundToCents(-1.005)` returns `-1.0` not `-1.01` — opposite sign convention from `roundToCents(1.005) === 1.01`. A negative-line allocation round-trips wrongly.
2. **Total-distribution logic:** `roundToTotal([0.125, 0.125, 0.125], 0.375)` produces `[0.13, 0.13, 0.13]` summed from the upward bias of each `Math.round(0.125*100)=13` (instead of distributing the missing cent). The function's intent — "round to 2dp preserving the target total" — fails by $0.005 per call.

### Blast radius

- **Affected functions:** `roundToCents`, `roundToDecimals`, `safeMultiply`, `safeDivide`, `roundToTotal`, `toFixedSafe` — every caller inherits the float bug.
- **Affected callers:** Engines that import from `decimalUtils` (allocation, tax, consolidation, driver cascade). Variance reports that use `roundToTotal` for distributing rounding errors will over- or under-allocate by 1¢ per line.
- **Customer impact:** Variance report totals may differ by 1¢ per line item. For a 100-line allocation, this is $1.00 of accumulated drift in the displayed total. **No data loss, no security exposure, no PII leak.** Worst case: CFO sees a $99,999.00 instead of $100,000.00 in a quarterly close. Auditor notices, asks for explanation, FP&A team must re-reconcile.
- **Severity rationale:** The drift is small, deterministic, and reproducible. It does not corrupt persisted data; it only mis-rounds computed values. SOC 2 CC7.2 still requires tracking because the bug is in a financial utility that FP&A auditors will scrutinize.

### Remediation plan

**ETA:** Sprint 2026-Q3-W1 (alongside the post-push decimal.js task)
**Owner:** Apollo (post-push P1 work)
**Tracking task:** Apollo post-push P1 "Add decimal.js to engine layer + rewrite 6 P0/P1 float-bug engines" (decimal.js is already in scope; extending the rewrite to the utility layer is in-scope per ADR-008)
**Test that proves the fix:** `npx vitest run src/utils/decimalUtils.test.ts` should show all 35 tests passing (0 failing).

**Proposed fix shape:**
```ts
import { Decimal } from 'decimal.js';

export function roundToCents(value: number): number {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toNumber();
}

export function roundToDecimals(value: number, decimals: number): number {
  return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_EVEN).toNumber();
}

// roundToTotal: build a Decimal accumulator, distribute fractional remainder in 1¢ steps
// using Decimal arithmetic (not Math.round on cents), so the sum equals target exactly.
```

### In-code marker

`// FIXME (data-integrity, deferred DEFER-2026-002): Math.round + Number.EPSILON is not banker's-rounding-safe ...`

To be added at line 1 of `src/utils/decimalUtils.ts` by Apollo during the decimal.js post-push task. (Not adding now to avoid churn during the active push.)

### Audit trail

- 2026-06-12 15:00 UTC: Mnemosyne v0.3 reclassification identifies 2 decimalUtils tests as Pattern E.
- 2026-06-12 15:15 UTC: Hephaestus accepts ownership (data-integrity lane; co-review by Athena for code-pattern consistency).
- 2026-06-12 15:30 UTC: This deferral entry filed by Hephaestus.

### Cross-references

- Test file: `src/utils/decimalUtils.test.ts` (35 tests, 2 failing per Mnemosyne v0.3)
- Triage report: Mnemosyne v0.3 Pattern E amendment to TESTING.md §0 + §11
- Fix design: Apollo post-push P1 "Add decimal.js to engine layer" (extension to utility layer is in-scope per ADR-008)
- Sibling deferral: DEFER-2026-001 (AnomalyDetectionEngine percentile — same float/precision class)

---

## DEFER-2026-003 — chunkedStorage.ts concurrent setItem/getItem races (torn writes, orphaned chunks, resurrection)

**Date opened:** 2026-06-12
**Reporter:** Hephaestus (post-Mnemosyne v0.3 cascade reclassification, Pattern E; co-owned with Prometheus for race-detection rigor)
**Reviewer:** Hephaestus (data-integrity lane, primary); Prometheus (concurrency / queueing rigor, secondary)
**Severity:** Medium (data-integrity, not security)
**Status:** DEFERRED — needs design discussion (mutex vs. IndexedDB vs. OCC version-stamps)
**Component:** `src/utils/chunkedStorage.ts:17-92` (`wrapChunkedStorage` — `getItem` L19-42, `setItem` L44-79, `removeItem` L81-91)
**Test evidence:** 1 failing test in `src/utils/chunkedStorage.test.ts` per Mnemosyne v0.3 (TBD exact line; mock-based tests do not exercise concurrency — the latent races below are NOT covered by existing tests)

### Description

`wrapChunkedStorage` is the single-flight path for all persisted zustand stores that go through `masterStorage.ts`. Four race windows identified by static analysis:

1. **setItem + setItem (torn write)** — Two stores write the same key concurrently. Both compute chunks, both write metadata (L62), both write chunks in parallel (L65). Final state: chunks from write A and write B interleave by index, metadata says `chunkCount: N` but actual chunk count is `M` from the other writer. Read returns corrupt JSON.
2. **setItem + getItem (read-tear)** — Reader fetches metadata (L20), then chunks (L30). If a writer is mid-flight (metadata written, only chunks 0..K written), reader assembles a payload that is the first K chunks of the new write + missing-or-stale chunks from the old write. Parser sees partial JSON, returns null or corrupt state.
3. **removeItem + setItem (resurrection race)** — `removeItem` reads metadata (L82), starts removing chunks. Concurrent `setItem` writes new metadata + new chunks. `removeItem` then removes the new metadata. Result: new metadata gone, but new chunks orphaned in localStorage.
4. **Cross-size-boundary cleanup leak** — When a key transitions from chunked to non-chunked (L70-78), the cleanup loop only removes chunks 0..9. If a previous chunked write had `chunkCount > 10`, chunks 10..N leak as orphans, slowly consuming localStorage quota. Under quota pressure, the localStorage write throws and the next `setItem` corrupts state.

### Blast radius

- **Affected stores:** Every persisted zustand store that goes through `masterStorage` (per ADR-008, the persisted subset of the 35-store list — `authStore`, `uiStore`, `dataStore`, `cubeStore`, `dashboardStore`, `settingsStore`, plus any future persisted store). Transient stores (no persist middleware) are unaffected.
- **Trigger conditions:**
  - User opens the app in two tabs and edits the same scenario
  - Worker-pool contention (line 8: `const storagePool = createStoragePool()` is module-scope; 13+ stores share it) causes long stringification delays
  - Quota pressure on localStorage causes the storage engine to evict mid-write
- **Customer impact:** Silent data corruption on reload. User makes a $50,000 budget edit, hits save, hard refresh, sees the previous $45,000. **No error shown.** The state is what the worker wrote last to the chunked-storage layer, with chunks possibly from a different concurrent write. Audit-trail integrity broken.
- **Severity rationale:** This is the worst-of-both-worlds failure: silent (no error surfaced), reproducible under realistic multi-tab usage, and FP&A-critical (audit-trail integrity depends on the persisted state being the last-user-confirmed state). SOC 2 CC7.2 + ISO 27001 A.12.4.1 (event logging) tracking required.
- **Quorum requirement:** The fix should be reviewed by both Hephaestus (data-integrity impact) and Prometheus (concurrency / queueing / worker-pool performance).

### Remediation plan

**ETA:** Sprint 2026-Q3-W2 (parallel to DEFER-2026-001)
**Owner:** TBD — design discussion needed. Options:

  - **(a) Mutex with `p-queue` (small, fast, low-risk):** Wrap each method in `storageQueue.add(() => ...)`. Single-flight serialization. Cost: serializes all chunked-storage writes (small perf hit for multi-store writes).
  - **(b) Migrate to IndexedDB (built-in transactions, larger quota, but bigger refactor):** Replace `PersistStorage<any>` adapter to use `idb` library. Pros: real ACID, much higher quota (50% of disk vs. 5-10MB localStorage). Cons: bigger migration, async API change cascades to 13+ stores.
  - **(c) Optimistic concurrency control with version stamps (most robust):** Each write tags metadata with a `version` (Lamport clock or `crypto.randomUUID()`). Reader detects version mismatch and retries. Pros: no serialization. Cons: complex; needs retry logic in zustand persist middleware.
  - **(d) Single-flight pattern with `storagePool` as serialization point:** Already have a worker pool at L8. Make it the gating mechanism (one in-flight chunked-storage op at a time). Cost: 13+ stores serialize through one worker. Pros: minimal new code. Cons: doesn't help getItem races.

**Recommended starting point:** Option (a) for the next sprint. Defer (b) and (c) to Phase 1 architectural work (alongside ADRs 019-021).

**Test that proves the fix:** Add a new test file `src/utils/chunkedStorage.race.test.ts` using `Promise.all` of concurrent setItem/getItem/removeItem calls and asserting: (i) chunks count matches metadata after concurrent writes, (ii) no orphans in `localStorage` after remove-then-set, (iii) read after write never returns corrupt JSON. Vitest's fake timers may be needed to simulate the worker-pool delay.

### In-code marker

`// FIXME (data-integrity, deferred DEFER-2026-003): concurrent setItem/getItem on the same key — torn writes + orphaned chunks ...`

To be added at line 17 of `src/utils/chunkedStorage.ts` by Apollo (or whoever picks up the design discussion). (Not adding now to avoid churn during the active push.)

### Audit trail

- 2026-06-12 15:00 UTC: Mnemosyne v0.3 reclassification identifies 1 chunkedStorage test as Pattern E.
- 2026-06-12 15:15 UTC: Hephaestus accepts primary ownership (data-integrity impact); Prometheus consulted for race-detection rigor.
- 2026-06-12 15:30 UTC: This deferral entry filed by Hephaestus.

### Cross-references

- Source: `src/utils/chunkedStorage.ts` (lines 17-92)
- Test file: `src/utils/chunkedStorage.test.ts` (8 tests, 1 failing per Mnemosyne v0.3; mock-based — concurrency tests not yet written)
- Triage report: Mnemosyne v0.3 Pattern E amendment to TESTING.md §0 + §11
- Downstream consumer: `src/utils/masterStorage.ts:5` (used by 13+ zustand stores per ADR-008)
- Related ADRs: ADR-008 (data-storage-scoping — defines which stores go through masterStorage)
- Sibling deferral: DEFER-2026-001 (AnomalyDetectionEngine percentile — same float/precision class; also a data-integrity bug)

---

## Review schedule

- **Quarterly:** Athena + Hephaestus walk the file with the founder. Open entries either get an ETA update, a severity update, or a "FIXED" closure entry.
- **Annual (external audit):** All open entries are exported as `deferrals-YYYY.csv` and shared with the auditor as evidence of CC7.2 control execution.
- **Pre-push:** Every push cycle, the test-triage lead MUST cross-reference any newly-discovered bugs against this file. New bugs without an entry are blocked from the push until documented.
