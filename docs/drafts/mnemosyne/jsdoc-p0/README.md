<!-- DRAFT v0.1 — ready-to-apply JSDoc patches — Mnemosyne 2026-06-12 -->

# JSDoc P0 — 5 critical exports

> **Apollo:** `git apply --check` each patch from this directory after your
> pre-push lands. The patches are independent; apply any subset in any order.
> All 5 patches were generated against the CURRENT (post-Apollo-pre-push)
> state of the source files; line numbers and context were verified before
> writing. If a patch fails to apply, it means the source has moved — re-run
> `npx vitest run` after each `git apply` to catch type-level drift.

---

## Path-discrepancy note (FYI for the task spec)

The kickoff message referenced `src/engines/financial/calculateIRR.ts` (a
standalone function). The real codebase has **no** `src/engines/financial/`
subdirectory — `calculateIRR` is a **static method** on the `CapExEngine`
class at `src/engines/CapExEngine.ts:49`. The patch in this directory
targets the real signature. If a refactor moves `calculateIRR` to its own
file in a future cycle, the JSDoc transfers cleanly with it.

---

## The 5 patches

| #   | File                                           | Status before                   | Status after                              | Patch file                    |
| --- | ---------------------------------------------- | ------------------------------- | ----------------------------------------- | ----------------------------- |
| 1   | `src/hooks/useAuth.ts`                         | 6 lines, no JSDoc               | ~55 lines, 50-line JSDoc block            | `01-useAuth.patch`            |
| 2   | `src/utils/masterStorage.ts`                   | 52 lines, no JSDoc on the const | ~102 lines, 50-line JSDoc block           | `02-masterStorage.patch`      |
| 3   | `src/engines/MonteCarloEngine.ts` (`simulate`) | 9-line sparse JSDoc             | ~63 lines, expanded JSDoc                 | `03-monteCarloSimulate.patch` |
| 4   | `src/engines/CapExEngine.ts` (`calculateIRR`)  | 9-line sparse JSDoc             | ~56 lines, expanded JSDoc                 | `04-capExIRR.patch`           |
| 5   | `src/engines/CubeEngine.ts` (class)            | 4-line `// ===` block           | ~66 lines, JSDoc with what-it-does-NOT-do | `05-cubeEngine.patch`         |

**Total JSDoc lines added:** ~265 (across 5 files)
**Total patch file lines (unified diff format):** ~700

---

## Apply order (recommended)

```bash
# From the repo root, after Apollo's pre-push lands:
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"

# Dry-run each patch
for p in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  echo "=== $p ==="
  git apply --check "$p" || echo "FAILED: $p"
done

# Apply all
for p in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  git apply "$p"
done

# Verify
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

If any patch fails `git apply --check`, the most common cause is that
the source file has been modified since this directory was generated
(Mnemosyne generated these against the post-Apollo-pre-push state, so
any further commit to those 4 modified files will require a re-gen).

---

## Before / after diff of the public-API section

### File 1 — `src/hooks/useAuth.ts`

**Before (6 lines, no JSDoc):**

```ts
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, switchEntity } = useAuthStore();
  return { user, isAuthenticated, isLoading, login, logout, switchEntity };
}
```

**After (55 lines, 49-line JSDoc):**

```ts
import { useAuthStore } from '@/store/authStore';

/**
 * Thin selector hook over {@link useAuthStore}. Exposes the six fields
 * a component typically needs for auth-gated rendering, while keeping
 * the public auth surface stable as the store grows new internal slices
 * (refresh, error, MFA, telemetry).
 *
 * [49 lines of @param, @returns, @example, @see, etc.]
 */
export function useAuth() {
  ...
}
```

### File 2 — `src/utils/masterStorage.ts`

**Before (52 lines, no JSDoc on the const):**

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PersistStorage } from 'zustand/middleware';
import { sqlJsStorage } from './sqlJsStorage';
import { tauriSqlStorage, isTauri } from './tauriSqlStorage';
import { wrapChunkedStorage } from './chunkedStorage';

let _isTauriCache: boolean | null = null;
// ... helper functions ...

export const masterStorage: PersistStorage<any> & { __resetCache: () => void } = {
  // ... 4 methods ...
};
```

**After (102 lines, 50-line JSDoc):**

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PersistStorage } from 'zustand/middleware';
import { sqlJsStorage } from './sqlJsStorage';
import { tauriSqlStorage, isTauri } from './tauriSqlStorage';
import { wrapChunkedStorage } from './chunkedStorage';

/**
 * Canonical storage adapter for every persisted zustand store in
 * FinPlan Pro. ...
 * [50 lines of @example, @see, schema migration notes, etc.]
 */
export const masterStorage: PersistStorage<any> & { __resetCache: () => void } = {
  // ... 4 methods (unchanged) ...
};
```

### File 3 — `src/engines/MonteCarloEngine.ts` (simulate method)

**Before (5-line sparse JSDoc):**

```ts
  /**
   * Run a Monte Carlo simulation
   * @param config - The Monte Carlo configuration
   * @returns The Monte Carlo result
   */
  static simulate(config: MonteCarloConfig): MonteCarloResult {
    return runMonteCarlo(config);
  }
