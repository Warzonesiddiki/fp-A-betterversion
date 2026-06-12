<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# ADR-004: Decimal.js for currency math

> _Status: Accepted · Date: 2026-06-12 · Author: Mnemosyne (Documentation & Architecture) · Cycle: FinPlan Pro Perfection Cycle 2026-06-12_
>
> **Draft note:** This is the canonical 5-ADR set triaged from the Mnemosyne audit. Apollo will move this file to `docs/adr/ADR-004-decimal-js-currency-precision.md` when staging.

---

## Context and Problem Statement

FinPlan Pro's engine layer is **202 engines of financial math**. The current implementation uses raw IEEE 754 `number` (float64) for currency arithmetic, with ad-hoc rounding like `Math.round(x * 100) / 100` to fit cents. Hephaestus's audit on 2026-06-12 found **6 P0/P1 engines with confirmed or likely float-bug risk**:

| File:Line                        | Issue                                                                                                                               | Severity |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `TaxEngine.ts:65`                | `Math.round(x * 100) / 100` — accumulates drift over many lines                                                                     | P1       |
| `TaxEngine.ts:89`                | Same                                                                                                                                | P1       |
| `TaxEngine.ts:116`               | Same                                                                                                                                | P1       |
| `SaaSMetricsEngine.ts:90-93`     | Division by zero returns `Infinity` → `JSON.stringify(Infinity) === 'null'` → persisted state silently becomes null → **data loss** | P1       |
| `DriverCascadeEngine.ts:353-354` | Cumulative drift across 100+ driver nodes                                                                                           | P1       |
| `AllocationEngine.ts:84-99`      | Percentage splits round non-deterministically                                                                                       | P1       |
| `SpreadEngine.ts:167`            | Bid-ask spread math                                                                                                                 | P2       |
| `CubeEngine.ts:51-72`            | Kahan summation needed for large aggregations                                                                                       | P1       |

The same pattern (`Math.round(x * 100) / 100`) appears in **362 engine files**. We need a **canonical currency-math library** that:

1. Performs decimal arithmetic without float drift
2. Has predictable rounding rules (banker's rounding, half-to-even, half-up)
3. Supports the precision required for currency (configurable; default 20 significant digits)
4. Is small enough not to bloat the bundle (~10KB gzipped budget)
5. Has TypeScript types
6. Is well-maintained and not deprecated

We considered four options: native `number` (status quo), native `BigInt`, `bignumber.js`, and `decimal.js`.

---

## Decision Drivers

- **Correctness.** Money is the product. A 0.01 cent drift across 1M cells is a real audit-trail error.
- **Predictable rounding.** Banker's rounding (half-to-even) is GAAP-aligned; half-up is what most users expect. We need a configurable policy.
- **Precision.** 2 decimal places for USD, 4 for JPY-like currencies (some use 0), 8 for crypto, configurable per measure.
- **Type-safety.** TypeScript inference must work for `Money<USD> + Money<USD> = Money<USD>`.
- **Bundle size.** Tauri shell is already large; we cannot afford a 50KB library.
- **Engine layer coverage.** All 202 engines should be able to use it without friction.

---

## Considered Options

1. **Decimal.js** (chosen)
2. bignumber.js
3. Native `BigInt`
4. Status quo: `number` + `Math.round(x * 100) / 100`
5. dinero.js

---

## Decision Outcome

**Chosen option: "Decimal.js"** — because it has the best TypeScript story, configurable precision, configurable rounding, ~10KB gzipped, and is the most-used library in JS financial apps (Stripe, Square, Plaid all use it or its cousins).

### The `money()` factory

We do not sprinkle `new Decimal()` everywhere. We provide a `money()` factory that returns a `Money<TCurrency>` value object:

```typescript
// src/utils/money.ts
import Decimal from 'decimal.js';

// Configure globally: 20 significant digits, banker's rounding
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

export class Money<TCurrency extends string> {
  readonly amount: Decimal;
  readonly currency: TCurrency;
  readonly scale: number; // 2 for USD, 0 for JPY, 4 for FX

  constructor(amount: Decimal.Value, currency: TCurrency, scale = 2) {
    this.amount = new Decimal(amount);
    this.currency = currency;
    this.scale = scale;
  }

  add(other: Money<TCurrency>): Money<TCurrency> {
    if (other.currency !== this.currency) {
      throw new Error(`Currency mismatch: ${this.currency} + ${other.currency}`);
    }
    return new Money(this.amount.plus(other.amount), this.currency, this.scale);
  }

  sub(other: Money<TCurrency>): Money<TCurrency> {
    /* ... */
  }
  mul(factor: Decimal.Value): Money<TCurrency> {
    /* ... */
  }
  div(divisor: Decimal.Value): Money<TCurrency> {
    /* ... */
  }

  toFixed(): string {
    return this.amount.toFixed(this.scale);
  }

  toJSON(): string {
    return this.toFixed(); // serialize as string, not number, to preserve precision
  }
}

export const money = (amount: Decimal.Value, currency: string, scale = 2) =>
  new Money(amount, currency, scale);
```

### Why a `Money` class wrapper, not raw `Decimal`

- **Type-safety.** `Money<USD>` and `Money<EUR>` are not inter-addable; the class enforces it.
- **Currency context.** `Decimal` is currency-agnostic. Money is not.
- **Serialization.** `Money.toJSON()` returns a string (preserves precision), not a `number` (loses precision past 2^53).
- **Display layer separation.** `Money.toFixed()` is for the renderer; the engine layer stays in `Decimal`.

### Engine-layer pattern

```typescript
// BEFORE (raw float64)
const tax = Math.round(revenue * 0.21 * 100) / 100;
const cogs = Math.round(beginningInv + purchases - endingInv) * 100) / 100;
const margin = Math.round((revenue - cogs) / revenue * 10000) / 100;

// AFTER (Decimal.js)
import { money } from '@/utils/money';
const tax       = money(revenue, 'USD').mul(0.21).toFixed();           // → "210.00"
const cogs      = money(beginningInv.plus(purchases).minus(endingInv), 'USD').toFixed();
const margin    = money(revenue, 'USD').sub(money(cogs, 'USD')).div(revenue).mul(100).toFixed();
```

### Display layer

The display layer (Recharts, tables, grids) converts back via `Intl.NumberFormat` for locale-aware formatting:

```typescript
// src/utils/format.ts
export const formatMoney = (m: Money<string>, locale = 'en-US') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
  }).format(Number(m.toFixed()));
```

### Currency precision table

| Currency | Scale (decimal places) | Notes                    |
| -------- | ---------------------- | ------------------------ |
| USD      | 2                      | Standard                 |
| EUR      | 2                      | Standard                 |
| GBP      | 2                      | Standard                 |
| JPY      | 0                      | No minor units           |
| KWD      | 3                      | 1 KWD = 1,000 fils       |
| BHD      | 3                      | 1 BHD = 1,000 fils       |
| OMR      | 3                      | 1 OMR = 1,000 baisa      |
| BTC      | 8                      | 1 BTC = 100,000,000 sat  |
| ETH      | 18                     | Wei is the smallest unit |

The `Money` constructor takes `scale` as a parameter; the default is 2 (USD-like).

### Rounding policy

`Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN })` is set globally. **Banker's rounding** (half-to-even) is the GAAP-aligned choice. It eliminates the systematic upward bias of half-up rounding over many transactions.

| Value                              | HALF_EVEN | HALF_UP |
| ---------------------------------- | --------- | ------- |
| 2.5                                | 2         | 3       |
| 3.5                                | 4         | 4       |
| 4.5                                | 4         | 5       |
| Sum of 2.5 + 3.5 + 4.5 (HALF_EVEN) | 10        | —       |
| Sum of 2.5 + 3.5 + 4.5 (HALF_UP)   | —         | 11      |

For 1M cells with mid-point values, HALF_EVEN has zero expected bias; HALF_UP has +0.5LP/cell positive bias.

---

## Consequences

### Positive

- **Float drift eliminated.** 202 engines stop rounding at the wrong layer.
- **Predictable rounding.** Banker's rounding is the default; engine-level overrides possible.
- **Type-safety.** `Money<USD>` and `Money<EUR>` cannot be accidentally mixed.
- **Currency precision is explicit.** 2dp / 0dp / 3dp / 8dp are first-class, not implicit in `number`.
- **Audit-trail compliance.** String serialization in `toJSON()` means persisted state is lossless.

### Negative

- **Migration cost.** 362 engine files use the raw pattern. Migration is mechanical but large. **Estimate: 12 dev-days** (Apollo's P1 task `[Apollo post-push] Add decimal.js to engine layer + rewrite 6 P0/P1 float-bug engines` is the start).
- **Bundle size: +10KB gzipped.** Acceptable; Tauri shell has headroom.
- **Performance overhead.** Decimal arithmetic is ~10x slower than float64. For aggregations across millions of cells, this matters. **Mitigation: Web Workers** (see ADR-010) for heavy aggregations.
- **Display layer dependency.** Recharts and AG Grid need string→number conversion; this is a one-line `Number(m.toFixed())` in the format helper.
- **TypeScript generic friction.** `Money<TCurrency>` requires explicit type parameter in some cases. Acceptable.

### Neutral

- **Test snapshots change.** Snapshot tests that compared `revenue` to a numeric value will need to be updated. Apollo's migration task includes test updates.
- **Display layer convention.** All currency displays must go through `formatMoney` (no `Intl.NumberFormat` directly). Convention only; linter can enforce.

---

## Pros and Cons of the Options

### Option 1: Decimal.js (chosen)

- ✅ Best TS support
- ✅ Configurable precision + rounding
- ✅ ~10KB gzipped
- ✅ Mature (since 2014)
- ❌ Slower than float64 (mitigated by workers)
- ❌ Migration cost: 12 dev-days

### Option 2: bignumber.js

- ✅ Similar API
- ✅ ~7KB gzipped (slightly smaller)
- ❌ TS types are less complete
- ❌ Less commonly used; less stack-overflow coverage

### Option 3: Native `BigInt`

- ✅ Built-in, no dep
- ✅ Arbitrary precision
- ❌ Integer-only; needs scaling for decimals
- ❌ Division is approximate (`BigInt / BigInt` truncates)
- ❌ No floating-point support for fractional math

### Option 4: Status quo (raw `number`)

- ✅ Zero migration cost
- ❌ Hephaestus found 6 P0/P1 engines already broken
- ❌ Float drift will recur in every new engine

### Option 5: dinero.js

- ✅ Money-first API (similar to our `Money` class)
- ❌ ~25KB gzipped (2.5x Decimal.js)
- ❌ Less flexible for non-currency decimal math (e.g. interest rates, FX rates)
- ❌ Heavier migration

---

## Migration plan (Apollo's P1 task)

1. `npm i decimal.js`
2. Add `src/utils/money.ts` with the `Money<TCurrency>` class
3. Add `src/utils/format.ts` with `formatMoney` for the display layer
4. **P0/P1 engines first** (the 6 Hephaestus-flagged ones): `TaxEngine`, `SaaSMetricsEngine`, `DriverCascadeEngine`, `AllocationEngine`, `CubeEngine` (Kahan summation)
5. P2 engines next (`SpreadEngine:167` and the other `Math.round` patterns)
6. Update test snapshots
7. **Linter rule:** `no-restricted-syntax` to flag `Math.round(x * 100) / 100` outside `src/utils/`
8. **CI guard:** decimal precision assertion in test fixtures (`sum of 1M $0.01 cells = $10,000.00 exactly`)

---

## References

- **`src/utils/money.ts`** (to be created)
- **`src/utils/format.ts`** (to be created)
- **6 P0/P1 float-bug engines:** `TaxEngine.ts:65,89,116`, `SaaSMetricsEngine.ts:90-93`, `DriverCascadeEngine.ts:353-354`, `AllocationEngine.ts:84-99`, `SpreadEngine.ts:167`, `CubeEngine.ts:51-72`
- **ADR-002** — `Money` values flow through zustand stores; `partialize` for class instances
- **ADR-003** — `Money` is the value type for `Measure` values in the cube
- **ADR-006** — `Money` serialization format (string) must be migration-stable
- **ADR-010** — Web Workers for heavy decimal aggregations
- **Hephaestus audit 2026-06-12** — the use-case; this ADR is the architectural response
- **Apollo's P1 task** — `[Apollo post-push] Add decimal.js to engine layer + rewrite 6 P0/P1 float-bug engines` is the implementation
- **Mnemosyne audit 2026-06-12** — `docs/GLOSSARY.md` money terms (Gross Margin, EBITDA, NPV, IRR, Variance) all consume Decimal.js

---

<!-- /DRAFT v0.1 — Mnemosyne 2026-06-12 -->
