<!-- DRAFT v0.2 — ground-truth corrected 2026-06-12 — Mnemosyne -->

# JSDoc draft — `src/engines/MonteCarloEngine.ts` (v0.2, corrected)

> **Ground-truth note (2026-06-12)**: v0.1 had THREE major signature errors:
>
> 1.  The `MonteCarloConfig` shape was wrong — real is
>     `{ iterations, confidenceLevel, assumptions: DistributionConfig[], model: (samples) => number, seed? }`,
>     not the `{ distributions: { revenue: { type, mu, sigma } }, model: 'revenue_forecast' }`
>     shape I had written.
> 2.  Normal distribution uses `mean` + `stdDev` (NOT `mu` + `sigma`).
> 3.  `model` is a **function** `(samples: Record<string, number>) => number`,
>     not a string identifier.
>     v0.2 documents the real API. Apollo: paste the JSDoc above the `import` line.

---

## Current source (signature summary, 856 lines)

```ts
export type DistributionType =
  | 'normal'
  | 'uniform'
  | 'triangular'
  | 'lognormal'
  | 'beta'
  | 'exponential'
  | 'poisson';

export interface DistributionConfig {
  readonly name: string;
  readonly type: DistributionType;
  readonly mean?: number; // normal / lognormal
  readonly stdDev?: number; // normal / lognormal
  readonly min?: number; // uniform / triangular
  readonly max?: number; // uniform / triangular
  readonly mode?: number; // triangular
  readonly alpha?: number; // beta
  readonly betaParam?: number; // beta
  readonly lambda?: number; // exponential / poisson
}

export interface MonteCarloConfig {
  readonly iterations: number;
  readonly confidenceLevel: number; // 0 < c < 1
  readonly assumptions: DistributionConfig[]; // ← ARRAY of configs
  readonly model: (samples: Record<string, number>) => number; // ← FUNCTION
  readonly seed?: number; // optional, for reproducibility
}

export interface MonteCarloResult {
  readonly iterations: number;
  readonly mean: number;
  readonly median: number;
  readonly stdDev: number;
  readonly variance: number;
  readonly min: number;
  readonly max: number;
  readonly skewness: number;
  readonly kurtosis: number;
  readonly percentiles: Record<number, number>; // p ∈ [0,100] → value
  readonly confidenceInterval: { lower: number; upper: number; level: number };
  readonly histogram: { lower: number; upper: number; count: number; density: number }[];
  readonly values: readonly number[];
  readonly rawSamples: ReadonlyArray<Record<string, number>>;
}

export class MonteCarloEngine {
  static simulate(config: MonteCarloConfig): MonteCarloResult {
    /* ... */
  }
  static simulateScenario(config: ScenarioMonteCarloConfig): ScenarioMonteCarloResult {
    /* ... */
  }
  static validateDistribution(config: DistributionConfig): void {
    /* ... */
  }
}
```

## Proposed JSDoc to paste above the `import` line

```ts
/**
 * Probabilistic simulation engine. Two static entry points:
 *
 *  • `simulate(config)` — general-purpose: pass any `model: (samples) => number`
 *    function and a list of distribution assumptions. Returns the full
 *    {@link MonteCarloResult} (mean, stdDev, percentiles, histogram, raw samples).
 *  • `simulateScenario(config)` — domain-specific: pass `baseMetrics: ScenarioMetrics`
 *    and a list of `MonteCarloDriver`s that target specific metrics. Returns
 *    per-metric distributions plus probability-of-profit and Value-at-Risk.
 *
 * **Determinism** — pass `seed` to get reproducible results; the PRNG is
 * Mulberry32 (32-bit state, no crypto strength). Default uses `Math.random`.
 *
 * **Limits** — `iterations` is hard-capped at 1,000,000 (throws on overflow)
 * and minimum 1. `confidenceLevel` must be in `(0, 1)` exclusive.
 *
 * **Distribution shapes** — `normal`/`lognormal` use `mean` + `stdDev`
 * (NOT `mu`/`sigma`). `triangular` uses `min`/`max`/`mode`. `beta` uses
 * `alpha`/`betaParam`. `exponential`/`poisson` use `lambda`.
 *
 * @example  // General-purpose: forecast NPV with two uncertain drivers
 * import { MonteCarloEngine } from '@/engines/MonteCarloEngine';
 *
 * const result = MonteCarloEngine.simulate({
 *   iterations: 10_000,
 *   confidenceLevel: 0.95,
 *   seed: 42,                                    // reproducible
 *   assumptions: [
 *     { name: 'revenue', type: 'normal', mean: 1_000_000, stdDev: 50_000 },
 *     { name: 'cost',    type: 'triangular', min: 600_000, max: 800_000, mode: 700_000 },
 *   ],
 *   model: (s) => s.revenue - s.cost,           // ← function, not string
 * });
 * console.log(result.mean, result.confidenceInterval);  // ~300_000, [lower, upper]
 *
 * @example  // Domain scenario: NPV distribution + probability of profit
 * const scenario = MonteCarloEngine.simulateScenario({
 *   baseMetrics: { revenue: 1_000_000, cost: 700_000 /* ...ScenarioMetrics... *\/ },
 *   drivers: [
 *     { name: 'rev', distribution: { type: 'normal', mean: 0, stdDev: 0.05 },
 *       targetMetric: 'revenue', impactType: 'percentage' },
 *   ],
 *   iterations: 5_000,
 *   confidenceLevel: 0.95,
 * });
 * console.log(scenario.probabilityOfProfit);    // e.g. 0.72
 * console.log(scenario.valueAtRisk);             // 5th-percentile loss
 *
 * @throws {Error} `iterations` not in [1, 1_000_000]
 * @throws {Error} `confidenceLevel` not in (0, 1)
 * @throws {Error} `model` is not a function
 * @throws {Error} any `assumption` fails `validateDistribution`
 * @throws {Error} `model(samples)` returns non-finite value (e.g. divide-by-zero)
 *
 * @see ADR-003 — OLAP cube (MonteCarlo output rolls up into cube measures)
 * @see ADR-004 — Decimal.js (wrap `mean`/`stdDev` in Decimal for money math)
 * @see {@link MonteCarloResult}      — full statistical output
 * @see {@link DistributionConfig}    — per-assumption distribution spec
 */
```

## What changed from v0.1

| v0.1 (WRONG)                                                                  | v0.2 (correct)                                                               |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `distributions: { revenue: { type, mu, sigma } }` (record, with `mu`/`sigma`) | `assumptions: DistributionConfig[]` (array, with `mean`/`stdDev`)            |
| `model: 'revenue_forecast'` (string)                                          | `model: (samples: Record<string, number>) => number` (function)              |
| `stats.mean` / `stats.median` / `stats.stdDev`                                | `result.mean` / `result.median` / `result.stdDev` (flat, no `stats.` prefix) |
| `MonteCarloDriver` not mentioned                                              | `MonteCarloDriver` + `simulateScenario` documented as the domain path        |
| No `seed` field                                                               | `seed?: number` for reproducibility documented                               |
| No `validateDistribution`                                                     | Mentioned in `@throws` and as a static helper                                |
