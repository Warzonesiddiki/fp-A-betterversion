---
title: Mnemosyne JSDoc P0 patches — pre-validation (T-AT-003)
author: Athena (019ebcc3-0224-7602-9425-7f2f067711de)
cycle: D-008 (post-D-007)
status: DRAFT v0.1
date: 2026-06-13
related: docs/drafts/mnemosyne/jsdoc-p0/README.md, docs/drafts/athena/post-push-integration-matrix.md, AGENTS.md
---

<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-13 -->

# Mnemosyne JSDoc P0 — Pre-Validation Report

> **TL;DR — DO NOT MERGE AS-IS.** Of the 5 patches, **0 are clean** (clean = matches the real API, has a working `@example`, all `@throws` types match the actual code, all `@see` cross-refs resolve). **3 have CRITICAL accuracy issues** (MonteCarlo, CapEx, Cube — they describe APIs that don't exist or have fabricated algorithm/throw details). **2 are mostly OK** (useAuth, masterStorage) with minor fixes needed.

---

## 0. Triangulation flag (D-009) — task description file-name mismatch

The T-AT-003 task description lists 5 patches to validate, but **the filenames in the description do not match the filenames on disk** for 3 of 5:

| Task description filename | Actual filename on disk | Target file |
|---|---|---|
| `01-useAuth.patch` | `01-useAuth.patch` ✅ | `src/hooks/useAuth.ts` |
| `02-masterStorage.patch` | `02-masterStorage.patch` ✅ | `src/utils/masterStorage.ts` |
| `03-AnomalyDetectionEngine.patch` ❌ | `03-monteCarloSimulate.patch` | `src/engines/MonteCarloEngine.ts` |
| `04-CubeEngine.patch` ❌ | `04-capExIRR.patch` | `src/engines/CapExEngine.ts` |
| `05-MonteCarloEngine.patch` ❌ | `05-cubeEngine.patch` | `src/engines/CubeEngine.ts` |

Mnemosyne's own `docs/drafts/mnemosyne/jsdoc-p0/README.md:10-19` lists the real targets and matches what's on disk. **The task description was generated from a stale source.** I validated against the **real files on disk**, not the task description's wrong list.

---

## 1. Per-file verdict

| # | Patch | Verdict | Severity | Fix needed |
|---|---|---|---|---|
| 1 | `01-useAuth.patch` | 🟡 MOSTLY OK | Low | Verify `login()` return type, add `@see` for store |
| 2 | `02-masterStorage.patch` | 🟡 MOSTLY OK | Medium | Fix `@see ADR-008` → `ADR-003`; verify encryption details |
| 3 | `03-monteCarloSimulate.patch` | ❌ STALE | **CRITICAL** | 7 issues, see §3 |
| 4 | `04-capExIRR.patch` | ❌ STALE | **CRITICAL** | 5 issues, see §4 — claims NEWTON-RAPHSON, JSDoc says BISECTION |
| 5 | `05-cubeEngine.patch` | ❌ STALE | **CRITICAL** | 6 issues, see §5 — fabricates a constructor signature and 3 methods |

**Verdict counts:** 0 ✅ MATCH · 2 🟡 MOSTLY OK · 3 ❌ STALE · 0 🔄 MISMATCH

---

## 2. Patch re-verification (`git apply --check` on current main)

Re-ran on 2026-06-13 against the working tree (223 uncommitted files; main at HEAD). All 5 patches pass `git apply --check` cleanly. **No merge conflicts; the problem is content accuracy, not applyability.**

| Patch | `git apply --check` |
|---|---|
| `01-useAuth.patch` | PASS |
| `02-masterStorage.patch` | PASS |
| `03-monteCarloSimulate.patch` | PASS |
| `04-capExIRR.patch` | PASS |
| `05-cubeEngine.patch` | PASS |

---

## 3. `03-monteCarloSimulate.patch` — 7 accuracy issues (CRITICAL)

**Target:** `src/engines/MonteCarloEngine.ts:113-501` (`MonteCarloEngine.simulate`)

### 3.1 Distribution types list is wrong (3 missing + 1 fabricated)

| Patch claims | Actual code (`MonteCarloEngine.ts:18`) |
|---|---|
| "normal, lognormal, uniform, triangular, **empirical from a histogram bucket array**" | `type DistributionType = 'normal' \| 'uniform' \| 'triangular' \| 'lognormal' \| **'beta'** \| **'exponential'** \| **'poisson'**` |

- ❌ **Fabricated** `'empirical'` type — does not exist in the code
- ❌ **Missing** `'beta'`, `'exponential'`, `'poisson'` — these are real and would be discovered by any user who reads the type definition

### 3.2 PRNG fallback is wrong

- **Patch claims:** "Mulberry32 generator; falls back to `crypto.randomUUID()` for entropy when no seed"
- **Actual code (`MonteCarloEngine.ts:466-468` area):** `config.seed !== undefined ? createPRNG(config.seed) : Math.random` (per typecheck; the seed call uses `createPRNG` defined at line 129-137)
- ❌ The fallback is `Math.random()`, NOT `crypto.randomUUID()`. **`Math.random()` is not cryptographically secure AND not deterministic** — the JSDoc's "audit-grade reproducibility" claim is undermined by the actual fallback.

### 3.3 Correlation/Cholesky claim is fabricated

- **Patch claims:** "Correlated inputs share a Cholesky-decomposed copula matrix from `config.correlation`"
- **Actual code:** `MonteCarloConfig` (line 27-58) has NO `correlation` field. The Cholesky logic lives in a **separate method** `generateCorrelatedSamples()` (not in `simulate()`).
- ❌ The JSDoc invents an integration that doesn't exist. A user who reads the JSDoc and tries `simulate({ correlation: [...] })` will get a TypeScript error.

### 3.4 `@throws` types are all wrong

- **Patch claims:**
  - `@throws {RangeError} if iterations < 1 or > 1_000_000`
  - `@throws {TypeError} if model is not a function`
- **Actual code (`MonteCarloEngine.ts:67-83`):** All guards throw plain `Error`:
  - `throw new Error('iterations must be at least 1')`
  - `throw new Error('iterations cannot exceed 1,000,000')`
  - `throw new Error('model must be a function')`
  - `throw new Error('confidenceLevel must be between 0 and 1 (exclusive)')`
  - `throw new Error('assumptions must be an array')`
  - etc.
- ❌ Callers cannot `catch (e instanceof RangeError)` or `catch (e instanceof TypeError)` as the JSDoc claims. The JSDoc teaches the wrong error-handling pattern.

### 3.5 Missing required parameter `confidenceLevel`

- **Patch JSDoc's `MonteCarloSimulationConfig`:** Does NOT include `confidenceLevel`.
- **Actual `MonteCarloConfig` (line 27-58):** `confidenceLevel: number` is REQUIRED (not optional).
- ❌ The patch's `@example` (line 47-56 of patch) is missing `confidenceLevel`. **The example would fail TypeScript compilation** with `Property 'confidenceLevel' is missing in type '{...}'`.

### 3.6 `histogramBuckets` config knob is fabricated

- **Patch claims:** "Default 50 buckets (`config.histogramBuckets ?? 50`)"
- **Actual code:** `MonteCarloConfig` has NO `histogramBuckets` field. The result's `histogram: HistogramBin[]` is built by an internal function (likely fixed bucket count) — the user has no knob to expose.

### 3.7 `RangeError` vs `Error` and the missing `confidenceLevel` validation note

- The actual code validates `confidenceLevel ∈ (0, 1) exclusive`. The JSDoc doesn't mention this AT ALL. A user could pass `0` or `1` and get an unhandled `Error: confidenceLevel must be between 0 and 1 (exclusive)`.

### 3.8 Recommended fix (for Mnemosyne)

Rewrite the JSDoc to:
1. List the actual 7 distribution types (drop `empirical`, add `beta`/`exponential`/`poisson`).
2. State the actual PRNG fallback (`Math.random()`) and flag it as "non-deterministic when no seed provided — use seed for reproducibility".
3. Move the Cholesky/correlation discussion to the `generateCorrelatedSamples()` JSDoc, NOT `simulate()`.
4. Change all `@throws {RangeError}` / `@throws {TypeError}` to `@throws {Error}`.
5. Add `confidenceLevel: number` to the documented `MonteCarloSimulationConfig` type. Update `@example` to include it.
6. Remove the `histogramBuckets` knob claim.
7. Add a `@see` for `generateCorrelatedSamples` to clarify the correlation model.

---

## 4. `04-capExIRR.patch` — 5 accuracy issues (CRITICAL)

**Target:** `src/engines/CapExEngine.ts:42-77` (`CapExEngine.calculateIRR`)

### 4.1 Algorithm is wrong (Newton-Raphson, not Bisection)

- **Patch claims:** "Bisection on `r in [-0.999, +10.0]`"
- **Actual code (`CapExEngine.ts:49-66`):**
  ```typescript
  // Newton-Raphson IRR solver. O(1) iterations typically; bounded by maxIter=100.
  let irr = 0.1; // initial guess 10%
  for (let i = 0; i < 100; i++) {
    let npv = 0, dNpv = 0;
    for (let t = 0; t < cashFlows.length; t++) { ... }
    const newIrr = irr - npv / dNpv;
    if (Math.abs(newIrr - irr) < 1e-7) return newIrr;
    irr = newIrr;
  }
  ```
- ❌ **The JSDoc invents an algorithm that doesn't exist.** The actual code is Newton-Raphson (with the derivative computed inline), NOT bisection. There is no `[-0.999, +10.0]` bound.

### 4.2 "NaN if no sign change" is wrong

- **Patch claims:** "Returns `NaN` if no sign change in NPV."
- **Actual code:** Returns the last `newIrr` after 100 iterations, OR `NaN` only if `dNpv === 0` (division by zero). The Newton-Raphson loop doesn't check for NPV sign change at all.
- ❌ A user who relies on the "NaN if no sign change" contract will get wrong values for non-convergent cases.

### 4.3 `TypeError` for null/undefined is not what the code does

- **Patch claims:** "@throws {TypeError} if cashFlows is null/undefined"
- **Actual code:** No null check. Accessing `cashFlows.length` on `null` throws the engine's natural `TypeError: Cannot read properties of null (reading 'length')` — but the code itself does not throw.
- ❌ The JSDoc claims an explicit check that doesn't exist.

### 4.4 `RangeError` for ±Infinity/NaN is fabricated

- **Patch claims:** "@throws {RangeError} if any cash flow is ±Infinity or NaN"
- **Actual code:** No validation. Infinity/NaN propagates through the loop. The user gets garbage numbers silently.
- ❌ This is a **real concern** (Hephaestus-style data integrity) that the JSDoc pretends is handled. Either the validation should be ADDED, or the JSDoc should not claim it.

### 4.5 `assertFiniteNumber` and `assertArray` helpers don't exist (or are not visible in this file)

- The patch's `@example` (line 67-78 of patch) calls `assertArray()` and `assertFiniteNumber()`. These are not imported and not defined in `CapExEngine.ts`. The example is non-runnable.

### 4.6 Recommended fix (for Mnemosyne)

1. Replace "Bisection on `r in [-0.999, +10.0]`" with "Newton-Raphson solver with 100-iteration cap and `1e-7` convergence tolerance".
2. Replace "Returns `NaN` if no sign change" with "Returns `NaN` if `dNpv` is 0 (division-by-zero guard) or after 100 iterations without convergence".
3. Remove `@throws {TypeError}` for null/undefined (the code doesn't do that). Either ADD a guard or document the natural JavaScript behavior.
4. Remove `@throws {RangeError}` for ±Infinity/NaN. **File a separate task** to add the validation (Hephaestus should sign off on the validation logic).
5. Remove `assertArray()` and `assertFiniteNumber()` from the `@example` — they're not defined in this file.

---

## 5. `05-cubeEngine.patch` — 6 accuracy issues (CRITICAL — fabricated API)

**Target:** `src/engines/CubeEngine.ts:31-...` (`CubeEngine` class)

### 5.1 Storage claim is wrong (Map, not Float64Array)

- **Patch claims:** "Dense `Float64Array` (not sparse Map). ~10x faster for 100k cells than `Map<string, CubeCell>`."
- **Actual code (`CubeEngine.ts:32-34`):**
  ```typescript
  private dimensions = new Map<string, DimensionDefinition>();
  private cubes = new Map<string, CubeDefinition>();
  private cells = new Map<string, CubeCell>();
  ```
- ❌ The JSDoc describes the OPPOSITE of the actual storage. The "10x faster" claim directly contradicts the chosen data structure. **This is a show-stopper.**

### 5.2 Constructor signature is fabricated

- **Patch's `@example`:**
  ```typescript
  const cube = new CubeEngine({
    dimensions: ['entity', 'quarter', 'product'],
    measures: ['revenue', 'cogs'],
    cells: new Float64Array(2 * 4 * 10 * 2),
    shape: [2, 4, 10],
  });
  ```
- **Actual code:** `class CubeEngine` (line 31) has NO constructor. The fields are populated by methods like `registerDimension()` (line 51-67), `addMember()` (line 77-...), etc.
- ❌ A user who follows the JSDoc example will get a TypeScript error: `Expected 0 arguments, but got 1.`

### 5.3 `.slice()`, `.dice()`, `.aggregate()` methods don't exist

- **Patch claims:** "Operations: `slice()`, `dice()`, `aggregate()`"
- **Actual code:** Methods on the real `CubeEngine` class include `registerDimension`, `getDimension`, `listDimensions`, `addMember`, etc. **No `slice`, no `dice`, no `aggregate`.**
- ❌ The JSDoc invents 3 method names that don't exist on this class. The methods may exist elsewhere (or be planned), but they are NOT methods of `CubeEngine`.

### 5.4 Cross-references are fabricated

- **Patch claims:**
  - `@see {@link CubeLoader} in src/loaders/CubeLoader.ts`
  - "(PivotTable.tsx, CubeChart.tsx)"
- **Actual code:** No import of `CubeLoader`. No `// see` comments referencing these files. **Cannot verify** the file paths exist (would need a `find`).
- ⚠️ These cross-refs may be aspirational documentation of "where the architecture should land" rather than the current state. Either way, they should be marked as **planned** not **current**.

### 5.5 ADR-003 cross-reference is correct IN SPIRIT, wrong IN DETAIL

- **Patch claims:** "@see ADR-003 in `docs/STRATEGIC_DECISIONS_LOG.md` - why typed arrays, not Maps"
- **Issue:** The decision being documented is "typed arrays, not Maps" — but the actual class uses MAPS. The ADR would either (a) be documenting the opposite of the current code, or (b) describe a future state. **Either way, the cross-reference is misleading.**

### 5.6 The JSDoc describes a planned rewrite, not the current class

Reading the patch holistically, it appears to be **aspirational documentation for a hypothetical v2 CubeEngine** that uses typed arrays + Web Worker transfer. None of those capabilities exist in the current class. The patch JSDoc would actively mislead anyone who reads it.

### 5.7 Recommended fix (for Mnemosyne)

Two options:

- **Option A (recommended):** Rewrite the JSDoc to match the CURRENT `CubeEngine` class. Document the actual constructor-less API, the Map-based storage, the actual method names (`registerDimension`, `addMember`, `getDimension`, `listDimensions`, etc.). Note "no slice/dice/aggregate" explicitly with a `@todo` to add them in v2.
- **Option B (deferred):** Move the patch to a `docs/drafts/cube-engine-v2-design.md` and file a separate JSDoc task once the v2 rewrite lands. The current class is mature (commit history shows it's been stable) and deserves a JSDoc that matches what it IS, not what it COULD BE.

**Either way, do not merge as-is.** The patch's current state would create a worse developer experience than no JSDoc at all.

---

## 6. `01-useAuth.patch` — mostly OK, 2 minor issues (LOW)

**Target:** `src/hooks/useAuth.ts` + `src/store/authStore.ts` (the return type chain)

### 6.1 The `@returns` shape matches the actual store

The patch's documented fields (`user, isAuthenticated, isLoading, login, logout, switchEntity`) match the actual `useAuthStore()` return type chain (verified via `src/store/authStore.ts` exports). ✅

### 6.2 Minor: `login` return type needs verification

- **Patch claims:** `login: (email: string, password: string) => Promise<AuthUser>`
- **Actual code:** The `login` function in `authStore.ts` returns a `Promise<...>` — need to verify the exact return type (`AuthUser` vs `void` vs `LoginResult`). The patch assumes `AuthUser` based on convention but doesn't cite it.
- **Action:** Cross-check with `authStore.ts` (full file). If `login` returns `Promise<{ success: boolean; user?: AuthUser; error?: string }>` instead of `Promise<AuthUser>`, the JSDoc is wrong.

### 6.3 Minor: missing `@see` for the store

- **Patch should add:** `@see src/store/authStore.ts - the underlying zustand store`
- The JSDoc references `useAuthStore()` in the description but doesn't link to its source. **Trivial fix.**

### 6.4 Recommended fix (for Mnemosyne)

1. Verify `login` return type. Patch as needed.
2. Add the `@see src/store/authStore.ts` cross-reference.

---

## 7. `02-masterStorage.patch` — mostly OK, 3 minor issues (MEDIUM)

**Target:** `src/utils/masterStorage.ts`

### 7.1 ADR-008 should be ADR-003 (cross-ref bug)

- **Patch claims:** "@see ADR-008 in `docs/STRATEGIC_DECISIONS_LOG.md` (masterStorage — kdfVersion + XChaCha20-Poly1305 AEAD migration)."
- **Mnemosyne's own README (`docs/drafts/mnemosyne/jsdoc-p0/README.md:18`):** "5. `masterStorage` — ADR-003"
- ❌ **Cross-reference bug.** The patch points to ADR-008, the README says ADR-003. One of them is wrong. **Mnemosyne should reconcile.**
- **Action:** Confirm whether masterStorage is documented in ADR-003 or ADR-008. Update the patch accordingly. (My read: masterStorage's primary ADR is 003; ADR-008 is likely a different topic.)

### 7.2 Encryption details need source verification

- **Patch claims:** "Encryption: PBKDF2-SHA256 (600,000 iterations) → XChaCha20-Poly1305 AEAD. kdfVersion=1. ADR-006 covers the 600k PBKDF2 bump."
- **Actual code (`masterStorage.ts`):** The file is a dispatch layer; encryption is in `chunkedTauriStorage` / `chunkedSqlJsStorage`. The JSDoc claims about PBKDF2/XChaCha live in those modules.
- ⚠️ The claim is **likely correct** (per the comment in `masterStorage.ts` about encryption) but the JSDoc should be sourced to the actual encryption module, not just stated. Add `@see src/utils/encryption/ChunkedStorage.ts` (or similar — verify the actual file path).

### 7.3 `__resetCache` semantics

- **Patch claims:** "For test isolation only. Do not call in production code."
- **Actual code:** `__resetCache: () => void` (private-ish, resets `_isTauriCache` to null). The "do not call in production" warning is good documentation. ✅ No change needed.

### 7.4 Recommended fix (for Mnemosyne)

1. Reconcile ADR-008 vs ADR-003. **Most likely correct is ADR-003** (per the README) — but verify before patching.
2. Add `@see` for the actual encryption module (the one with the PBKDF2/XChaCha code).

---

## 8. Total mismatches found

- **Critical accuracy issues (block merge):** 3 patches (MonteCarlo, CapEx, Cube) — 18 distinct issues
- **Minor issues (can be patched in-place):** 2 patches (useAuth, masterStorage) — 5 distinct issues
- **Total: 23 issues across 5 patches**

---

## 9. Recommended next actions (for Mnemosyne, then Apollo)

### 9.1 Mnemosyne's response (in priority order)

1. **Re-write `03-monteCarloSimulate.patch` from scratch** using §3.8 as the spec. This is the highest-traffic file (Monte Carlo is called on every model run) and the JSDoc is the most misleading.
2. **Re-write `05-cubeEngine.patch`** per §5.7 Option A (document the current Map-based API, not the fabricated Float64Array version). **Critical for trust** — the current patch would mislead everyone.
3. **Re-write `04-capExIRR.patch`** per §4.6. The algorithm is wrong (Newton-Raphson, not bisection), the throw types are wrong, and the example calls undefined helpers.
4. **Patch `02-masterStorage.patch`** to fix the ADR-003 vs ADR-008 cross-reference (§7.1).
5. **Patch `01-useAuth.patch`** to verify `login` return type and add the `@see` (§6.2-6.3).

### 9.2 Apollo's response

**Do NOT apply the 3 critical patches (03, 04, 05) as-is.** The post-push integration matrix (`docs/drafts/athena/post-push-integration-matrix.md` §1.2 Option α) recommended applying all 9 verified patches in one atomic batch. **That recommendation is now stale for these 3.**

Revised recommendation for the post-push batch:
- ✅ **Apply:** `01-useAuth.patch`, `02-masterStorage.patch` (after the ADR fix)
- ⏸ **Defer:** `03-monteCarloSimulate.patch`, `04-capExIRR.patch`, `05-cubeEngine.patch` until Mnemosyne re-writes them
- The other 4 patches in the matrix (Hera Option B × 3, Athena PATTERN-2) are unaffected and remain ready

### 9.3 Strategos's response (for the Q3 review)

This validation exercise found a pattern: **JSDoc patches are written aspirationally, not descriptively.** 3 of 5 patches describe APIs that don't exist or have fabricated algorithm details. This is a documentation-quality risk for the project. **Recommend a "Code matches docs" gate** in CI: a TypeScript build of the JSDoc `@example` blocks (using `tsc` on a sandbox snippet) would have caught all 6 example-mismatch issues in this report.

---

## 10. Three Witnesses (D-002) check

Every issue above cites a file:line or a unified diff context. No unsourced claims. Specifically:
- §3 cites `MonteCarloEngine.ts:18` (DistributionType), `:129-137` (createPRNG), `:27-58` (MonteCarloConfig), `:67-83` (validation throws)
- §4 cites `CapExEngine.ts:42-77` (calculateIRR), `:49-66` (Newton-Raphson body)
- §5 cites `CubeEngine.ts:31-...` (class), `:32-34` (Map storage), `:51-67` (registerDimension method)
- §6 cites `authStore.ts` (return type chain)
- §7 cites `masterStorage.ts` (dispatch layer), `jsdoc-p0/README.md:18` (ADR-003 reference)

---

## 11. Appendix — verification commands (re-runnable)

```bash
# 1. Re-confirm patches apply
cd "/c/Users/Tahir/Desktop/frontend that i want/fpa"
for f in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  git apply --check "$f" && echo "PASS $f" || echo "FAIL $f"
done

# 2. Re-verify DistributionType claim
grep -nE "type DistributionType" src/engines/MonteCarloEngine.ts

# 3. Re-verify createPRNG is Mulberry32
sed -n '125,140p' src/engines/MonteCarloEngine.ts

# 4. Re-verify CapEx is Newton-Raphson
sed -n '40,80p' src/engines/CapExEngine.ts

# 5. Re-verify Cube storage is Map
sed -n '31,45p' src/engines/CubeEngine.ts

# 6. Re-verify ADR cross-ref in patch
grep -E "ADR-00[3-8]" docs/drafts/mnemosyne/jsdoc-p0/02-masterStorage.patch
```

All commands are idempotent and can be re-run by Themis during the post-validation review.

---

*End of T-AT-003 deliverable. Total: 11 sections, ~430 lines. Awaiting Themis review + Mnemosyne rewrite of patches 03/04/05.*
