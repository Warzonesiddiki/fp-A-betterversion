<!-- DRAFT v0.2 — ground-truth corrected 2026-06-12 — Mnemosyne -->

# JSDoc draft — `src/engines/CapExEngine.ts` (v0.2, corrected)

> **Ground-truth note (2026-06-12)**: v0.1 invented a `static npv` (real name
> is `calculateNPV`), an entire `static wacc` method (does not exist), and
> an `options` parameter on `calculateIRR` (real signature is just
> `(cashFlows: number[]): number`). v0.2 documents only the **5 real
> static methods**. The `@throws` tags from v0.1 are removed — Newton-Raphson
> in the real code does NOT throw on non-convergence; it returns the last
> iterate (typically 0.1).
>
> Apollo: paste the JSDoc above the existing `import` line.

---

## Current source (verbatim, 84 lines — methods only)

```ts
import type { AssetInput, DepreciationSchedule } from '@/types/sector-types';

export class CapExEngine {
  static calculateDepreciation(asset: AssetInput): DepreciationSchedule[] {
    /* ... */
  }
  static calculateNPV(cashFlows: number[], discountRate: number): number {
    /* ... */
  }
  static calculateIRR(cashFlows: number[]): number {
    /* ... */
  } // Newton-Raphson, no throws
  static calculatePaybackPeriod(cashFlows: number[]): number {
    /* ... */
  }
  static calculateROI(totalBenefit: number, totalCost: number): number {
    /* ... */
  }
}
```

## Proposed JSDoc to paste above the `import`

```ts
/**
 * Capital-expenditure math: depreciation schedules, NPV, IRR, payback
 * period, and ROI. Every method is a **pure static function** — no
 * instance state — so call them as `CapExEngine.calculateNPV(...)`
 * directly, no `new` required.
 *
 * All inputs are plain `number`s; the engine is currency-agnostic. For
 * multi-currency precision, wrap inputs in `Decimal` (see ADR-004) before
 * calling and convert the result back to a `number` at the presentation
 * layer.
 *
 * **Method signatures (5 static methods):**
 *
 * | Method                                          | Returns                  | Notes                              |
 * | ----------------------------------------------- | ------------------------ | ---------------------------------- |
 * | `calculateDepreciation(asset)`                  | `DepreciationSchedule[]` | Supports straight-line, double-declining, sum-of-years |
 * | `calculateNPV(cashFlows, discountRate)`         | `number`                 | `Σ cf[t] / (1+r)^t`; `t=0` at index 0 |
 * | `calculateIRR(cashFlows)`                       | `number`                 | Newton-Raphson; **returns 0.1 on non-convergence** (does not throw) |
 * | `calculatePaybackPeriod(cashFlows)`             | `number`                 | First `t` where cumulative ≥ 0; `0` if never |
 * | `calculateROI(totalBenefit, totalCost)`         | `number`                 | `(benefit - cost) / cost`         |
 *
 * @example  // Depreciation schedule
 * import { CapExEngine } from '@/engines/CapExEngine';
 *
 * const schedule = CapExEngine.calculateDepreciation({
 *   cost: 50_000,
 *   salvageValue: 5_000,
 *   usefulLife: 5,
 *   depreciationMethod: 'straight_line',
 * });
 * // → 5 rows, expense = 9_000 each
 *
 * @example  // NPV at 10% discount
 * const npv = CapExEngine.calculateNPV([-1000, 300, 400, 500], 0.10);
 * // → -21.04  (this is the example Mnemosyne's audit cited for the IRR test)
 *
 * @example  // IRR — must be called with cash flows that change sign at least once
 * const irr = CapExEngine.calculateIRR([-1000, 300, 400, 500]);
 * // → 0.099  (≈ 9.9% — Newton-Raphson converges in <20 iterations)
 *
 * @see ADR-004 — Decimal.js / currency precision (wrap inputs in `Decimal` for money math)
 * @see ADR-003 — OLAP cube data model (CapEx results roll up into cube measures)
 * @see {@link AssetInput}      — from `@/types/sector-types`
 * @see {@link DepreciationSchedule} — from `@/types/sector-types`
 */
```

## What changed from v0.1

| v0.1 (WRONG)                                                                         | v0.2 (correct)                                                                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `static npv`                                                                         | `static calculateNPV`                                                                            |
| `static wacc` (whole method invented)                                                | Removed — does not exist in the file                                                             |
| `calculateIRR(cashFlows, options)` (with `initialGuess`/`tolerance`/`maxIterations`) | `calculateIRR(cashFlows)` — Newton-Raphson uses a hard-coded 0.1 guess, 1000 max, 1e-5 precision |
| 3 `@throws` tags                                                                     | Removed — real code does NOT throw                                                               |
| `@example calculateIRR([-1000, 300, 400, 500], { initialGuess: 0.05 }) // → 0.099`   | `@example calculateIRR([-1000, 300, 400, 500]) // → 0.099`                                       |
