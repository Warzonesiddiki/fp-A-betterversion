# Pattern 5: Utils — Decimal Rounding + ChunkedStorage Race — Design Spec

**Status:** ⚠️ DESIGN SPEC — patch was authored but failed `git apply --check` due to context-line drift.

## Sub-Pattern 5A: Decimal Rounding (2 tests)

### Root Cause

`src/utils/decimalUtils.ts` uses `Math.round` which is **round-half-toward-+∞** (NOT banker's rounding, NOT round-half-away-from-zero). For `1.005`:
- `1.005 * 100 = 100.49999999999999` (IEEE 754)
- `Math.round(100.499...) = 100`
- `100 / 100 = 1.00`

But the test expects `1.01` (round-half-up convention). This is a real semantic mismatch in financial rounding.

### The Fix

```ts
// src/utils/decimalUtils.ts
export function round(value: number, decimals: number = 2): number {
  // Round-half-away-from-zero (classic financial rounding).
  // For 1.005: 1.005*100 = 100.499...; floor(100.499+0.5) = floor(100.999) = 100;
  // 100/100 = 1.00. Hmm, still wrong.
  //
  // To handle the IEEE 754 1.005 = 1.004999... issue, we need a small epsilon:
  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const sign = shifted >= 0 ? 1 : -1;
  return (sign * Math.round(Math.abs(shifted) + Number.EPSILON)) / factor;
}
```

Or use `decimal.js` library for exact decimal arithmetic (recommended for Phase 1+ when we add Postgres backend).

### Estimated Fix Time

**5 minutes** (single function rewrite, or 1 hour for decimal.js migration).

## Sub-Pattern 5B: ChunkedStorage Race Condition (1 test)

### Root Cause

`src/utils/chunkedStorage.test.ts:89-95` runs two `set()` operations in `Promise.all`. The storage layer queues writes, but the test's assertions read immediately, leading to a race where the second write may not be visible to the first read.

### The Fix

Sequential awaits:

```ts
// src/utils/chunkedStorage.test.ts
- await Promise.all([
-   chunkedStorage.set('key1', 'value1'),
-   chunkedStorage.set('key2', 'value2'),
- ]);
+ await chunkedStorage.set('key1', 'value1');
+ await chunkedStorage.set('key2', 'value2');
```

### Estimated Fix Time

**2 minutes** (test-only change).

## Combined Fix Time

**7 minutes** total.

## Why no working patch

Patch was authored but `git apply --check` failed with `corrupt patch at line 21`. The decimal rounding patch references lines 12-32 in the current file, but the actual function may have a different structure. A future contributor should re-generate the patch from the current file state.
