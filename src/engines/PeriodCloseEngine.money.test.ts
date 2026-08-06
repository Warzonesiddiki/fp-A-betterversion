/**
 * GAP-1 / F-0006 known-answer tests for Period Close exact-money model
 * (Wave 9 Phase 4 — Enterprise Governance).
 */
import { describe, expect, it } from 'vitest';
import { PeriodCloseStateMachine } from './PeriodCloseStateMachine';
import { addMoney, subtractMoney, roundTo } from '../utils/money';

describe('PeriodCloseEngine — known answers (GAP-1)', () => {
  it('checkTrialBalance validates exact decimal equality (0.1 + 0.2 = 0.3)', () => {
    const check = PeriodCloseStateMachine.checkTrialBalance([
      { accountId: '1000', debit: '0.10', credit: 0 },
      { accountId: '1001', debit: '0.20', credit: 0 },
      { accountId: '4000', debit: 0, credit: '0.30' },
    ]);
    expect(check.balanced).toBe(true);
    expect(check.difference).toBe('0.00');
  });

  it('checkTrialBalance catches 0.01 cent-level imbalance without float drift', () => {
    const check = PeriodCloseStateMachine.checkTrialBalance([
      { accountId: '1000', debit: '100.00', credit: 0 },
      { accountId: '4000', debit: 0, credit: '99.99' },
    ]);
    expect(check.balanced).toBe(false);
    expect(check.difference).toBe('0.01');
  });

  it('computes closing balance exactly (opening + debit - credit)', () => {
    const opening = 1000.1;
    const debit = 200.2;
    const credit = 50.05;
    const closing = roundTo(subtractMoney(addMoney(opening, debit), credit), 2);
    expect(closing).toBe(1150.25);
  });
});
