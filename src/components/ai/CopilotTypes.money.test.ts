/**
 * GAP-1 (F-0006) known-answer tests for the AI copilot alert layer's money
 * migration (2026-08-04, post-PR-#29 session).
 *
 * `generateAlerts` aggregates GL debit/credit amounts (revenue/expense
 * totals) and the alerts tab renders those totals as compact "$Nk" figures.
 * Both paths previously used raw IEEE-754 float `reduce +`, `-`, `*`, and
 * `.toFixed(0)` — and they drive alert LOGIC (which alerts fire, which
 * entries are flagged), not just display. Each fixed input asserts the exact
 * result with `toBe`; the pre-migration IEEE-754 behavior is recorded inline.
 *
 * Falsification record: with the migrated sources stashed (old float code),
 * 6 of these 8 tests FAIL (both survivors are positive controls); restored,
 * 8/8 pass.
 */

import { describe, expect, it } from 'vitest';
import { generateAlerts, compactThousandsMoney } from './CopilotTypes';
import type { GLState } from '@/types';
import type { GLEntry } from '@/types';
import { sumMoney } from '@/utils/money';

function createEntry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: 'entry-id',
    accountId: 'acc1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-01',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

function glWith(entries: GLEntry[]): GLState {
  return { entries } as unknown as GLState;
}

describe('generateAlerts — money known answers (GAP-1 / F-0006)', () => {
  it('revenue total is exact, not 1.0000000000000002-ish drift', () => {
    // Float reduce of 0.1 + 0.2 + 0.3 + 0.4 returns 1.0000000000000002 for
    // some orderings and 0.9999999999999999 for others; the money primitive
    // returns exactly 1. The expense-exceeds guard must never fire when
    // revenue and expense are equal at the cent.
    const gl = glWith([
      createEntry({ id: '1', credit: 0.1 }),
      createEntry({ id: '2', credit: 0.2 }),
      createEntry({ id: '3', credit: 0.3 }),
      createEntry({ id: '4', credit: 0.4 }),
      createEntry({ id: '5', debit: 0.97 }),
    ]);

    const alerts = generateAlerts(gl, undefined, 0.1);

    expect(alerts.some((a) => a.id === 'expense-exceeds')).toBe(false);
    // Control: the large-entries alert still fires on the true positive.
    expect(alerts.some((a) => a.id === 'large-entries')).toBe(false);
  });

  it('does NOT raise expense-exceeds when revenue and expenses are cent-equal (old float: fired)', () => {
    // Old float: revenue = 0.1 + 0.2 = 0.30000000000000004, expense = 0.3,
    // so `totalExpense > totalRevenue` was false-positive-safe ONLY by luck;
    // the mirrored case (credits [0.3], debits [0.1, 0.2]) FIRED the alert:
    // 0.30000000000000004 > 0.3 === true on a cent-equal book.
    const gl = glWith([
      createEntry({ id: '1', credit: 0.3 }),
      createEntry({ id: '2', debit: 0.1 }),
      createEntry({ id: '3', debit: 0.2 }),
    ]);

    const alerts = generateAlerts(gl, undefined, 0.1);

    // Old code: expense-exceeds present (0.30000000000000004 > 0.3).
    expect(alerts.some((a) => a.id === 'expense-exceeds')).toBe(false);
    expect(alerts.some((a) => a.id === 'all-clear')).toBe(true);
  });

  it('excludes an expense sitting exactly AT the threshold (old float: 0.115 > 0.11499999999999999 fired)', () => {
    // Revenue = 1.15, threshold = 0.1 → limit exactly 0.115. The alert is
    // for expenses that EXCEED the limit. Old float: 1.15 * 0.1 =
    // 0.11499999999999999, so the boundary expense 0.115 (exactly 10%, not
    // exceeding) was falsely FLAGGED. Decimal comparison excludes it.
    const gl = glWith([
      createEntry({ id: '1', credit: 1.15 }),
      createEntry({ id: '2', debit: 0.115, amount: 0.115 }),
    ]);

    const alerts = generateAlerts(gl, undefined, 0.1);

    // Old code: large-entries alert present (value 1).
    expect(alerts.some((a) => a.id === 'large-entries')).toBe(false);
  });

  it('computes the net value exactly and displays the K-boundary tie half-up', () => {
    // Net exactly −500 → −0.5K, the rounding tie. Old display text:
    // `Net: $-0K — action needed` — Math.round semantics on the negative
    // half rounded toward +infinity, erasing the loss. Half-up (away from
    // zero) gives −1K. The value payload is exact decimal, cent-rounded.
    const gl = glWith([
      createEntry({ id: '1', credit: 4900 }),
      createEntry({ id: '2', debit: 5400 }),
      createEntry({ id: '3', debit: 0.1 }),
      createEntry({ id: '4', debit: 0.2 }),
    ]);

    const alerts = generateAlerts(gl, undefined, 0.1);
    const expenseAlert = alerts.find((a) => a.id === 'expense-exceeds');

    expect(expenseAlert).toBeDefined();
    // 5400 + 0.1 + 0.2 = exactly 5400.3 (float reduce order-dependent drift);
    // net = 4900 − 5400.3 = exactly −500.3.
    expect(expenseAlert?.value).toBe(-500.3);
    expect(expenseAlert?.detail).toBe('Net: $-1K — action needed');
  });

  it('excludes a second boundary case the old float product mis-flagged (0.057 > 0.056999999999999995)', () => {
    // Revenue = 0.57, threshold = 0.1 → limit exactly 0.057. Old float:
    // 0.57 * 0.1 = 0.056999999999999995, so the boundary expense 0.057 was
    // falsely FLAGGED as exceeding the limit. Decimal excludes it.
    const gl = glWith([
      createEntry({ id: '1', credit: 0.57 }),
      createEntry({ id: '2', debit: 0.057, amount: 0.057 }),
    ]);

    const alerts = generateAlerts(gl, undefined, 0.1);

    // Old code: large-entries alert present (value 1).
    expect(alerts.some((a) => a.id === 'large-entries')).toBe(false);
  });

  it('still flags expenses that genuinely exceed the threshold (control)', () => {
    const gl = glWith([
      createEntry({ id: '1', credit: 1.15 }),
      createEntry({ id: '2', debit: 0.12, amount: 0.12 }),
    ]);

    const alerts = generateAlerts(gl, undefined, 0.1);
    const large = alerts.find((a) => a.id === 'large-entries');

    expect(large).toBeDefined();
    expect(large?.value).toBe(1);
    expect(large?.threshold).toBe(0.1);
  });
});

describe('compactThousandsMoney — display boundary (GAP-1 / F-0006)', () => {
  it('rounds negative half-K ties half-up, away from zero (old float: -0)', () => {
    // Old inline expression: (-500 / 1000).toFixed(0) === "-0", rendering
    // "$-0K" for a real −$500 net loss.
    const net = sumMoney([-500]);
    expect(compactThousandsMoney(net)).toBe('$-1K');
  });

  it('sums exact decimals without float drift (control)', () => {
    // 4999.99 + 0.1 + 0.2: float reduce = 5000.290000000001 (order-dependent
    // drift); exact decimal total 5000.29 → 5.00029K → rounds to 5K.
    const total = sumMoney([4999.99, 0.1, 0.2]);
    expect(compactThousandsMoney(total)).toBe('$5K');
  });
});