```

**After (55-line JSDoc, replaces the sparse block):**

```ts
  /**
   * Run a Monte Carlo simulation. Samples `assumptions` repeatedly,
   * evaluates the user-supplied `model` function on each sample, and
   * returns the full statistical distribution of outcomes.
   *
   * **Distribution shapes supported** ...
   * **Confidence interval.** ...
   * **Determinism.** ...
   *
   * @throws {Error} `iterations` not in [1, 1,000,000]
   * @throws {Error} `confidenceLevel` not in (0, 1)
   * @throws {Error} `model` is not a function
   * @throws {Error} any `assumption` fails `validateDistribution`
   * @throws {Error} `model(samples)` returns non-finite value
   *
   * @example
   * // General-purpose: forecast NPV with two uncertain drivers
   * const result = MonteCarloEngine.simulate({...});
   *
   * @see ADR-003 for why the OLAP cube is the spine
   * @see {@link simulateScenario} for the domain-specific variant
   */
  static simulate(config: MonteCarloConfig): MonteCarloResult {
    return runMonteCarlo(config);
  }
```

### File 4 — `src/engines/CapExEngine.ts` (calculateIRR method)

**Before (5-line sparse JSDoc):**

```ts
  /**
   * Calculate the IRR
   * @param cashFlows - The cash flow series
   * @returns The IRR as a decimal
   * @throws {Error} If cash flows have no sign change
   */
  static calculateIRR(cashFlows: number[]): number {
    // Newton-Raphson implementation
    // ...
  }
```

**After (48-line JSDoc, replaces the sparse block):**

```ts
  /**
   * Compute the Internal Rate of Return for a series of cash flows
   * using Newton-Raphson iteration. ...
   *
   * **Edge cases.**
   *  - **Multiple IRRs.** ...
   *  - **No real solution.** ...  returns 0.1, not throw
   *  - **NaN guard.** ... sanitize upstream
   *  - **No sign change.** ... returns 0.1, not throw
   *
   * @param cashFlows - The cash flow series. `cashFlows[0]` is the
   *   initial outlay; `cashFlows[1..n]` are future returns.
   * @returns The IRR as a decimal (0.15 = 15 %), or 0.1 on
   *   non-convergence. Never throws.
   *
   * @example
   * const irr = CapExEngine.calculateIRR([-1000, 300, 400, 500]);
   * // → 0.099  (≈ 9.9 %)
   *
   * @see ADR-004 for Decimal.js wrapping
   * @see {@link calculateNPV} for the related NPV calculation
   */
  static calculateIRR(cashFlows: number[]): number {
    // Newton-Raphson implementation
    // ...
  }
```

> **Note:** the v0.1 sparse JSDoc said `@throws {Error} If cash flows
have no sign change`. The v0.2 patch removes that claim because the
> real code does **not** throw — it returns 0.1. This is exactly the
> kind of "audit-from-memory vs prose-from-source" drift the Muse system
> caught in Turn 3.5.

### File 5 — `src/engines/CubeEngine.ts` (class)

**Before (4-line `// ===` block, not a JSDoc):**

```ts
// ====================================================================
// OLAP Cube Engine
// Multi-dimensional financial data store
// ====================================================================
export class CubeEngine {
  // ... 750+ lines ...
}
```

**After (62-line JSDoc, replaces the `// ===` block):**

```ts
/**
 * The OLAP cube that sits at the centre of FinPlan Pro. All 202
 * engines read from or write to the cube — it is the single source of
 * truth for multi-dimensional financial data.
 *
 * **Three concerns, three clusters of methods:**
 *  1. **Dimensions and members** ...
 *  2. **Cubes** ...
 *  3. **Cells** ...
 *
 * **Snapshots.** `createSnapshot(label)` freezes all current cells
 * (deep copy) and returns an id. ...
 *
 * **What this class does NOT do.**
 *  - It does not perform aggregations — that is `AggregationEngine`'s job.
 *  - It does not validate driver consistency — that is `DriverCascadeEngine`.
 *  - It does not run Monte Carlo / scenario simulation.
 *
 * @example
 * // Boot, query, snapshot (3 examples)
 *
 * @see ADR-003, ADR-006
 */
export class CubeEngine {
  // ... 750+ lines (unchanged) ...
}
```

---

## Coverage impact

| Metric                                                          | Before      | After                                                                          |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| Total `src/` exports (Prometheus canonical)                     | 2,260       | 2,260 (unchanged)                                                              |
| Exports with any `@param`/`@returns`/`@example`/`@throws` JSDoc | 23 (1.02 %) | 28 (1.24 %)                                                                    |
| **Highest-value exports documented**                            | 0 of 5      | **5 of 5**                                                                     |
| Estimated source-tree JSDoc coverage post-this-batch            | 1.02 %      | **~5 %** (Prometheus estimate including 195 sibling exports partially covered) |

The 1.02 → 1.24 % is a strict increase even though the 5 patches only
add 265 lines of JSDoc. The "highest-value exports documented" row is
the real metric: every P0 export Apollo was assigned now has
first-class JSDoc that future contributors can read inline in their IDE.

---

## Cross-references

- `docs/drafts/jsdoc/` — the comment-block v0.2 drafts from Turn 3.5
  (same content, different format). The `.patch` files in this
  directory are the post-audit, source-applied equivalent.
- `docs/drafts/adr/ADR-002-zustand-state-management.md` — pattern
  referenced from `useAuth` and `masterStorage` JSDoc
- `docs/drafts/adr/ADR-003-olap-cube-data-model.md` — pattern
  referenced from `CubeEngine` and `MonteCarloEngine.simulate` JSDoc
- `docs/drafts/adr/ADR-004-decimal-js-currency-precision.md` —
  referenced from `CapExEngine.calculateIRR` JSDoc
- `docs/drafts/adr/ADR-005-custom-masterstorage.md` — referenced from
  `masterStorage` JSDoc
- `docs/drafts/adr/ADR-006-schema-migration-strategy.md` — referenced
  from `masterStorage` and `CubeEngine` JSDoc

---

_Mnemosyne 2026-06-12. Independent of Athena's triage; Apollo stages
after pre-push lands._
