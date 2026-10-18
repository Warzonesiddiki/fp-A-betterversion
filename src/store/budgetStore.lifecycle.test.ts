import { describe, it, expect, beforeEach } from 'vitest';
import { useBudgetStore } from './budgetStore';
import { setClock, resetClock, nowISO } from '@/utils/clock';
import { actAs } from '@/test/rbacFixtures';
import type { Budget } from '@/types';

/**
 * Phase 7 — plan approval workflow. The budget lifecycle is enforced in
 * the store, not by page convention:
 *   Draft -> InReview -> Approved -> Locked (unlock returns to Approved)
 *   InReview -> Rejected -> InReview (resubmission)
 * Every transition records who/when from the clock; approved and locked
 * budgets cannot be edited; workflow fields cannot be spoofed through
 * the generic update path.
 */

function budget(status: Budget['status']): Budget {
  return {
    id: 'bgt-1',
    name: 'FY27 Plan',
    description: '',
    fiscalYear: 2027,
    status,
    template: 'standard',
    departments: [],
    entities: [],
    baseCurrency: 'USD',
    totalAmount: 1000,
    createdBy: 'usr-001',
    createdByName: 'Planner',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    version: 1,
    progress: 0,
  };
}

describe('budgetStore approval lifecycle', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock('2026-10-15T09:00:00.000Z');
    useBudgetStore.setState({ budgets: [budget('Draft')], lineItems: [], isSubmitting: false });
  });

  it('submit -> approve records the full audit chain with clock time', async () => {
    await useBudgetStore.getState().submitBudget('bgt-1');
    let b = useBudgetStore.getState().budgets[0]!;
    expect(b.status).toBe('InReview');
    expect(b.submittedAt).toBe('2026-10-15T09:00:00.000Z');

    useBudgetStore.getState().approveBudget('bgt-1');
    b = useBudgetStore.getState().budgets[0]!;
    expect(b.status).toBe('Approved');
    expect(b.approvedAt).toBe('2026-10-15T09:00:00.000Z');
    expect(b.approvedBy).toBeTruthy();
  });

  it('approve from Draft is refused — review cannot be skipped', () => {
    expect(() => useBudgetStore.getState().approveBudget('bgt-1')).toThrow(/InReview/);
    expect(useBudgetStore.getState().budgets[0]!.status).toBe('Draft');
  });

  it('reject returns Rejected (not Draft); resubmission is allowed', async () => {
    await useBudgetStore.getState().submitBudget('bgt-1');
    useBudgetStore.getState().rejectBudget('bgt-1');
    expect(useBudgetStore.getState().budgets[0]!.status).toBe('Rejected');
    await useBudgetStore.getState().submitBudget('bgt-1');
    expect(useBudgetStore.getState().budgets[0]!.status).toBe('InReview');
  });

  it('approved and locked budgets refuse edits; lock/unlock follows the lifecycle', async () => {
    await useBudgetStore.getState().submitBudget('bgt-1');
    useBudgetStore.getState().approveBudget('bgt-1');
    expect(() => useBudgetStore.getState().updateBudget('bgt-1', { totalAmount: 9999 })).toThrow(
      /Approved/
    );

    useBudgetStore.getState().lockBudget('bgt-1');
    expect(useBudgetStore.getState().budgets[0]!.status).toBe('Locked');
    expect(() => useBudgetStore.getState().updateBudget('bgt-1', { name: 'x' })).toThrow(/Locked/);

    useBudgetStore.getState().unlockBudget('bgt-1');
    expect(useBudgetStore.getState().budgets[0]!.status).toBe('Approved');
  });

  it('workflow fields cannot be spoofed through updateBudget', () => {
    expect(() =>
      useBudgetStore.getState().updateBudget('bgt-1', { status: 'Approved' } as never)
    ).toThrow(/status/);
    expect(() =>
      useBudgetStore.getState().updateBudget('bgt-1', { approvedBy: 'mallory' } as never)
    ).toThrow(/approvedBy/);
    expect(useBudgetStore.getState().budgets[0]!.status).toBe('Draft');
  });

  it('draft budgets still edit normally', () => {
    useBudgetStore.getState().updateBudget('bgt-1', { totalAmount: 2000, name: 'FY27 v2' });
    const b = useBudgetStore.getState().budgets[0]!;
    expect(b.totalAmount).toBe(2000);
    expect(b.name).toBe('FY27 v2');
  });

  it('line items of an approved budget are frozen too', async () => {
    useBudgetStore.setState({
      lineItems: [
        {
          id: 'li-1',
          budgetId: 'bgt-1',
          accountId: 'a-1',
          accountName: 'Revenue',
          accountCode: '4010',
          accountType: 'Revenue',
          periodId: 'p-1',
          month: 1,
          amount: 100,
          formula: null,
          isCalculated: false,
          isLocked: false,
          isReadOnly: false,
          notes: null,
        } as never,
      ],
    });
    useBudgetStore.getState().updateLineItem('li-1', { amount: 120 });
    await useBudgetStore.getState().submitBudget('bgt-1');
    useBudgetStore.getState().approveBudget('bgt-1');
    expect(() => useBudgetStore.getState().updateLineItem('li-1', { amount: 999 })).toThrow(
      /Approved/
    );
  });

  it('double submission is refused', async () => {
    await useBudgetStore.getState().submitBudget('bgt-1');
    await expect(useBudgetStore.getState().submitBudget('bgt-1')).rejects.toThrow(
      /Draft or Rejected/
    );
  });
});

describe('budgetStore lifecycle teardown', () => {
  it('clock resets to wall time after resetClock', () => {
    setClock('2026-01-01T00:00:00.000Z');
    expect(nowISO()).toBe('2026-01-01T00:00:00.000Z');
    resetClock();
    // Back to wall clock: no longer the frozen test instant, and
    // within a generous window of the real now.
    expect(nowISO()).not.toBe('2026-01-01T00:00:00.000Z');
    expect(Math.abs(Date.parse(nowISO()) - Date.now())).toBeLessThan(60_000);
  });
});
