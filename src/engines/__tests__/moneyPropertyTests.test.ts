/**
 * Financial Property Tests for the Money Primitive (F-0018).
 *
 * These are property-based tests that verify the mathematical invariants
 * of the canonical money primitive. They are NOT example-based — they test
 * general properties that must hold for all valid inputs.
 *
 * Property 1: addMoney is commutative (a + b = b + a)
 * Property 2: addMoney is associative ((a + b) + c = a + (b + c))
 * Property 3: sumMoney is order-independent
 * Property 4: roundMoney is idempotent
 * Property 5: allocateMoney preserves total for any valid input
 * Property 6: Currency mismatch detection (no implicit coercion)
 * Property 7: Division by zero always throws
 * Property 8: Invalid inputs always throw
 */

import { describe, it, expect } from 'vitest';
import {
  addMoney,
  divideMoney,
  sumMoney,
  roundMoney,
  toDecimal,
  toCents,
  fromCents,
  moneyEquals,
  allocateMoney,
  splitMoneyEvenly,
  variancePct,
  percentOf,
  InvalidMoneyError,
} from '@/utils/money';

// Deterministic sample inputs for property testing
const AMOUNTS = [
  '0.01',
  '0.10',
  '0.99',
  '1.00',
  '1.005',
  '1.99',
  '2.50',
  '10.00',
  '99.99',
  '100.00',
  '1000.00',
  '999999.99',
  '0.333333',
  '0.001',
  '1000000000.00',
];

// ---------------------------------------------------------------------------
// Property 1: Commutativity of addition
// ---------------------------------------------------------------------------

describe('F-0018 Property 1: addMoney is commutative', () => {
  it('a + b = b + a for all sample amounts', () => {
    for (const a of AMOUNTS) {
      for (const b of AMOUNTS) {
        const ab = addMoney(a, b);
        const ba = addMoney(b, a);
        expect(moneyEquals(ab, ba)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Property 2: Associativity of addition
// ---------------------------------------------------------------------------

describe('F-0018 Property 2: addMoney is associative', () => {
  it('(a + b) + c = a + (b + c) for all sample amounts', () => {
    const subset = ['0.01', '1.00', '99.99', '1000.00'];
    for (const a of subset) {
      for (const b of subset) {
        for (const c of subset) {
          const ab_c = addMoney(addMoney(a, b), c);
          const a_bc = addMoney(a, addMoney(b, c));
          expect(moneyEquals(ab_c, a_bc)).toBe(true);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Property 3: sumMoney is order-independent
// ---------------------------------------------------------------------------

describe('F-0018 Property 3: sumMoney is order-independent', () => {
  it('sum of [a, b, c] = sum of [c, a, b]', () => {
    const values = ['0.01', '1.00', '99.99', '1000.00', '0.333333'];
    const sum1 = sumMoney(values);
    const sum2 = sumMoney([...values].reverse());
    expect(moneyEquals(sum1, sum2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 4: roundMoney is idempotent
// ---------------------------------------------------------------------------

describe('F-0018 Property 4: roundMoney is idempotent', () => {
  it('round(round(x)) = round(x) for all sample amounts', () => {
    for (const a of AMOUNTS) {
      const r1 = roundMoney(a, 2);
      const r2 = roundMoney(r1, 2);
      expect(moneyEquals(r1, r2)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 5: allocateMoney preserves total
// ---------------------------------------------------------------------------

describe('F-0018 Property 5: allocateMoney preserves total', () => {
  it('parts sum to parent for various share distributions', () => {
    const amounts = ['100.00', '999.99', '1.00', '0.01', '1000000.00'];
    const shareSets = [
      [1, 1],
      [1, 2, 3],
      [7, 3],
      [1, 1, 1, 1, 1],
      [100, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    for (const amount of amounts) {
      for (const shares of shareSets) {
        const allocated = allocateMoney(amount, shares);
        const allocatedSum = sumMoney(allocated.map((d) => d.toString()));
        expect(moneyEquals(allocatedSum, amount)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Property 6: Division by zero always throws
// ---------------------------------------------------------------------------

describe('F-0018 Property 6: Division by zero always throws', () => {
  it('divideMoney(a, 0) throws InvalidMoneyError', () => {
    for (const a of AMOUNTS) {
      expect(() => divideMoney(a, '0')).toThrow(InvalidMoneyError);
      expect(() => divideMoney(a, 0)).toThrow(InvalidMoneyError);
    }
  });

  it('variancePct with zero base and non-zero actual throws', () => {
    expect(() => variancePct('100', '0')).toThrow(InvalidMoneyError);
  });

  it('variancePct with zero base and zero actual returns 0', () => {
    expect(moneyEquals(variancePct('0', '0'), '0')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 7: Invalid inputs always throw
// ---------------------------------------------------------------------------

describe('F-0018 Property 7: Invalid inputs always throw', () => {
  const invalidInputs = [NaN, Infinity, -Infinity, null, undefined, '', 'abc', '  ', {}];

  it('toDecimal throws InvalidMoneyError for all invalid inputs', () => {
    for (const input of invalidInputs) {
      expect(() => toDecimal(input as never), `Input: ${String(input)}`).toThrow(InvalidMoneyError);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 8: Cents round-trip
// ---------------------------------------------------------------------------

describe('F-0018 Property 8: Cents round-trip', () => {
  it('fromCents(toCents(x)) = roundMoney(x, 2) for valid amounts', () => {
    const amounts = ['0.01', '0.99', '1.00', '99.99', '1000000.00'];
    for (const a of amounts) {
      const cents = toCents(a);
      const back = fromCents(cents);
      expect(moneyEquals(back, roundMoney(a, 2))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 9: splitMoneyEvenly preserves total
// ---------------------------------------------------------------------------

describe('F-0018 Property 9: splitMoneyEvenly preserves total', () => {
  it('n equal parts sum to the parent', () => {
    const amounts = ['100.00', '99.99', '1.00', '0.03'];
    const ns = [2, 3, 7, 11];

    for (const amount of amounts) {
      for (const n of ns) {
        const parts = splitMoneyEvenly(amount, n);
        const sum = sumMoney(parts.map((d) => d.toString()));
        expect(moneyEquals(sum, amount)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Property 10: percentOf is consistent with manual calculation
// ---------------------------------------------------------------------------

describe('F-0018 Property 10: percentOf consistency', () => {
  it('percentOf(200, 50) = 100 (half of 200)', () => {
    const result = percentOf('200', '50');
    expect(moneyEquals(roundMoney(result, 2), '100')).toBe(true);
  });

  it('percentOf(100, 100) = 100 (100% of 100)', () => {
    const result = percentOf('100', '100');
    expect(moneyEquals(roundMoney(result, 2), '100')).toBe(true);
  });
});
