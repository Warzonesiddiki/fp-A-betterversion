import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  addMoney,
  allocateMoney,
  compareMoney,
  divideMoney,
  formatMoney,
  fromCents,
  InvalidMoneyError,
  moneyEquals,
  multiplyMoney,
  percentOf,
  roundMoney,
  roundTo,
  splitMoneyEvenly,
  subtractMoney,
  sumMoney,
  toCents,
  toDecimal,
  variancePct,
} from './money';

/**
 * F-0006: canonical money primitive — known-answer vectors KAV-07 and
 * KAV-08, plus float-trap regressions.
 */

describe('KAV-08: rounding mode (half-up, decimal-literal semantics)', () => {
  it('round(1.005, 2) === 1.01 (the float trap: 1.005 as IEEE-754 is 1.00499…)', () => {
    // Naive Math.round(1.005 * 100) / 100 === 1 (WRONG). Decimal-literal
    // coercion via shortest round-trip string gives the true decimal 1.005.
    expect(Math.round(1.005 * 100) / 100).not.toBe(1.01); // documents the trap
    expect(roundTo(1.005, 2)).toBe(1.01);
  });

  it('round(2.675, 2) === 2.68', () => {
    // The float trap here shows via toFixed: 2.675 as IEEE-754 is
    // 2.674999…, so (2.675).toFixed(2) === '2.67' (WRONG for half-up).
    expect((2.675).toFixed(2)).toBe('2.67'); // documents the trap
    expect(roundTo(2.675, 2)).toBe(2.68);
  });

  it('string inputs share the same semantics', () => {
    expect(roundMoney('1.005', 2).toString()).toBe('1.01');
    expect(roundMoney('2.675', 2).toString()).toBe('2.68');
    expect(roundMoney('0.125', 2).toString()).toBe('0.13');
  });
});

describe('KAV-07: money allocation exactness', () => {
  it('100.00 allocated across 3 cost centers sums exactly to 100.00', () => {
    const parts = splitMoneyEvenly('100.00', 3);
    expect(parts.map((p) => p.toString())).toEqual(['33.34', '33.33', '33.33']);
    const sum = sumMoney(parts);
    expect(sum.toString()).toBe('100');
  });

  it('residual assignment is deterministic (earliest shares first)', () => {
    const a = splitMoneyEvenly('100.00', 3);
    const b = splitMoneyEvenly('100.00', 3);
    expect(a.map(String)).toEqual(b.map(String));
  });

  it('weighted allocation sums exactly to the parent', () => {
    const parts = allocateMoney('1000.00', [1, 1, 1, 1, 1, 1, 1]); // 7 ways
    expect(sumMoney(parts).toString()).toBe('1000');
    expect(sumMoney(allocateMoney('99.99', [2, 3, 5])).toString()).toBe('99.99');
    expect(sumMoney(allocateMoney('0.05', [1, 1])).toString()).toBe('0.05');
  });

  it('rejects negative amounts, negative weights, and empty shares', () => {
    expect(() => allocateMoney('-5', [1])).toThrow(InvalidMoneyError);
    expect(() => allocateMoney('100', [-1, 2])).toThrow(InvalidMoneyError);
    expect(() => allocateMoney('100', [])).toThrow(InvalidMoneyError);
    expect(() => allocateMoney('100', [0, 0])).toThrow(InvalidMoneyError);
    expect(() => splitMoneyEvenly('100', 0)).toThrow(InvalidMoneyError);
  });
});

describe('exact arithmetic (no float drift)', () => {
  it('0.1 + 0.2 === 0.3 exactly', () => {
    expect(0.1 + 0.2).not.toBe(0.3); // documents IEEE-754 behavior
    expect(moneyEquals(addMoney(0.1, 0.2), 0.3)).toBe(true);
  });

  it('sums a long series without accumulating error', () => {
    const values = Array.from({ length: 1000 }, () => '0.01');
    expect(sumMoney(values).toString()).toBe('10');
  });

  it('multiply/divide are exact and divide-by-zero throws', () => {
    expect(multiplyMoney('19.99', 3).toString()).toBe('59.97');
    expect(divideMoney('100', 8).toString()).toBe('12.5');
    expect(() => divideMoney('100', 0)).toThrow(InvalidMoneyError);
  });

  it('subtract and compare respect decimal exactness', () => {
    expect(subtractMoney('100.10', '0.10').toString()).toBe('100');
    expect(compareMoney('1.00', '1')).toBe(0);
    expect(compareMoney('1.01', '1.001')).toBe(1);
    expect(compareMoney('1.0', '1.01')).toBe(-1);
  });
});

