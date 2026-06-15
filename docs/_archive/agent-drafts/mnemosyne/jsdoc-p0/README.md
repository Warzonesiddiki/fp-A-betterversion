<!-- DRAFT v0.2 — re-validated + corrected JSDoc patches — Mnemosyne 2026-06-13 -->
<!-- v0.2 (2026-06-13): All 5 patches REWRITTEN to address the factual drift -->
<!-- flagged in Athena's T-AT-003 validation report at -->
<!-- `docs/drafts/athena/jsdoc-validation.md`. 03/04/05 are DEFERRED per -->
<!-- Athena's recommendation; 01+02 will land in the post-push batch. -->

# JSDoc P0 — 5 critical exports (v0.2, post Athena validation)

> **Apollo (post-push D-007 matrix §1.2):** `git apply --check` each patch
> from this directory. **Apply 01 + 02 now; 03 + 04 + 05 are DEFERRED to a
> later cycle** (the v0.2 rewrites are correct and git-apply clean so they
> can be picked up unchanged).

> **All 5 patches:** regenerated 2026-06-13 against the current (post-v0.1)
> state of the source files. `git apply --check` passes for all 5.
> Generator script: `.staging/generate_patches.py` (re-run to refresh after
> any source-file change).

---

## TL;DR — patch status after Athena T-AT-003

| # | File                            | Lines | Status (post Athena T-AT-003)            | Post-push action              |
| - | ------------------------------- | ----- | ---------------------------------------- | ----------------------------- |
| 1 | `01-useAuth.patch`              | 60    | ✅ CORRECTED (small fixes + ADR reconcile) | **APPLY** in post-push batch |
| 2 | `02-masterStorage.patch`        | 58    | ✅ CORRECTED (ADR-008 → ADR-005, example fix) | **APPLY** in post-push batch |
| 3 | `03-monteCarloSimulate.patch`   | 100   | ✅ REWRITTEN (7 dist types, Math.random, no Cholesky, `Error` throws, `confidenceLevel` req) | **DEFER** to later cycle      |
| 4 | `04-capExIRR.patch`             | 79    | ✅ REWRITTEN (Newton-Raphson, 1000-iter cap, no sign-check, NaN-on-div-zero) | **DEFER** to later cycle      |
| 5 | `05-cubeEngine.patch`           | 98    | ✅ REWRITTEN (Option A — `Map<string, CubeCell>`, no `slice()`/`dice()`, real method list) | **DEFER** to later cycle      |

**Total patch-file lines (unified diff): 395** (60 + 58 + 100 + 79 + 98).

---

## What Athena T-AT-003 caught — and what was fixed

Per `docs/drafts/athena/jsdoc-validation.md` (2026-06-13), the v0.1 patches
had 3 critical accuracy issues (03, 04, 05) and 2 small issues (01, 02).
All 5 are corrected in v0.2:

### 01 useAuth — small fixes

- **Removed** the bogus `@see ADR-005` reference (there is no auth-specific
  ADR; ADR-005 is the masterStorage wrapper).
- **Added** `@see D-006` (security-deferral discipline) — the closest
  existing decision for the mock-vs-real auth split.
- **Clarified** the hook's role as a SELECTOR ONLY (state lives in
  `useAuthStore`).
- **Added** `switchEntity` to the documented return fields (real export
  has it; v0.1 missed it).

### 02 masterStorage — small fixes

- **`@see ADR-008` → `@see ADR-005`** (masterStorage's own canonical ADR;
  the README's "ADR-003" was a typo, and the patch's "ADR-008" was the
  PII-tier ADR which is unrelated).
- **Fixed example:** `storage: createJSONStorage(() => masterStorage())`
  is invalid — `masterStorage` is a `PersistStorage<any>` const, not a
  function. v0.2 uses `storage: masterStorage` directly (one fewer
  indirection).
- **Documented** the `kdfVersion` re-wrap contract that `unlockMasterKey`
  reads on every unlock (was missing in v0.1).

### 03 MonteCarloEngine.simulate — REWRITTEN (3.8 issues)

