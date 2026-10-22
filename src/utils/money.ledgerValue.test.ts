/**
 * Q5 / DEC-051 stage 1 — the `Money` ledger value type.
 *
 * Stage 1 defines the type and proves two things, and adopts it nowhere:
 *
 *   1. Integer minor units cannot drift: `0.1 + 0.2` is `{ minor: 30 }`.
 *   2. It round-trips through the persist boundary BYTE-IDENTICALLY to the
 *      pre-Q5 numeric form. That is what makes the eventual type change
 *      reversible instead of a data migration — backups written today stay
 *      readable, and a rollback needs no conversion.
 *
 * `GLEntry.debit/credit/amount` remain `number`; nothing in the product uses
 * `Money` yet.
 */
import { describe, it, expect } from 'vitest';
import {
  asMoney,
  InvalidMoneyError,
  LEDGER_SCALE,
  MoneyCurrencyMismatchError,
  moneyCanonicalString,
  moneyCompareValues,
  moneyEqualsValue,
  moneyIsZero,
  moneyMinus,
  moneyNegate,
  moneyPlus,
  moneySum,
  moneyToAmount,
  moneyToMinor,
} from './money';
import {
  decodeMoneyGraph,
  encodeMoneyGraph,
  jsonContainsNumericMoney,
  type MoneyDecodeAs,
} from './moneySerialize';

describe('Money: exact integer minor units (Q5 stage 1)', () => {
  it('converts decimal amounts to exact minor units', () => {
    expect(moneyToMinor(asMoney(123.45))).toBe(12345);
    expect(moneyToMinor(asMoney(-0.01))).toBe(-1);
    expect(moneyToMinor(asMoney(0))).toBe(0);
    expect(moneyToMinor(asMoney('1234.5'))).toBe(123450);
    expect(LEDGER_SCALE).toBe(2);
  });

  it('refuses sub-cent precision instead of rounding it away (DEC-048)', () => {
    for (const value of [0.004, 1.005, 0.1 + 0.2]) {
      expect(() => asMoney(value)).toThrow(InvalidMoneyError);
    }
  });

  it('refuses non-finite and out-of-range input', () => {
    expect(() => asMoney(Number.NaN)).toThrow(InvalidMoneyError);
    expect(() => asMoney(Number.POSITIVE_INFINITY)).toThrow(InvalidMoneyError);
    // 1e16 exceeds the safe integer range once converted to minor units.
    expect(() => asMoney(1e16)).toThrow(InvalidMoneyError);
  });

  it('adds exactly where float addition drifts', () => {
    const drifted = 0.1 + 0.2;
    expect(drifted).not.toBe(0.3);
    expect(moneyToMinor(moneyPlus(asMoney(0.1), asMoney(0.2)))).toBe(30);
    expect(moneyToAmount(moneyPlus(asMoney(0.1), asMoney(0.2)))).toBe(0.3);
  });

  it('sums a thousand cents without drift where the float sum loses', () => {
    const each = asMoney(0.01);
    const parts = Array.from({ length: 1000 }, () => each);
    expect(moneyToMinor(moneySum(parts))).toBe(1000);
    const floatSum = Array.from({ length: 1000 }, () => 0.01).reduce((a, b) => a + b, 0);
    expect(floatSum).not.toBe(10);
    expect(moneyToAmount(moneySum(parts))).toBe(10);
  });

  it('carries currency through arithmetic and refuses to mix two', () => {
    const usd = asMoney(10, 'USD');
    expect(moneyPlus(usd, asMoney(5, 'USD')).currency).toBe('USD');
    // Absence is "scoped to its entry", so a defined currency wins.
    expect(moneyPlus(usd, asMoney(5)).currency).toBe('USD');
    expect(moneyMinus(usd, asMoney(5, 'USD')).currency).toBe('USD');
    expect(moneyNegate(usd).currency).toBe('USD');
    expect(() => moneyPlus(usd, asMoney(5, 'EUR'))).toThrow(MoneyCurrencyMismatchError);
    expect(() => moneyCompareValues(usd, asMoney(5, 'EUR'))).toThrow(MoneyCurrencyMismatchError);
  });

  it('compares, negates and detects zero exactly', () => {
    expect(moneyCompareValues(asMoney(1), asMoney(2))).toBe(-1);
    expect(moneyCompareValues(asMoney(2), asMoney(2))).toBe(0);
    expect(moneyCompareValues(asMoney(2), asMoney(1))).toBe(1);
    expect(moneyIsZero(moneyNegate(moneyNegate(asMoney(0))))).toBe(true);
    expect(moneyIsZero(asMoney(0.01))).toBe(false);
    expect(moneyEqualsValue(asMoney(1.5, 'USD'), asMoney(1.5))).toBe(true);
    expect(moneyEqualsValue(asMoney(1.5, 'USD'), asMoney(1.5, 'EUR'))).toBe(false);
  });

  it('canonicalises to the persist form, trailing zeros trimmed', () => {
    expect(moneyCanonicalString(asMoney(123.45))).toBe('123.45');
    expect(moneyCanonicalString(asMoney(123.4))).toBe('123.4');
    expect(moneyCanonicalString(asMoney(0))).toBe('0');
    expect(moneyCanonicalString(asMoney(-0.01))).toBe('-0.01');
  });
});

describe('Money: persist boundary is byte-identical (Q5 stage 1)', () => {
  it('encodes a Money value exactly as the numeric form it replaces', () => {
    const numeric = { debit: 123.45, credit: 0, netChange: -123.4, count: 7 };
    const typed = {
      debit: asMoney(123.45),
      credit: asMoney(0),
      netChange: asMoney(-123.4),
      count: 7,
    };
    expect(JSON.stringify(encodeMoneyGraph(typed))).toBe(JSON.stringify(encodeMoneyGraph(numeric)));
  });

  it('holds for a GL-shaped array of rows', () => {
    const rows = [
      { accountCode: '1000', debit: 1284.5, credit: 0, amount: 1284.5 },
      { accountCode: '4000', debit: 0, credit: 0.25, amount: -0.25 },
    ];
    const asMoneyRows = rows.map((r) => ({
      ...r,
      debit: asMoney(r.debit),
      credit: asMoney(r.credit),
      amount: asMoney(r.amount),
    }));
    expect(JSON.stringify(encodeMoneyGraph(asMoneyRows))).toBe(
      JSON.stringify(encodeMoneyGraph(rows))
    );
  });

  it('leaves no numeric money at rest (INV-009)', () => {
    const encoded = JSON.stringify(
      encodeMoneyGraph({ entries: [{ debit: asMoney(10.5), credit: asMoney(0) }] })
    );
    expect(encoded).toContain('"$d:10.5"');
    expect(jsonContainsNumericMoney(encoded)).toBe(false);
  });

  it('decodes back to exact minor units when asked for money', () => {
    const encoded = encodeMoneyGraph({ debit: asMoney(123.45) }) as { debit: string };
    const decoded = decodeMoneyGraph(encoded, { as: 'money' as MoneyDecodeAs }) as {
      debit: { minor: number };
    };
    expect(decoded.debit.minor).toBe(12345);
  });

  it('keeps the numeric decode default so untouched stores still hydrate', () => {
    const encoded = encodeMoneyGraph({ debit: asMoney(123.45) }) as { debit: string };
    expect(decodeMoneyGraph(encoded)).toEqual({ debit: 123.45 });
    expect(decodeMoneyGraph(encoded, { as: 'string' })).toEqual({ debit: '123.45' });
  });
});