describe('cents conversion', () => {
  it('toCents rounds half-up to integer cents', () => {
    expect(toCents('1.005')).toBe(101);
    expect(toCents('19.99')).toBe(1999);
    expect(toCents(0.01)).toBe(1);
  });

  it('fromCents reconstructs exact amounts', () => {
    expect(fromCents(1999).toString()).toBe('19.99');
    expect(() => fromCents(1.5)).toThrow(InvalidMoneyError);
    expect(() => fromCents(Number.MAX_SAFE_INTEGER + 1)).toThrow(InvalidMoneyError);
  });
});

describe('input rejection (never a silent 0)', () => {
  it.each([NaN, Infinity, -Infinity])('rejects %s', (bad) => {
    expect(() => toDecimal(bad)).toThrow(InvalidMoneyError);
    expect(() => roundTo(bad, 2)).toThrow(InvalidMoneyError);
    expect(() => addMoney(bad, 1)).toThrow(InvalidMoneyError);
  });

  it.each([null, undefined, '', '   ', 'not-a-number', {}, []])('rejects %j', (bad) => {
    expect(() => toDecimal(bad as unknown as number)).toThrow(InvalidMoneyError);
  });

  it('rejects non-finite numeric strings', () => {
    expect(() => toDecimal('Infinity')).toThrow(InvalidMoneyError);
  });
});

describe('percent and variance', () => {
  it('percentOf computes exact percentages', () => {
    expect(percentOf('200', '12.5').toString()).toBe('25');
  });

  it('variancePct computes (actual-base)/base*100 exactly', () => {
    expect(variancePct('110', '100').toString()).toBe('10');
    expect(variancePct('90', '100').toString()).toBe('-10');
    expect(variancePct('0', '0').toString()).toBe('0');
    expect(() => variancePct('5', '0')).toThrow(InvalidMoneyError);
  });
});

describe('formatMoney (display only)', () => {
  it('formats with currency symbol and 2dp', () => {
    expect(formatMoney('1234.5', { currency: 'USD' })).toBe('$1,234.50');
  });

  it('formats plain numbers with fixed places', () => {
    expect(formatMoney('1234.567', { places: 2 })).toBe('1,234.57');
  });
});

describe('Decimal passthrough', () => {
  it('accepts Decimal instances and rejects non-finite Decimals', () => {
    expect(toDecimal(new Decimal('1.23')).toString()).toBe('1.23');
    expect(() => toDecimal(new Decimal(NaN))).toThrow(InvalidMoneyError);
  });
});

/**
 * Property/fuzz proof — self-contained (no fast-check dependency).
 *
 * The hand-picked vectors above cover specific cases; this proves the
 * foundational invariant — Σ allocations === original, to the cent — across
 * thousands of randomized inputs. RevRecEngine and LoanAmortizationEngine both
 * rely on allocateMoney never stranding a penny, so this is the load-bearing
 * correctness property of the money migration.
 */
describe('property/fuzz: allocateMoney sum-preservation', () => {
  // Deterministic LCG — any failure is reproducible from the seed.
  let seed = 0x0badf00d;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  it('allocations always sum exactly to the original (zero penny drift) over 5000 random inputs', () => {
    const RUNS = 5000;
    for (let i = 0; i < RUNS; i++) {
      const amount = Math.floor(rand() * 1_000_000_000); // $0 .. ~$1e9, integer (cents-exact)
      const n = 1 + Math.floor(rand() * 12); // 1..12 shares
      const shares = Array.from({ length: n }, () => Math.floor(rand() * 100)); // weights 0..99

      // allocateMoney's CONTRACT rejects all-zero weights on a non-zero amount;
      // that is a usage error, not an invariant failure, so it is out of scope.
      if (amount > 0 && shares.every((w) => w === 0)) continue;

      const parts = allocateMoney(amount, shares);
      const reconstructed = sumMoney(parts);
      const whole = toDecimal(amount);

      // INVARIANT 1: the parts reconcile to the original, to the cent.
      expect(moneyEquals(reconstructed, amount)).toBe(true);
      // INVARIANT 2: every part is a non-negative slice, none larger than the whole.
      for (const p of parts) {
        expect(p.gte(0)).toBe(true);
        expect(p.lte(whole)).toBe(true);
      }
    }
  });
});