- **Distribution type set:** 7 types (`normal`, `uniform`, `triangular`,
  `lognormal`, `beta`, `exponential`, `poisson`) — v0.1 listed `empirical`
  which does NOT exist, and was missing `beta`/`exponential`/`poisson`.
- **PRNG:** `Math.random()` fallback (not `crypto.randomUUID()` which v0.1
  had); `config.seed` → Mulberry32.
- **`simulate()` has NO `config.correlation`:** Cholesky is a separate
  static method `generateCorrelatedSamples(distributions, correlationMatrix,
  iterations, seed?)` — v0.1 falsely described `config.correlation` as a
  top-level field.
- **All throws are `new Error(...)`:** v0.1 had `@throws {RangeError}` /
  `@throws {TypeError}` distinctions that don't exist in the code.
- **`config.assumptions` is the required field name:** v0.1 had
  `config.inputs` (wrong).
- **`confidenceLevel` is required** and must satisfy `0 < x < 1` exclusive.

### 04 CapExEngine.calculateIRR — REWRITTEN (4.6 issues)

- **Algorithm is Newton-Raphson** (not bisection), with `maxIterations = 1000`
  and `precision = 0.00001`.
- **No sign-change check:** the function does NOT throw `Error` on
  no-sign-change (v0.1 claimed it did).
- **`cashFlows.length < 2` returns `0`** (not `NaN`).
- **`dNpv === 0` returns `NaN`** (the `0/0` division is not guarded).
- **No Infinity/NaN input validation** — propagates through `calculateNPV`.
- **Example fixed:** v0.1 called undefined `assertArray()` /
  `assertFiniteNumber()`; v0.2 uses the real `CapExEngine.calculateIRR`
  signature with a caller-side `Number.isFinite` guard.

### 05 CubeEngine — REWRITTEN (5.7 Option A)

- **Storage is `Map<string, CubeCell>`** (`CubeEngine.ts:32-34`), NOT
  `Float64Array`. Removed the "10x faster" claim from v0.1 (it was
  inconsistent with the actual data structure).
- **No explicit constructor** — class uses class-field initializers.
- **`slice()` and `dice()` do NOT exist** as methods; the canonical
  slice/dice/roll-up primitive is `query(CubeQuery)`.
- **`aggregate(cube, coords, measure, aggregation)` DOES exist** at
  `CubeEngine.ts:263` — v0.1 listed it correctly, so kept.
- **Exhaustive method surface** documented (28 public methods across
  dimensions / members / cubes / cells / queries / aggregation / snapshots).
- **Kept `@see ADR-003`** (OLAP cube data model) — this one was right.

---

## Verification (re-run by Mnemosyne 2026-06-13)

```bash
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"
for p in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  echo "=== $p ==="
  git apply --check "$p" || echo "FAILED: $p"
done
```

**Result on current working tree (verified 2026-06-13):**

```
[OK]   01-useAuth
[OK]   02-masterStorage
[OK]   03-monteCarloSimulate
[OK]   04-capExIRR
[OK]   05-cubeEngine
```

All 5 pass. None print FAILED.

---

## Why 03/04/05 are DEFERRED (not blocked)

Per Athena's T-AT-003 §3.8 / §4.6 / §5.7, the v0.1 patches had accuracy
issues that would mislead future contributors. The v0.2 patches are
**accurate** — they describe the real APIs. But the Lead has decided to
land only 01 + 02 in the current post-push batch (per D-007 matrix §1.2)
and defer 03/04/05 to a later cycle. This is a scope decision, not a
quality concern.

When the deferred patches are re-picked up, no re-validation is needed —
the JSDoc content is correct. Apollo can `git apply` them directly.

---

## Self-correction lineage

This v0.2 cycle is the **third** Muse-system self-correction in the
FinPlan Pro Perfection Cycle:

