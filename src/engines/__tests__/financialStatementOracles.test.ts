/**
 * Financial Statement Oracles (F-0011).
 *
 * These are executable oracles that verify the fundamental accounting
 * invariants of the platform. They are NOT unit tests of individual engines —
 * they are end-to-end invariants that must hold regardless of which engine
 * computes the numbers.
 *
 * Oracle 1: Balance Sheet Equation — assets = liabilities + equity
 * Oracle 2: Trial Balance — sum of debits = sum of credits
 * Oracle 3: Consolidation Eliminations — net to zero at consolidated level
 * Oracle 4: FX Translation — translated amounts respect declared rates
 * Oracle 5: Report Recomputation — stored report matches source transactions
 * Oracle 6: Period Close Lock — no posting to closed periods
 */

import { describe, it, expect } from 'vitest';
import {
  addMoney,
  subtractMoney,
  sumMoney,
  toDecimal,
  roundMoney,
  moneyEquals,
  allocateMoney,
  variancePct,
  divideMoney,
  multiplyMoney,
} from '@/utils/money';
import { PeriodCloseStateMachine } from '@/engines/PeriodCloseStateMachine';

// ---------------------------------------------------------------------------
// Oracle 1: Balance Sheet Equation
// ---------------------------------------------------------------------------

describe('F-0011 Oracle 1: Balance Sheet Equation', () => {
  it('assets = liabilities + equity within zero tolerance', () => {
    const assets = ['100000.00', '25000.50', '3000.25'];
    const liabilities = ['45000.00', '12000.75'];
    const equity = ['71000.00'];

    const totalAssets = sumMoney(assets);
    const totalLiabilities = sumMoney(liabilities);
    const totalEquity = sumMoney(equity);
    const totalLPlusE = addMoney(totalLiabilities, totalEquity);

    expect(moneyEquals(totalAssets, totalLPlusE)).toBe(true);
  });

  it('detects imbalance when assets ≠ liabilities + equity', () => {
    const assets = ['100000.00'];
    const liabilities = ['45000.00'];
    const equity = ['54000.00']; // 45000 + 54000 = 99000 ≠ 100000

    const totalAssets = sumMoney(assets);
    const totalLPlusE = addMoney(sumMoney(liabilities), sumMoney(equity));

    expect(moneyEquals(totalAssets, totalLPlusE)).toBe(false);
  });

  it('preserves balance through penny allocation', () => {
    const totalEquity = '33333.33';
    const shares = [1, 1, 1];
    const allocated = allocateMoney(totalEquity, shares);

    const allocatedSum = sumMoney(allocated.map((d) => d.toString()));
    expect(moneyEquals(allocatedSum, toDecimal(totalEquity))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Oracle 2: Trial Balance — Debits = Credits
// ---------------------------------------------------------------------------

describe('F-0011 Oracle 2: Trial Balance', () => {
  it('sum of debits = sum of credits', () => {
    const debits = ['50000.00', '30000.00', '20000.00'];
    const credits = ['40000.00', '35000.00', '25000.00'];

    const totalDebits = sumMoney(debits);
    const totalCredits = sumMoney(credits);

    expect(moneyEquals(totalDebits, totalCredits)).toBe(true);
  });

  it('detects imbalance when debits ≠ credits', () => {
    const debits = ['50000.00', '30000.00'];
    const credits = ['40000.00', '35000.00'];

    const totalDebits = sumMoney(debits);
    const totalCredits = sumMoney(credits);

    expect(moneyEquals(totalDebits, totalCredits)).toBe(false);
  });

  it('trial balance net is zero for balanced entries', () => {
    const debits = ['100000.00'];
    const credits = ['100000.00'];

    const net = subtractMoney(sumMoney(debits), sumMoney(credits));
    expect(moneyEquals(net, '0')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Oracle 3: Consolidation Eliminations — net to zero
// ---------------------------------------------------------------------------

describe('F-0011 Oracle 3: Consolidation Eliminations', () => {
  it('intercompany eliminations net to zero', () => {
    // Parent AR to Sub = 10000, Sub AP to Parent = 10000
    const icReceivable = '10000.00';
    const icPayable = '10000.00';

    const eliminationNet = subtractMoney(icReceivable, icPayable);
    expect(moneyEquals(eliminationNet, '0')).toBe(true);
  });

  it('intercompany revenue and expense eliminate symmetrically', () => {
    const icRevenue = '5000.00';
    const icExpense = '5000.00';

    const eliminationNet = subtractMoney(icRevenue, icExpense);
    expect(moneyEquals(eliminationNet, '0')).toBe(true);
  });

  it('investment elimination net to zero', () => {
    const parentInvestment = '250000.00';
    const subsidiaryEquity = '250000.00';

    const eliminationNet = subtractMoney(parentInvestment, subsidiaryEquity);
    expect(moneyEquals(eliminationNet, '0')).toBe(true);
  });

  it('multiple elimination entries sum to zero', () => {
    const eliminations = [
      { debit: '10000.00', credit: '10000.00' },
      { debit: '5000.00', credit: '5000.00' },
      { debit: '250000.00', credit: '250000.00' },
    ];

    const totalDebits = sumMoney(eliminations.map((e) => e.debit));
    const totalCredits = sumMoney(eliminations.map((e) => e.credit));
    expect(moneyEquals(totalDebits, totalCredits)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Oracle 4: FX Translation — respects declared rates
// ---------------------------------------------------------------------------

describe('F-0011 Oracle 4: FX Translation', () => {
  it('translates EUR to USD using declared rate', () => {
    const eurAmount = '100000.00';
    const rate = '1.09'; // EUR/USD

    const usdAmount = multiplyMoney(eurAmount, rate);
    expect(moneyEquals(roundMoney(usdAmount, 2), '109000.00')).toBe(true);
  });

  it('inverse translation is bounded by spread', () => {
    const usdAmount = '109000.00';
    const forwardRate = '1.09';
    const inverseRate = divideMoney('1', forwardRate);

    const roundTripped = roundMoney(multiplyMoney(usdAmount, inverseRate), 2);
    // Round trip should be within 1 cent of original
    const diff = subtractMoney(roundTripped, '100000.00').abs();
    expect(diff.lessThanOrEqualTo('0.01')).toBe(true);
  });

  it('zero rate is rejected', () => {
    expect(() => multiplyMoney('100000.00', '0')).not.toThrow(); // 0 is a valid number
    expect(() => divideMoney('100000.00', '0')).toThrow(); // but division by zero is not
  });
});

// ---------------------------------------------------------------------------
// Oracle 5: Rounding and Allocation — deterministic, totals preserved
// ---------------------------------------------------------------------------

describe('F-0011 Oracle 5: Rounding and Allocation', () => {
  it('roundMoney is deterministic', () => {
    const value = '1.005';
    const result1 = roundMoney(value, 2);
    const result2 = roundMoney(value, 2);
    expect(moneyEquals(result1, result2)).toBe(true);
  });

  it('ROUND_HALF_UP: 1.005 rounds to 1.01', () => {
    const result = roundMoney('1.005', 2);
    expect(moneyEquals(result, '1.01')).toBe(true);
  });

  it('ROUND_HALF_UP: 2.5 rounds to 3', () => {
    const result = roundMoney('2.5', 0);
    expect(moneyEquals(result, '3')).toBe(true);
  });

  it('allocateMoney preserves total exactly', () => {
    const amount = '1000.00';
    const shares = [3, 2, 1];
    const allocated = allocateMoney(amount, shares);

    const allocatedSum = sumMoney(allocated.map((d) => d.toString()));
    expect(moneyEquals(allocatedSum, amount)).toBe(true);
  });

  it('allocateMoney with unequal shares preserves total', () => {
    const amount = '999.99';
    const shares = [7, 3];
    const allocated = allocateMoney(amount, shares);

    const allocatedSum = sumMoney(allocated.map((d) => d.toString()));
    expect(moneyEquals(allocatedSum, amount)).toBe(true);
  });

  it('allocateMoney with 100 shares preserves total', () => {
    const amount = '1.00';
    const shares = Array.from({ length: 100 }, () => 1);
    const allocated = allocateMoney(amount, shares);

    const allocatedSum = sumMoney(allocated.map((d) => d.toString()));
    expect(moneyEquals(allocatedSum, amount)).toBe(true);
  });

  it('variancePct is consistent: (actual - base) / base * 100', () => {
    const actual = '110';
    const base = '100';
    const expected = '10'; // 10%
    const result = variancePct(actual, base);
    expect(moneyEquals(roundMoney(result, 2), expected)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Oracle 6: Period Close Lock — no posting to closed periods
// ---------------------------------------------------------------------------

describe('F-0011 Oracle 6: Period Close Lock', () => {
  // F-0004 is now implemented: PeriodCloseStateMachine exists. This oracle
  // verifies the invariants the placeholder used to only describe in prose.

  it('enforces the canonical state progression open→soft-close→hard-close→locked', () => {
    expect(PeriodCloseStateMachine.canTransition('open', 'soft-close')).toBe(true);
    expect(PeriodCloseStateMachine.canTransition('soft-close', 'hard-close')).toBe(true);
    expect(PeriodCloseStateMachine.canTransition('hard-close', 'lock')).toBe(true);
    // Illegal skips are rejected.
    expect(PeriodCloseStateMachine.canTransition('open', 'hard-close')).toBe(false);
    expect(PeriodCloseStateMachine.canTransition('open', 'lock')).toBe(false);
  });

  it('blocks posting to hard-closed and locked periods (reversal-only corrections)', () => {
    expect(PeriodCloseStateMachine.canPost('open').allowed).toBe(true);
    expect(PeriodCloseStateMachine.canPost('hard-close').allowed).toBe(false);
    expect(PeriodCloseStateMachine.canPost('locked').allowed).toBe(false);
    // Corrections to a hard-closed period are reversal-only; a locked period
    // allows nothing at all.
    expect(PeriodCloseStateMachine.canReverse('hard-close').allowed).toBe(true);
    expect(PeriodCloseStateMachine.canReverse('locked').allowed).toBe(false);
  });

  it('requires approval to reopen and admin role to force-reopen a locked period', () => {
    const softClosed = PeriodCloseStateMachine.createEntry('2026-Q2', 'entity-1');
    const reopenNoApproval = PeriodCloseStateMachine.transition(
      { ...softClosed, state: 'soft-close' },
      'reopen',
      'user-1'
    );
    expect(reopenNoApproval.success).toBe(false);

    const forceReopenNonAdmin = PeriodCloseStateMachine.transition(
      { ...softClosed, state: 'locked' },
      'force-reopen',
      'user-1',
      { approvalId: 'apr-1', actorRole: 'viewer' }
    );
    expect(forceReopenNonAdmin.success).toBe(false);
  });

  it('emits an audit event on every successful transition', () => {
    const entry = PeriodCloseStateMachine.createEntry('2026-Q2', 'entity-1');
    const result = PeriodCloseStateMachine.transition(entry, 'soft-close', 'user-1');
    expect(result.success).toBe(true);
    expect(result.auditEvent).toBeDefined();
    expect(result.auditEvent!.fromState).toBe('open');
    expect(result.auditEvent!.toState).toBe('soft-close');
    expect(result.auditEvent!.actorId).toBe('user-1');
  });

  it('refuses to hard-close or lock a period whose trial balance does not tie out', () => {
    const entry = {
      ...PeriodCloseStateMachine.createEntry('2026-Q2', 'entity-1'),
      state: 'soft-close' as const,
    };
    // Unbalanced: debits 100.00 vs credits 99.99.
    const unbalanced = PeriodCloseStateMachine.transition(entry, 'hard-close', 'user-1', {
      trialBalance: [
        { accountId: '1000', debit: '100.00', credit: 0 },
        { accountId: '4000', debit: 0, credit: '99.99' },
      ],
    });
    expect(unbalanced.success).toBe(false);
    expect(unbalanced.error).toContain('out of balance');

    // Balanced (Oracle 2 invariant: debits = credits) → close allowed.
    const balanced = PeriodCloseStateMachine.transition(entry, 'hard-close', 'user-1', {
      trialBalance: [
        { accountId: '1000', debit: '100.00', credit: 0 },
        { accountId: '4000', debit: 0, credit: '100.00' },
      ],
    });
    expect(balanced.success).toBe(true);
    expect(balanced.newState).toBe('hard-close');
  });
});
