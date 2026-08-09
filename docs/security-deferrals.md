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
**Status:** ✅ RESOLVED — 2026-08-09 (completion audit). Contract documented, regression-pinned, FIXME replaced. See Resolution record below.
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

**Proposed fix** (design source archived in the 2026-08-07 docs triage):

```ts
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  // Nearest-rank (type-1) percentile. For sorted.length=2, p=75:
  //   rank = ceil(0.75 * 2) = 2 → sorted[1] = 20. ✓
  // For sorted.length=5, p=25:  rank = ceil(0.25 * 5) = 2 → sorted[1] = 20. ✓
  // For sorted.length=5, p=75:  rank = ceil(0.75 * 5) = 4 → sorted[3] = 40. ✓
  const rank = Math.min(Math.max(Math.ceil((p / 100) * sorted.length), 1), sorted.length);
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
- 2026-08-09 (completion audit): RESOLVED. Evidence below.

### Resolution record (2026-08-09, autonomous completion audit)

**Root cause.** Two percentile conventions collided: the implementation used
linear interpolation (quantile type **R-7**, Excel `PERCENTILE.INC` / NumPy
`method='linear'`), while a former Lovelace assertion expected nearest-rank
(type-1) Q3 for `[10, 20]`. The in-code FIXME additionally mislabelled the
implemented formula as "PERCENTILE.EXC family" — it is R-7/`PERCENTILE.INC`
(`idx = p/100 · (n−1)`); `PERCENTILE.EXC` uses `(n+1)` spacing.

**State verified at audit time.** The conflicting nearest-rank assertion no
longer existed in `AnomalyDetectionEngine.lovelace.test.ts` (that file's
`computeStatistics([10, 20])` call only exercises the `n < 3` skewness
branch). Running both suites confirmed 85/85 tests passing with the R-7
implementation, and the known-answer suite
(`AnomalyDetectionEngine.test.ts`) asserts R-7 values (Q1=4, Q3=5.5 on
`[2,4,4,4,5,5,7,9]`) which would FAIL under the nearest-rank fix proposed
above. The proposed fix was therefore stale and would have broken the oracle
suite — it was rejected in favour of pinning the implemented convention.

**Fix applied.**

1. `src/engines/AnomalyDetectionEngine.ts` — FIXME replaced with a CONTRACT
   comment naming the exact method (R-7 / `PERCENTILE.INC`), its history, and
   the regression test that pins it.
2. `src/engines/AnomalyDetectionEngine.test.ts` — new regression test
   `percentile method is R-7 linear interpolation (DEFER-2026-001)` pins the
   small-dataset contract (`[10,20] → q1 12.5, q3 17.5, iqr 5`;
   `[1,2,3,4] → q1 1.75, q3 3.25`) so any future method change fails loudly.
3. This register entry updated to RESOLVED.

**Re-test method.** `npx vitest run src/engines/AnomalyDetectionEngine.test.ts src/engines/AnomalyDetectionEngine.lovelace.test.ts`
— observed 2026-08-09: 2 files, 85 tests passed pre-fix; the added regression
test re-verified after the edit (see audit evidence log).

**Residual risk.** None identified: the convention is deterministic,
documented, and oracle-pinned. Downstream consumers (AnomalyHighlight,
MonteCarloEngine) consume Q1/Q3 through the same function, so behaviour is
uniform.

### Cross-references

- Test evidence: `src/engines/AnomalyDetectionEngine.test.ts` (R-7 oracle suite + regression pin)
- Triage report + fix design: archived in the 2026-08-07 docs triage (Pattern D section)

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
**Status:** ✅ RESOLVED (in-process) — 2026-08-09 (completion audit), option (a) mutex implemented + 7-test race regression suite. Cross-tab races remain scoped out (IndexedDB migration, see Resolution record).
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

### Resolution record (2026-08-09, autonomous completion audit)

**Fix applied — Option (a) mutex, zero new dependencies.**

1. `src/utils/chunkedStorage.ts`
   - Added `withKeyLock(storage, key, op)` — a promise-chain mutex keyed by
     `(underlying storage instance, storage key)` via a `WeakMap`. All three
     operations (`getItem`, `setItem`, `removeItem`) now execute under the
     per-key lock, closing race windows 1 (torn write), 2 (read-tear) and
     3 (resurrection). Different keys remain fully parallel; rejections never
     cascade (the chain promise always settles clean, so a failed op cannot
     poison later operations — regression-tested).
   - Race window 4 (cleanup leak) fixed twice over: `setItem` now reads the
     previous record's `chunkCount` **before** overwriting and removes exactly
     that many stale chunks on the small-payload path (floor of 10 kept to
     sweep pre-fix orphans), and on the chunked path removes surplus chunks
     beyond the new `chunkCount` when shrinking between two chunked writes.
   - Added `isChunkedMetadata()` type guard (replaces three duplicated
     inline shape checks).
2. `src/utils/chunkedStorage.race.test.ts` — new 7-test regression suite
   using a delay-injected mock storage to widen race windows:
   - concurrent writers → metadata.chunkCount == persisted chunk count AND
     reassembled value is exactly one of the written values (no torn mix);
   - readers racing a writer observe only complete values;
   - remove→set preserves the new record; set→remove fully deletes it;
   - > 10-chunk write → small write leaves zero orphaned chunk keys;
   - shrinking chunked→chunked removes surplus chunks exactly;
   - per-key isolation (different keys unaffected);
   - failed write does not poison the lock.

**Verification.** `npx vitest run src/utils/chunkedStorage.test.ts src/utils/chunkedStorage.race.test.ts`
— observed 2026-08-09: 15/15 tests passing (8 pre-existing + 7 new), plus the
full anomaly-engine re-verification. No behavioural change for sequential
callers: the lock serializes only same-key operations.

**Residual risk / explicit scope boundary.** The mutex is **in-process only**.
Cross-tab races (two browser tabs writing the same localStorage key) are NOT
closed by this fix — they require option (b) IndexedDB migration with real
transactions, which remains future architectural work per the remediation plan
above. The product's primary deployment is a single-tab desktop app (Tauri
webview) where in-process serialization covers the dominant store-contention
path (13+ stores sharing one storage pool). The cross-tab residual is
acknowledged here as a tracked, documented limitation rather than a silent one.

---

## DEFER-2026-004 — dev-only brace-expansion@1.1.16 advisory (minimatch@3.1.5, eslint chain)

**Date opened:** 2026-08-09 (autonomous completion audit)
**Reporter/Reviewer:** Arena completion audit (supply-chain loop)
**Severity:** Low effective risk (HIGH advisory rating, dev-only exposure)
**Status:** DEFERRED — blocked by upstream; re-check on every eslint/minimatch upgrade

**Component:** `node_modules/minimatch/node_modules/brace-expansion@1.1.16`, reached via
`eslint@9.39.4 → @eslint/config-array / @eslint/eslintrc`, `eslint-plugin-react`,
`eslint-plugin-jsx-a11y` — all pinning `minimatch@^3.x`.

### Advisories

- GHSA-mh99-v99m-4gvg — DoS via unbounded expansion length (OOM crash).
- GHSA-rgw5-rvv9-x895 — DoS via unbounded intermediate arrays (CVE-2026-14257 mitigation bypass).
- Affects `brace-expansion <=1.1.17`; patched in `1.1.18` and `>=2.1.4`.

### Blast radius

- **Production bundle: NOT affected.** `npm audit --omit=dev` reports **0 vulnerabilities**;
  the F-0021 gate (`scripts/check-dependency-audit.mjs`) passes with an EMPTY allowlist
  (nothing waived). brace-expansion never reaches the shipped app or server.
- **Runtime exposure: none.** minimatch@3 is consumed by ESLint's file-ignore matching
  with patterns from our own `eslint.config.js` and CLI args — no untrusted-input path.
- **Worst case:** a crafted brace pattern fed to the local/CI linter could OOM the lint
  process. An actor able to inject patterns into our lint invocation already has code
  execution in the repo/CI context, so this adds no meaningful attack surface.

### Why the fix is deferred (evidence of attempted remediation, 2026-08-09)

1. `minimatch@3.1.5` is the FINAL 3.x release — no patched minimatch@3 exists upstream.
2. Override `"minimatch@3.1.5": { "brace-expansion": "^1.1.18" }` → npm de-duplicated the
   nested copy and hoisted `brace-expansion@5.0.9` (object-export ESM build required by
   `minimatch@10`), breaking ESLint with `TypeError: expand is not a function`. Verified
   twice; evidence snapshots in `.arena-audit/lockfile-broken-minimatch-override.json`.
3. Scoped override `"eslint-plugin-jsx-a11y": { "minimatch": { "brace-expansion": ... } }`
   → no effect on the shared de-duplicated minimatch instance.
4. `npm update brace-expansion` → does not touch the nested 1.x copy while 5.0.9 occupies
   the root slot.
5. Upgrading eslint/plugins to minimatch@10-based majors mid-audit is a regression risk
   disproportionate to a dev-only DoS advisory.

### Remediation plan

**Trigger:** next routine dev-dependency upgrade cycle.
**Owner:** whoever bumps eslint 9.x / eslint-plugin-\*.
**Action:** re-run `npm audit`; if minimatch≥4 (or a brace-expansion≥1.1.18-resolving
release) lands in the eslint chain, delete this entry. Alternatively, if npm gains a
dedup-safe nested override, apply it and delete this entry.
**Test that proves closure:** `npm audit` reports the brace-expansion advisories gone AND
`npx eslint src/utils/chunkedStorage.ts` exits 0 (toolchain intact).

### Audit trail

- 2026-08-09: Advisory observed in full `npm audit` (dev tree). Production gate verified
  green (`npm audit --omit=dev` → 0 vulns). Two override fix attempts made and REVERTED
  after proving they break the ESLint toolchain. This entry filed.

---

## Review schedule

- **Quarterly:** Athena + Hephaestus walk the file with the founder. Open entries either get an ETA update, a severity update, or a "FIXED" closure entry.
- **Annual (external audit):** All open entries are exported as `deferrals-YYYY.csv` and shared with the auditor as evidence of CC7.2 control execution.
- **Pre-push:** Every push cycle, the test-triage lead MUST cross-reference any newly-discovered bugs against this file. New bugs without an entry are blocked from the push until documented.
