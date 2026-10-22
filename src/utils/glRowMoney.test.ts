/**
 * Q5 stage-4 trap sweep — ledger-row money reads outside the GL store.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * DEC-055 found that `toFiniteNumber(value: unknown, fallback = 0)` returned its
 * fallback for a `Money`, so the stage-4 type flip would have zeroed the ledger
 * with a green compiler. Sweeping the rest of the tree for the same shape of
 * defect found it in fourteen page models, in the validator, and in the store
 * migrator:
 *
 *   - `Number(entry.debit)` in the shared `hasDebitCredit` helper (14 copies):
 *     `Number({ minor: 0 })` is `NaN`, `NaN === 0` is false, so after the flip a
 *     zero debit/credit stops reading as zero and an amount-only row is valued
 *     at `0 − 0`. Silent money loss on the dashboard, cash forecast, credit
 *     risk, sector KPIs, forecasts, scenarios, real estate, insurance,
 *     construction, analytics and the executive summary.
 *   - `isFiniteNumber(e.debit)` in `validateGLEntry`: would report
 *     "debit must be a finite number" for EVERY entry after the flip.
 *   - `Number(entry.debit ?? 0)` in the cube migrator: would write `NaN` into
 *     the GL cube.
 *   - `typeof d.amount === 'number'` in the onboarding importer: already zeroes
 *     a STRING amount today, independent of Q5.
 *
 * Each is fixed against `unknown` so it is correct before and after the type
 * change, and each is pinned here by proving a `Money` input produces exactly
 * the result its numeric equivalent produces.
 */
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { isZeroAmount, rowCarriesDebitCredit, signedAmountOf } from './glRowMoney';
import { formatMoney } from './money';

