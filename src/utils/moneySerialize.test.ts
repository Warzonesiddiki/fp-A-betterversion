import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { fromCents, moneyEquals, toDecimal } from './money';
import {
  MONEY_TAG,
  canonicalDecimalString,
  decodeMoneyGraph,
  decodeMoneyValue,
  encodeMoneyGraph,
  encodeMoneyValue,
  isEncodedMoney,
  isMoneyKey,
  jsonContainsNumericMoney,
} from './moneySerialize';

describe('canonicalDecimalString', () => {
  it('never uses exponential form', () => {
    expect(canonicalDecimalString('0.0000001')).toBe('0.0000001');
    expect(canonicalDecimalString('1000000000000')).toBe('1000000000000');
  });

  it('round-trips Decimal literals that IEEE-754 cannot represent', () => {
    const d = toDecimal('1.005');
    const encoded = canonicalDecimalString(d);
    expect(encoded).toBe('1.005');
    expect(moneyEquals(toDecimal(encoded), d)).toBe(true);
  });

  it('treats 0 as "0"', () => {
    expect(canonicalDecimalString(0)).toBe('0');
    expect(canonicalDecimalString('0.0')).toBe('0');
  });
});

describe('tagged money values', () => {
  it('encode / decode is lossless for a canonical string', () => {
    const tagged = encodeMoneyValue('10.10');
    expect(tagged.startsWith(MONEY_TAG)).toBe(true);
    expect(isEncodedMoney(tagged)).toBe(true);
    expect(moneyEquals(toDecimal(decodeMoneyValue(tagged)), toDecimal('10.10'))).toBe(true);
  });

  it('rejects untagged strings', () => {
    expect(isEncodedMoney('10.10')).toBe(false);
    expect(() => decodeMoneyValue('10.10')).toThrow(/Not an encoded money value/);
  });
});

describe('encodeMoneyGraph / decodeMoneyGraph', () => {
  it('tags money keys and leaves counts alone', () => {
    const input = {
      entries: [
        { id: 'e1', debit: 100.5, credit: 0, accountCode: '1000' },
        { id: 'e2', debit: 0, credit: 100.5, accountCode: '3000' },
      ],
      version: 1,
      entryCount: 2,
    };
    const encoded = encodeMoneyGraph(input) as {
      entries: Array<{ debit: string; credit: string; id: string }>;
      version: number;
      entryCount: number;
    };
    expect(encoded.version).toBe(1);
    expect(encoded.entryCount).toBe(2);
    expect(encoded.entries[0]!.debit).toBe(`${MONEY_TAG}100.5`);
    expect(encoded.entries[0]!.credit).toBe(`${MONEY_TAG}0`);
    expect(jsonContainsNumericMoney(JSON.stringify(encoded))).toBe(false);

    const asString = decodeMoneyGraph(encoded, { as: 'string' }) as {
      entries: Array<{ debit: string; credit: string }>;
    };
    expect(asString.entries[0]!.debit).toBe('100.5');
    expect(asString.entries[1]!.credit).toBe('100.5');
  });

  it('INV-009: persisted JSON of a GL-shaped payload has no numeric money', () => {
    const payload = {
      state: {
        entries: [{ debit: '1.005', credit: '0', amount: '1.005', netChange: '1.005' }],
      },
      version: 1,
    };
    const encoded = encodeMoneyGraph(payload);
    const serialized = JSON.stringify(encoded);
    expect(jsonContainsNumericMoney(serialized)).toBe(false);
    expect(serialized).toContain(MONEY_TAG);
    expect(serialized).not.toMatch(/"debit":1(\.005)?([,}])/);
  });

  it('decode as number is a compatibility round-trip for cent-exact values', () => {
    const input = { debit: 10.25, credit: 3.75 };
    const roundTripped = decodeMoneyGraph(encodeMoneyGraph(input), { as: 'number' }) as {
      debit: number;
      credit: number;
    };
    expect(roundTripped.debit).toBe(10.25);
    expect(roundTripped.credit).toBe(3.75);
  });
});

describe('isMoneyKey', () => {
  it('accepts qualified currency field names', () => {
    expect(isMoneyKey('debit')).toBe(true);
    expect(isMoneyKey('netChange')).toBe(true);
    expect(isMoneyKey('total_amount')).toBe(true);
  });

  it('rejects counts, ids, and ambiguous generics', () => {
    expect(isMoneyKey('id')).toBe(false);
    expect(isMoneyKey('version')).toBe(false);
    expect(isMoneyKey('entryCount')).toBe(false);
    expect(isMoneyKey('value')).toBe(false);
    expect(isMoneyKey('total')).toBe(false);
    expect(isMoneyKey('actual')).toBe(false);
    expect(isMoneyKey('rate')).toBe(false);
  });
});

describe('W0.8.2 property: persist → reload is bit-identical for 10k random decimals', () => {
  it('cent-precision amounts survive encode/decode as canonical strings', () => {
    const N = 10_000;
    for (let i = 0; i < N; i++) {
      // Deterministic LCG in a safe-integer cent range (±$500,000).
      const cents = (((i * 1_103_515_245 + 12_345) >>> 0) % 100_000_000) - 50_000_000;
      const original = fromCents(cents);
      const tagged = encodeMoneyValue(original);
      const recovered = toDecimal(decodeMoneyValue(tagged));
      if (!moneyEquals(original, recovered)) {
        throw new Error(
          `round-trip mismatch at i=${i} cents=${cents}: ${original.toFixed()} vs ${recovered.toFixed()}`
        );
      }
    }
  });

  it('non-cent Decimal literals (3–10 places) are bit-identical', () => {
    const fixtures = [
      '0.001',
      '0.0001',
      '1.005',
      '2.5',
      '9.999',
      '123456789.1234567890',
      '-0.01',
      '-17.125',
    ];
    for (const literal of fixtures) {
      const original = toDecimal(literal);
      const recovered = toDecimal(decodeMoneyValue(encodeMoneyValue(original)));
      expect(moneyEquals(original, recovered)).toBe(true);
      expect(recovered.equals(new Decimal(literal))).toBe(true);
    }
  });
});