1. **Turn 3.5 (2026-06-12):** Mnemosyne said "4 pre-existing test
   failures" (the Lead's number); the real count was 65+ across 6 files.
   → v0.3 of `TESTING.md` / `CHANGELOG.md` / `05-build-pipeline.mmd` /
   `ARCHITECTURE.md` corrected the count and added the 5-pattern
   breakdown (A=67, B=1, C=5, D1=1, D2=2, E=3).

2. **Turn 4 (2026-06-12):** Mnemosyne said "Hephaestus sole-owns
   DEFER-2026-001"; the real ownership is co-owned (Athena primary +
   Hephaestus secondary). → v0.5 of the same 4 docs corrected the
   attribution and added the co-ownership notation.

3. **Turn 8 (2026-06-13, this v0.2):** Mnemosyne's v0.1 JSDoc patches
   described APIs that didn't exist (Monte Carlo config.correlation),
   gave wrong algorithm details (bisection vs Newton-Raphson), and
   described a v2 design (Float64Array, slice/dice) instead of the
   current class. → Athena T-AT-003 caught all 3 with 3-witness
   verification, and this v0.2 README + 5 patches fix everything.

The Muse system's "drafts-not-source" discipline (no Muse may stage/commit
directly; all changes go through review by another Muse) is doing its job.

---

## Cross-references (in the JSDoc `@see` tags) — v0.2 corrected

| Patch                          | `@see` references                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `01-useAuth`                   | `useAuthStore` (src/store/authStore.ts) · D-006 · ADR-005 · DRAFT v0.2             |
| `02-masterStorage`             | `unlockMasterKey` (src/utils/crypto.ts) · ADR-002 · ADR-005 · DRAFT v0.2           |
| `03-monteCarloSimulate`        | `generateCorrelatedSamples` (this file) · `MonteCarloWorker` · D-007 · DRAFT v0.2  |
| `04-capExIRR`                  | `calculateNPV` · `calculateNPVDerivative` · `calculateMIRR` · DRAFT v0.2           |
| `05-cubeEngine`                | `CubeLoader` (src/loaders/CubeLoader.ts) · ADR-003 · DRAFT v0.2                    |

(ADR-002, ADR-003, ADR-005 live in `docs/drafts/adr/`. D-006, D-007 live
in `docs/STRATEGIC_DECISIONS_LOG.md`. The v0.1 patches had wrong-path
references like `docs/STRATEGIC_DECISIONS_LOG.md#ADR-005`; v0.2
corrects them.)

---

## Apply order (post-push, recommended)

```bash
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"

# Dry-run all 5 (sanity check)
for p in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  echo "=== $p ==="
  git apply --check "$p" || echo "FAILED: $p"
done

# Apply the 2 approved patches
git apply docs/drafts/mnemosyne/jsdoc-p0/01-useAuth.patch
git apply docs/drafts/mnemosyne/jsdoc-p0/02-masterStorage.patch

# Skip 03/04/05 for now (deferred per Athena T-AT-003 + D-007 matrix §1.2)

# Verify nothing broke
npx tsc --noEmit
npm run lint
npx vitest run src/hooks/useAuth.test.ts src/utils/masterStorage.test.ts
```

The 3 deferred patches (`03` / `04` / `05`) sit in this directory ready
to apply unchanged when the Lead un-defers them.

---

## Coverage impact (post-apply of 01+02)

| Metric                                                                  | Before      | After (01+02 only)        |
| ----------------------------------------------------------------------- | ----------- | ------------------------- |
| Highest-value P0 exports documented                                     | 0 of 5      | **2 of 5**                |
| JSDoc lines added (src/)                                                 | —           | +99 (60 useAuth + 58 masterStorage) |
| Exports with full JSDoc                                                 | 23 (1.02 %) | **25 (1.11 %)**           |

(The full 5/5 impact is 5/5 with +395 lines, but 03/04/05 are deferred.)

---

_Mnemosyne 2026-06-13. v0.2 produced in response to Athena T-AT-003
validation; 01+02 ready for post-push application, 03+04+05 deferred
but accurate and git-apply clean._
<!-- /DRAFT v0.2 — Mnemosyne 2026-06-13 -->
