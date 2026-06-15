# T-PR-040: Codif 35 v0.4 — G17-MEASURED-BENCHMARKS Sub-Class v0.1

**Author:** Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
**Date:** 2026-06-15
**Status:** v0.1 — DRAFT for Codif 35 v0.4 review
**Trigger:** Leader dispatch 2026-06-15 (D-007 5-min SLA, ETA 20 min)
**Cross-check carrier for:** CHRONOS P0 TEMPORAL_ENGINE_CORRECTNESS (T-PR-039 honest-gap finding)

---

## 1. Rule Identity

| Field | Value |
|---|---|
| **Rule ID** | `Codif35.v0.4.G17.MEASURED-BENCHMARKS` |
| **Sub-class** | Operational (perf-discipline carrier) |
| **Parent class** | G17 (Performance Benchmarks) |
| **Author** | Prometheus |
| **Cross-references** | CATCH #188 (G2 re-check stale snapshot), CATCH #189 (file-existence pre-dispatch) |
| **Status** | v0.1 DRAFT → pending Leader ratification |

---

## 2. Statement (the rule)

> **G17 perf benchmarks MUST be MEASURED, not estimated.**
>
> Each G17 target (100K rows @ 30fps, 10K Monte Carlo <30s, 500-row PDF <3s) must be run via:
> - `performance.now()` for sub-millisecond JS work
> - `console.time` / `console.timeEnd` for cross-platform logging
> - React Profiler API for component-mount/render time
> - Worker `postMessage` round-trip timing for off-thread compute
>
> **Reported values must be reproducible by `npx vitest run tests/perf/` or `node scripts/perf/run-all.mjs`.**
>
> **Hard prohibition:** Writing benchmark numbers in a doc, commit message, or status report WITHOUT a runnable script that produces them. Reading the number from a hypothetical or "expected" value is a Codif violation.

---

## 3. Rationale (D-007/D-009 — why this rule exists)

### Triggering incident
T-PR-039 (Apollo-Temporal-Correctness cross-check) found that **all 30 existing engine tests pass, but NONE have explicit tests for the 5 standard temporal edge cases (leap year, year boundary, DST, timezone, fiscal year alignment)**. The engines may still be correct — but no measurement proves it.

This is a **meta-pattern**: the same failure mode (asserting correctness without measurement) applies to perf benchmarks as well. A doc claiming "100K rows @ 30fps" without a runnable script that demonstrates this is just as much a Codif violation as an engine test that doesn't test leap year.

### Cross-Muse precedent
- **CATCH #188** (Prometheus, 2026-06-15): G2 re-check tool reported a "fix needed" that didn't exist — same root cause (state assumed, not verified)
- **CATCH #189** (Atlas, 2026-06-15): bundle-check.js scaffold dispatched when file pre-existed — same root cause
- **This rule** extends the same discipline to perf benchmarks: numbers in docs MUST be runnable, not estimated

### Why "measured" beats "estimated"
1. **Reproducibility** — anyone (CI, peer Muse, future-you) can re-run and verify
2. **Drift detection** — if the env changes (Node version, hardware), re-running surfaces the delta
3. **No false confidence** — a 500-row PDF that took 3.5s but was reported as "<3s PASS" is a Codif violation
4. **Codif 35 v0.4 alignment** — Codif 35 is the v0.4 doctrine for "do not assert what you haven't measured"

---

## 4. Implementation (concrete)

### 4.1 The G17 suite location (existing, per Prometheus G17 P0)

```
scripts/perf/
├── grid-bench.mjs           # 100K rows @ 30fps target
├── monte-carlo-bench.mjs    # 10K iters <30s target
├── pdf-bench.mjs            # 500-row PDF <3s target
├── run-all.mjs              # orchestrator: exits 0 iff all 3 pass
├── emit-baseline.cjs        # emits .openhands/baseline-p1-g10-g17.log
└── README.md                # targets + methodology + 4-ICP
```

### 4.2 The mandatory measurement primitives (D-002/D-009)

**For sub-millisecond JS work:**
```javascript
const t0 = performance.now();
const result = doExpensiveThing();
const t1 = performance.now();
console.log(`doExpensiveThing: ${(t1 - t0).toFixed(3)}ms`);
```

**For cross-platform human-readable logs:**
```javascript
console.time('monteCarlo_10k');
const result = monteCarloSim(10_000);
console.timeEnd('monteCarlo_10k'); // logs "monteCarlo_10k: 47.123ms"
```

**For React component render time:**
```jsx
import { Profiler } from 'react';

<Profiler id="GridPanel" onRender={(id, phase, actualDuration) => {
  console.log(`[${id}] ${phase}: ${actualDuration.toFixed(2)}ms`);
}}>
  <GridPanel rows={rows} />
</Profiler>
```

**For Worker postMessage round-trip:**
```javascript
// main thread
const t0 = performance.now();
worker.postMessage({ type: 'compute', payload });
worker.once('message', (result) => {
  const t1 = performance.now();
  console.log(`Worker round-trip: ${(t1 - t0).toFixed(3)}ms`);
});
```

### 4.3 The mandatory pass/fail gating

Each benchmark script MUST exit with code 0 (pass) or 1 (fail), NOT just log. This makes them CI-runnable:

```javascript
// tail of grid-bench.mjs (paraphrased from existing)
const fps = computeFps(frames, totalMs);
if (fps < 30) {
  console.error(`❌ G17 grid-bench FAIL: ${fps.toFixed(1)} fps < 30 target`);
  process.exit(1);
} else {
  console.log(`✅ G17 grid-bench PASS: ${fps.toFixed(1)} fps ≥ 30 target`);
  process.exit(0);
}
```

### 4.4 The reproducibility invariant (D-009)

All three G17 benchmarks MUST use a seeded PRNG (`mulberry32(seed=42|7)`) so the run is deterministic. The same seed on the same Node version on the same hardware must produce the same numbers within ±5% jitter.

```javascript
// mulberry32 — fast, deterministic, 32-bit
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

---

## 5. Verification (D-002 — 3 witnesses)

**A peer Muse verifying G17 compliance runs:**
```bash
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"
node scripts/perf/run-all.mjs
```

**Expected output (from existing baseline, 2026-06-15):**
```
[G17] grid-bench: 4153 fps (PASS, target ≥30)
[G17] monte-carlo-bench: 57ms (PASS, target <30000)
[G17] pdf-bench: 416ms (PASS, target <3000)
✅ All 3 G17 benchmarks PASS — process.exit(0)
```

**3-witness verification:**
1. **`process.exit(0)` from `run-all.mjs`** — primary signal
2. **`.openhands/baseline-p1-g10-g17.log` (713 lines)** — persisted log artifact
3. **`git log --oneline 15149483`** — the commit that landed the G17 suite on origin/main

If ANY of these three is missing, the G17 claim is unverified and the rule is violated.

---

## 6. Anti-patterns (D-007 — explicit Codif violations)

| Anti-pattern | Why it's a violation | What to do instead |
|---|---|---|
| ❌ "100K rows @ 30fps" in a doc without a runnable script | State assumed, not measured (per CATCH #188) | Run `node scripts/perf/grid-bench.mjs`, paste the output |
| ❌ "Monte Carlo <30s" estimated from intuition | Human bias, no reproducibility | Run `node scripts/perf/monte-carlo-bench.mjs` |
| ❌ "PDF <3s" based on a single test machine, not committed | Hardware drift, no CI verification | Commit the script + baseline log; CI runs it |
| ❌ Reporting a benchmark number that the script doesn't actually produce | "Phantom measurement" — Codif violation | Match the script output to the doc verbatim |
| ❌ Adding a `setTimeout(..., 0)` or similar fudge to make a benchmark pass | Manufactured pass — worse than honest fail | Report the real number, even if it fails the target |
| ❌ Skipping the seeded PRNG ("just use Math.random") | Non-reproducible run | Use `mulberry32(seed=42\|7)` |
| ❌ Reporting only the best of N runs | Cherry-picking — measure all N, report median + p95 | Report `{ median, p95, min, max, n }` |

---

## 7. Sub-class rationale (D-009)

**Why "Operational" and not "Codif" sub-class:**

- "Codif" sub-classes are about doctrine (e.g., NEVER-AGAIN RULE: G2-DIAGNOSTIC-COMMIT-AWARENESS defines what NOT to do at the tool level)
- "Operational" sub-classes are about daily discipline (e.g., CASCADE-VELOCITY-CHECK defines pre-flight behavior)
- This rule sits at the operational level: every G17 claim is verified by a 30-second script run before being stated

**Cross-class linkage:**
- Operational (this rule) → Codif (NEVER-AGAIN RULE family) when an anti-pattern is repeated
- e.g., if a Muse writes "100K rows @ 30fps" 3 times without a script, that becomes CATCH #190 (perf-claim-without-script) and a NEVER-AGAIN RULE: PERF-CLAIM-MEASUREMENT-REQUIRED

---

## 8. 4-ICP Verdict (D-011)

- **I1 (Intent):** ✅ Codif 35 v0.4 sub-class formalization complete; rule text + rationale + implementation + verification + anti-patterns all present
- **C2 (Catastrophic):** ✅ No false perf claims can survive the verification gate (3-witness: exit code + baseline log + commit hash)
- **P3 (Performance):** ✅ The rule itself costs ~5 minutes per benchmark claim (run the script + paste output); 5x cheaper than debugging a phantom claim
- **D4 (Documented):** ✅ 3-witness verification chain + cross-link to CATCH #188/189 family + 7 anti-patterns enumerated

---

## 9. Commit Plan

**File:** `docs/drafts/prometheus/T-PR-040_codif_35_v0_4_g17_measured_benchmarks_v0.1.md`

**Commit message (per Leader spec):**
```
docs(codif): Prometheus T-PR-040 G17-MEASURED-BENCHMARKS rule (cross-check carrier)
```

**Push:** Yes (`git push origin main`)

**Force-add required:** Yes (`docs/drafts/` is gitignored per /docs/drafts/*/ rule from CASCADE 019ecc19)

---

## 10. Status

- [x] v0.1 DRAFT written
- [ ] Committed (`docs/drafts/prometheus/T-PR-040_...`)
- [ ] Pushed to origin/main
- [ ] Leader ratification (Codif 35 v0.4 acceptance)
- [ ] Cross-link to CATCH #188/189 family
- [ ] Add to Codif 35 v0.4 master index

**4-ICP: ✅ ALL FOUR DIMENSIONS PASS**
**Awaiting Leader ratification for Codif 35 v0.4 inclusion.**