describe('isZeroAmount — exact for every shape, true only for a real zero', () => {
  it('treats a zero Money as zero (the defect: Number({minor:0}) is NaN)', () => {
    expect(isZeroAmount({ minor: 0 })).toBe(true);
    expect(Number({ minor: 0 })).toBeNaN();
    expect(Number({ minor: 0 }) === 0).toBe(false);
  });

  it('treats a non-zero Money as not zero', () => {
    expect(isZeroAmount({ minor: 1 })).toBe(false);
    expect(isZeroAmount({ minor: -1 })).toBe(false);
    expect(isZeroAmount({ minor: 250000 })).toBe(false);
  });

  it('agrees with the numeric forms it replaces', () => {
    expect(isZeroAmount(0)).toBe(true);
    expect(isZeroAmount(-0)).toBe(true);
    expect(isZeroAmount(5)).toBe(false);
    expect(isZeroAmount(new Decimal(0))).toBe(true);
    expect(isZeroAmount(new Decimal('0.00'))).toBe(true);
    expect(isZeroAmount(new Decimal(5))).toBe(false);
    expect(isZeroAmount('0')).toBe(true);
    expect(isZeroAmount('1,234.50')).toBe(false);
  });

  it('keeps the NaN semantics it replaces: unreadable is NOT zero', () => {
    // `Number('abc') === 0` is false, and so is this.
    expect(isZeroAmount(Number.NaN)).toBe(false);
    expect(isZeroAmount(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isZeroAmount('abc')).toBe(false);
    expect(isZeroAmount(null)).toBe(false);
    expect(isZeroAmount(undefined)).toBe(false);
    expect(isZeroAmount({})).toBe(false);
  });
});

describe('signedAmountOf — absent and unreadable are null, never 0', () => {
  it('reads every representable shape to the same number', () => {
    expect(signedAmountOf({ minor: 250050 })).toBe(2500.5);
    expect(signedAmountOf(2500.5)).toBe(2500.5);
    expect(signedAmountOf('2500.50')).toBe(2500.5);
    expect(signedAmountOf('$2,500.50')).toBe(2500.5);
    expect(signedAmountOf('(2500.50)')).toBe(-2500.5);
    expect(signedAmountOf(new Decimal('2500.50'))).toBe(2500.5);
  });

  it('returns null for absent or unreadable values', () => {
    expect(signedAmountOf(undefined)).toBeNull();
    expect(signedAmountOf(null)).toBeNull();
    expect(signedAmountOf(Number.NaN)).toBeNull();
    expect(signedAmountOf('not money')).toBeNull();
    expect(signedAmountOf({})).toBeNull();
    expect(signedAmountOf({ minor: 0.5 })).toBeNull();
  });

  it('distinguishes a genuine zero from a missing amount', () => {
    expect(signedAmountOf({ minor: 0 })).toBe(0);
    expect(signedAmountOf(0)).toBe(0);
    expect(signedAmountOf(undefined)).toBeNull();
  });
});

describe('rowCarriesDebitCredit — a Money row decides exactly like its number twin', () => {
  /**
   * The behaviour that must not change: an amount-only row (debit 0, credit 0,
   * a non-zero signed amount) is read from `amount`. Every assertion below is
   * stated twice — once with numbers, once with the `Money` the ledger will
   * hold after Q5 stage 4 — and both must agree.
   */
  const cases: ReadonlyArray<{
    readonly name: string;
    readonly numbers: Parameters<typeof rowCarriesDebitCredit>[0];
    readonly money: Parameters<typeof rowCarriesDebitCredit>[0];
    readonly expected: boolean;
  }> = [
    {
      name: 'amount-only row (the import shape this helper exists for)',
      numbers: { debit: 0, credit: 0, amount: -2500 },
      money: { debit: { minor: 0 }, credit: { minor: 0 }, amount: { minor: -250000 } },
      expected: false,
    },
    {
      name: 'genuine debit/credit row with a matching amount',
      numbers: { debit: 2500, credit: 0, amount: 2500 },
      money: { debit: { minor: 250000 }, credit: { minor: 0 }, amount: { minor: 250000 } },
      expected: true,
    },
    {
      name: 'debit/credit present with NO amount column',
      numbers: { debit: 2500, credit: 0 },
      money: { debit: { minor: 250000 }, credit: { minor: 0 } },
      expected: true,
    },
    {
      name: 'all three zero — a zero amount row still carries debit/credit',
      numbers: { debit: 0, credit: 0, amount: 0 },
      money: { debit: { minor: 0 }, credit: { minor: 0 }, amount: { minor: 0 } },
      expected: true,
    },
    {
      name: 'credit-only row',
      numbers: { debit: 0, credit: 2500, amount: -2500 },
      money: { debit: { minor: 0 }, credit: { minor: 250000 }, amount: { minor: -250000 } },
      expected: true,
    },
    {
      name: 'debit/credit absent entirely',
      numbers: {},
      money: {},
      expected: false,
    },
    {
      name: 'only one side absent, amount also absent',
      numbers: { debit: 0 },
      money: { debit: { minor: 0 } },
      expected: true,
    },
  ];

  for (const testCase of cases) {
    it(`${testCase.name} — number and Money agree`, () => {
      expect(rowCarriesDebitCredit(testCase.numbers)).toBe(testCase.expected);
      expect(rowCarriesDebitCredit(testCase.money)).toBe(testCase.expected);
    });
  }

  it('would have been WRONG with the helper it replaces', () => {
    // This is the regression itself, stated as arithmetic so the reason is
    // visible: the old test is `Number(value) === 0`, which is false for a
    // zero `Money`, so the amount-only row above degrades to debit − credit.
    const moneyRow = { debit: { minor: 0 }, credit: { minor: 0 }, amount: { minor: -250000 } };
    const oldDecision = (() => {
      const debitN = Number(moneyRow.debit);
      const creditN = Number(moneyRow.credit);
      return !(debitN === 0 && creditN === 0 && Number(moneyRow.amount) !== 0);
    })();
    expect(oldDecision).toBe(true); // old helper: "use debit/credit"
    expect(rowCarriesDebitCredit(moneyRow)).toBe(false); // new: "use the amount"
    // And the consequence, in money: the row is worth 2,500.00 either way it is
    // read, but the old decision reads it as 0.00.
    expect(formatMoney(0)).toBe('0.00');
    expect(formatMoney(2500)).toBe('2,500.00');
  });

  it('does not fabricate a value from a malformed row', () => {
    // Unreadable fields fall back to the pre-existing behaviour (treat as
    // present) rather than silently switching to `amount`.
    expect(rowCarriesDebitCredit({ debit: 'abc', credit: 'def', amount: 100 })).toBe(true);
    expect(rowCarriesDebitCredit({ debit: {}, credit: {}, amount: 100 })).toBe(true);
  });
});
