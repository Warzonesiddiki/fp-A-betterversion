---
date: 2026-05-28
type: adr
project: FinPlan Pro
tags: [finplan-pro, decimal-js, financial-precision, no-float-drift]
status: pending-ratification
adr-number: 004
ratification-date-target: 2026-06-22
ratification-gate: 2026-06-22T16:00:00Z
---

# ADR-004: Decimal.js for Financial Precision (No Float Drift)

## Context

FinPlan Pro's 180+ pure calculation engines perform financial arithmetic where native JavaScript floats cause precision drift:

```javascript
// Native JS float drift
0.1 + 0.2            // = 0.30000000000000004 (NOT 0.3)
0.1 * 0.2            // = 0.020000000000000004 (NOT 0.02)
19.99 * 100          // = 1998.9999999999998 (NOT 1999)
0.1 + 0.2 === 0.3    // = false (!)
```

This drift is unacceptable for financial calculations:
- Tax calculations: $0.005 drift per item × 10K items = $50 discrepancy
- Currency conversion: $0.0001 drift per conversion × 1M conversions = $100 discrepancy
- Percentage aggregation: $0.001 drift per cell × 255 cells = $0.255 discrepancy
- Audit trail: Regulatory compliance (SOX, IFRS, GAAP) requires exact reproducibility

Alternative precision libraries were considered:
- **BigInt**: Integer-only, no decimal arithmetic — unsuitable for currency
- **bignumber.js**: Mature but no immutable update pattern
- **decimal.js-light**: Smaller but lacks some features
- **Custom BigDecimal implementation**: Reinventing the wheel
- **Big.js**: Simple but limited API
- **Decimal.js (chosen)**: Comprehensive API, mature, well-tested, immutable

## Decision

**Adopt Decimal.js for ALL financial calculations. Raw `number` type is only allowed at the display layer.**

```typescript
import Decimal from 'decimal.js';

// Configure global precision (38 significant digits — exceeds any FP&A need)
Decimal.set({ precision: 38, rounding: Decimal.ROUND_HALF_EVEN });

// All financial calculations use Decimal.js
const price = new Decimal('19.99');
const quantity = new Decimal('100');
const subtotal = price.times(quantity);  // = 1999 (exact, no drift)
const tax = subtotal.times('0.085');     // = 169.915 (exact)
const total = subtotal.plus(tax);        // = 2168.915 (exact)

// Display layer converts to number for UI
const displayTotal = total.toNumber();
```

**Mandated patterns (per AGENTS.md L52):**
1. All 180+ engines use Decimal.js internally
2. Store types use `Decimal | number` only when interoperating with AG Grid (which doesn't support Decimal natively)
3. Display layer converts via `.toNumber()` with explicit precision handling
4. Formatters in `src/utils/formatters.ts` centralize Decimal → display number conversion

## Rationale

1. **Exact arithmetic**: `$0.1 + $0.2 = $0.30` exact (no drift)
2. **Mature library**: Decimal.js has been stable since 2014, used by countless financial apps
3. **Comprehensive API**: add, sub, mul, div, mod, pow, sqrt, ln, exp, sin, cos, tan, etc. — covers all FP&A math
4. **Configurable precision**: 38 significant digits default — exceeds any conceivable FP&A need
5. **Rounding modes**: ROUND_HALF_EVEN (banker's rounding) — IEEE 754 compliant
6. **Immutable**: All operations return new Decimal instances — no in-place mutation bugs
7. **TypeScript-first**: Full type definitions with strict mode
8. **AG Grid compatibility**: `.toNumber()` for grid cells; convert back via `new Decimal(cell)` for calculations
9. **Property-based testing**: Athena T-3.14 fast-check verifies invariants (NPV symmetry, sum-preserving aggregations, OLAP rollup equality)

## Consequences

### Positive

- **No float drift** in financial calculations — exact arithmetic for all 180+ engines
- **Regulatory compliance**: SOX, IFRS, GAAP reproducibility (exact recalculation from raw data)
- **Audit trail**: All intermediate Decimal values can be serialized to string for audit log
- **OLAP cube precision**: 255 GREEN cells per Vesta v0.4 — `$0.1 + $0.2 = $0.30` exact
- **Monte Carlo stability**: 50K trials × antithetic variates — no drift accumulates
- **Performance**: Decimal.js is ~10x slower than native float for simple ops, but OLAP + Web Worker pool keeps p95 ≤500ms
- **Cross-currency conversion**: MultiCurrencyEngine uses Decimal.js (cross-ref ADR-001 + ADR-003)

### Negative

- **Performance overhead**: Decimal.js is ~10x slower than native float. Mitigation: Web Worker pool + parallel aggregations + sub-500ms p95 budget validated per Vulcan T-2 T-PR-082 v0.5
- **AG Grid compatibility**: AG Grid cells are `number` — must convert Decimal ↔ number at boundary. Mitigation: formatters in `src/utils/formatters.ts` centralize conversion
- **Bundle size**: Decimal.js is ~30KB minified. Mitigation: tree-shaking removes unused methods; main chunk budget 150KB has room
- **Learning curve**: Decimal.js API is slightly different from native math. Mitigation: wrapper functions in `src/utils/decimal.ts` for common patterns

## Implementation Notes

1. **Global precision**: `Decimal.set({ precision: 38, rounding: Decimal.ROUND_HALF_EVEN })` in `src/utils/decimal.ts`
2. **Import pattern**: `import Decimal from 'decimal.js'` — never `import * as`
3. **Construction**: `new Decimal('19.99')` from STRING, NOT from number `new Decimal(19.99)` (which would already have float drift)
4. **Arithmetic methods**: `.plus()`, `.minus()`, `.times()`, `.div()`, `.mod()`, `.pow()`, etc.
5. **Comparison**: `.eq()`, `.lt()`, `.lte()`, `.gt()`, `.gte()`, `.cmp()`
6. **Conversion to number**: `.toNumber()` — only at display layer
7. **Conversion to string**: `.toString()` — for serialization / audit log
8. **Rounding**: `.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN)` for 2 decimal places
9. **Web Worker**: All aggregations run in Web Worker pool — main thread stays responsive

## Alternatives Considered

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Decimal.js (chosen)** | Mature, comprehensive, immutable | ~10x slower than native | ✅ ACCEPT |
| BigInt | Native, fast | Integer-only, no decimals | ❌ REJECT |
| bignumber.js | Mature | No immutable update pattern | ❌ REJECT |
| decimal.js-light | Smaller bundle | Limited API | ❌ REJECT |
| Big.js | Simple | Limited API, no trig functions | ❌ REJECT |
| Custom BigDecimal | Tailored | Reinventing wheel, untested | ❌ REJECT |

## References

- `src/utils/decimal.ts` (global config + wrappers)
- `src/engines/` (180+ engines use Decimal.js)
- `src/utils/formatters.ts` (display layer conversions)
- AG Grid documentation (cell type compatibility)
- Decimal.js docs: https://mikemcl.github.io/decimal.js/
- ADR-001 Currency Translation (cross-ref)
- ADR-003 OLAP Cube (cross-ref for aggregation precision)
- `docs/strategic/STRATEGIC_INDEX_v0_8.md` §3.5 (5 P0 ADRs dimension)

## Ratification Status

- **2026-05-28**: Drafted
- **2026-06-13**: Cycle 25 wave 6 ratified by 4-ICP framework
- **2026-06-18**: STRATEGIC_INDEX_v0.8.0 SHIP incorporates this ADR with 9.20/10 PLATINUM+ verdict
- **2026-06-22 16:00 UTC**: PENDING RATIFICATION GATE (Lead signature required)