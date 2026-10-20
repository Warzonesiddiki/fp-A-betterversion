import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBudgetStore } from './budgetStore';
import { useAuthStore } from './authStore';
import { usePeriodCloseStore } from './periodCloseStore';
import { actAs, actAsRoleWithout, signOut } from '@/test/rbacFixtures';
import { resetClock, setClock } from '@/utils/clock';
import type { Budget, BudgetLineItem } from '@/types';

const instant = '2026-10-20T09:00:00.000Z';

function budget(status: Budget['status'] = 'Draft'): Budget {
  return {
    id: 'budget-auth-probe',
    name: 'Authorization probe',
    description: 'Original',
    fiscalYear: 2026,
    status,
    template: 'Standard',
    departments: ['finance'],
    entities: ['entity-001'],
    baseCurrency: 'USD',
    totalAmount: 100.01,
    createdBy: 'original-author',
    createdByName: 'Original author',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    submittedAt: status === 'Draft' || status === 'Rejected' ? null : '2026-01-02T00:00:00.000Z',
    approvedAt: status === 'Approved' || status === 'Locked' ? '2026-01-03T00:00:00.000Z' : null,
    approvedBy: status === 'Approved' || status === 'Locked' ? 'original-reviewer' : null,
    version: 1,
    progress: 0,
  };
}

function line(amount = 100.01): BudgetLineItem {
  return {
    id: 'line-auth-probe',
    budgetId: 'budget-auth-probe',
    accountId: '4000',
    accountName: 'Revenue',
    accountCode: '4000',
    accountType: 'Revenue',
    periodId: 'P02',
    month: 2,
    amount,
    formula: null,
    isCalculated: false,
    isLocked: false,
    isReadOnly: false,
    notes: 'Original',
    driverId: null,
    assumptions: null,
    version: 1,
    createdBy: 'original-author',
    updatedBy: 'original-author',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

interface ActionCase {
  readonly name: string;
  readonly permission: string;
  readonly status?: Budget['status'];
  readonly run: () => unknown;
}

const actions: readonly ActionCase[] = [
  {
    name: 'setBudgets',
    permission: 'budget:update',
    run: () => useBudgetStore.getState().setBudgets([{ ...budget(), description: 'Changed' }]),
  },
  {
    name: 'setLineItems',
    permission: 'budget:update',
    run: () => useBudgetStore.getState().setLineItems([line(200.02)]),
  },
  {
    name: 'updateLineItem',
    permission: 'budget:update',
    run: () => useBudgetStore.getState().updateLineItem('line-auth-probe', { amount: 200.02 }),
  },
  {
    name: 'updateBudget',
    permission: 'budget:update',
    run: () =>
      useBudgetStore
        .getState()
        .updateBudget('budget-auth-probe', { totalAmount: 200.02, description: 'Changed' }),
  },
  {
    name: 'createBudget',
    permission: 'budget:create',
    run: () => useBudgetStore.getState().createBudget(budget()),
  },
  {
    name: 'deleteBudget',
    permission: 'budget:delete',
    run: () => useBudgetStore.getState().deleteBudget('budget-auth-probe'),
  },
  {
    name: 'duplicateBudget',
    permission: 'budget:create',
    run: () => useBudgetStore.getState().duplicateBudget('budget-auth-probe'),
  },
  {
    name: 'submitBudget',
    permission: 'budget:update',
    run: () => useBudgetStore.getState().submitBudget('budget-auth-probe'),
  },
  {
    name: 'approveBudget',
    permission: 'budget:approve',
    status: 'InReview',
    run: () => useBudgetStore.getState().approveBudget('budget-auth-probe'),
  },
  {
    name: 'rejectBudget',
    permission: 'budget:approve',
    status: 'InReview',
    run: () => useBudgetStore.getState().rejectBudget('budget-auth-probe'),
  },
  {
    name: 'lockBudget',
    permission: 'budget:approve',
    status: 'Approved',
    run: () => useBudgetStore.getState().lockBudget('budget-auth-probe'),
  },
  {
    name: 'unlockBudget',
    permission: 'budget:approve',
    status: 'Locked',
    run: () => useBudgetStore.getState().unlockBudget('budget-auth-probe'),
  },
  { name: 'undo', permission: 'budget:update', run: () => useBudgetStore.getState().undo() },
  { name: 'redo', permission: 'budget:update', run: () => useBudgetStore.getState().redo() },
];

const denialSessions = [
  { name: 'no session', setup: signOut },
  { name: 'Viewer', setup: () => actAs('Viewer') },
  {
    name: 'exact permission withheld',
    setup: (permission: string) => actAsRoleWithout('Admin', permission),
  },
  {
    name: 'stale Admin object',
    setup: () => {
      actAs('Admin');
      useAuthStore.setState({ isAuthenticated: false });
    },
  },
];

describe('budgetStore authorization — populated state, every guarded action', () => {
  beforeEach(() => {
    signOut();
    setClock(instant);
    usePeriodCloseStore.setState({ entries: {}, checklists: {}, chain: [], initialized: true });
  });
  afterEach(() => {
    signOut();
    resetClock();
  });

  function seed(status: Budget['status'] = 'Draft'): void {
    useBudgetStore.setState({
      budgets: [budget(status)],
      activeBudgetId: 'budget-auth-probe',
      lineItems: [line()],
      isLoading: false,
      isSubmitting: false,
      lastChange: {
        cellId: 'line-auth-probe',
        oldValue: 99.99,
        newValue: 100.01,
        timestamp: instant,
      },
      history: [[line(99.99)], [line()], [line(200.02)]],
      historyIndex: 1,
      selectedCellId: 'line-auth-probe',
    });
  }

  it('accounts for every financial action plus the UI-only selection guard in source', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/store/budgetStore.ts'), 'utf8');
    const guarded = Array.from(source.matchAll(/(\w+):\s*enforce\(/g), (match) => match[1]);
    expect([...actions.map((action) => action.name), 'setSelectedCell'].sort()).toEqual(
      guarded.sort()
    );
  });

  for (const action of actions) {
    describe(action.name, () => {
      for (const session of denialSessions) {
        it(`denies ${session.name} with no financial or history mutation`, async () => {
          seed(action.status);
          session.setup(action.permission);
          const before = useBudgetStore.getState();
          const serialized = JSON.stringify(before);
          await expect(async () => {
            await action.run();
          }).rejects.toMatchObject({
            name: 'PermissionError',
            message: expect.stringContaining(action.permission),
          });
          expect(useBudgetStore.getState()).toBe(before);
          expect(JSON.stringify(useBudgetStore.getState())).toBe(serialized);
        });
      }
      it('actually changes populated state for a full Admin', async () => {
        seed(action.status);
        actAs('Admin');
        const before = JSON.stringify(useBudgetStore.getState());
        await action.run();
        expect(JSON.stringify(useBudgetStore.getState())).not.toBe(before);
      });
    });
  }

  for (const action of actions.filter((a) => a.permission === 'budget:approve')) {
    it(`Analyst edit rights cannot authorize ${action.name}`, async () => {
      seed(action.status);
      const analyst = actAs('Analyst');
      expect(analyst.permissions).toContain('budget:update');
      expect(analyst.permissions).not.toContain('budget:approve');
      const before = JSON.stringify(useBudgetStore.getState());
      await expect(async () => {
        await action.run();
      }).rejects.toMatchObject({ name: 'PermissionError' });
      expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
    });
    it(`FP&A_Manager approval grant authorizes ${action.name}`, async () => {
      seed(action.status);
      const manager = actAs('FP&A_Manager');
      expect(manager.permissions).toContain('budget:approve');
      const before = JSON.stringify(useBudgetStore.getState());
      await action.run();
      expect(JSON.stringify(useBudgetStore.getState())).not.toBe(before);
    });
  }
  it('bulk replacement cannot turn an editor into an approver', () => {
    seed();
    actAs('Analyst');
    const before = JSON.stringify(useBudgetStore.getState());
    expect(() => useBudgetStore.getState().setBudgets([budget('Approved')])).toThrow(/workflow/);
    expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
  });
  it('even Admin uses lifecycle actions, not bulk workflow spoofing', () => {
    seed();
    actAs('Admin');
    const before = JSON.stringify(useBudgetStore.getState());
    expect(() => useBudgetStore.getState().setBudgets([budget('Approved')])).toThrow(/workflow/);
    expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
  });
  it('bulk removal needs delete authority, not merely update authority', () => {
    seed();
    actAsRoleWithout('Admin', 'budget:delete');
    const before = JSON.stringify(useBudgetStore.getState());
    expect(() => useBudgetStore.getState().setBudgets([])).toThrow(/budget:delete/);
    expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
  });
  it('bulk insertion needs create authority', () => {
    seed();
    actAsRoleWithout('Admin', 'budget:create');
    const before = JSON.stringify(useBudgetStore.getState());
    expect(() =>
      useBudgetStore.getState().setBudgets([budget(), { ...budget(), id: 'another-budget' }])
    ).toThrow(/budget:create/);
    expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
  });
  for (const status of ['InReview', 'Approved', 'Locked'] as const) {
    it(`bulk headers cannot rewrite ${status} substance`, () => {
      seed(status);
      actAs('Admin');
      const before = JSON.stringify(useBudgetStore.getState());
      expect(() =>
        useBudgetStore.getState().setBudgets([{ ...budget(status), totalAmount: 200.02 }])
      ).toThrow(/Draft or Rejected/);
      expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
    });
    it(`bulk lines cannot rewrite ${status} substance`, () => {
      seed(status);
      actAs('Admin');
      const before = JSON.stringify(useBudgetStore.getState());
      expect(() => useBudgetStore.getState().setLineItems([line(200.02)])).toThrow(
        /Draft or Rejected/
      );
      expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
    });
    it(`deletion cannot bypass ${status} lifecycle freeze`, () => {
      seed(status);
      actAs('Admin');
      const before = JSON.stringify(useBudgetStore.getState());
      expect(() => useBudgetStore.getState().deleteBudget('budget-auth-probe')).toThrow(
        /Draft or Rejected/
      );
      expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
    });
    it(`new budgets cannot start in ${status}`, () => {
      seed();
      actAs('Admin');
      const before = JSON.stringify(useBudgetStore.getState());
      expect(() => useBudgetStore.getState().createBudget(budget(status))).toThrow(/Draft/);
      expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
    });
  }
  it('duplicate of an approved budget is a new Draft, not inherited approval', () => {
    seed('Approved');
    actAs('Admin');
    const source = useBudgetStore.getState().budgets[0];
    const id = useBudgetStore.getState().duplicateBudget('budget-auth-probe');
    expect(useBudgetStore.getState().budgets.find((b) => b.id === id)).toMatchObject({
      status: 'Draft',
      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
      version: 1,
    });
    expect(useBudgetStore.getState().budgets[0]).toBe(source);
  });
  it('submission rechecks the session after its async boundary', async () => {
    seed();
    actAs('Admin');
    const before = JSON.stringify(useBudgetStore.getState());
    const pending = useBudgetStore.getState().submitBudget('budget-auth-probe');
    signOut();
    await expect(pending).rejects.toMatchObject({ name: 'PermissionError' });
    expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
  });
  it('submission cannot overwrite a concurrent approved state', async () => {
    seed();
    actAs('Admin');
    const pending = useBudgetStore.getState().submitBudget('budget-auth-probe');
    useBudgetStore.setState({ budgets: [budget('Approved')] });
    await expect(pending).rejects.toThrow(/changed/);
    expect(useBudgetStore.getState().budgets[0]?.status).toBe('Approved');
    expect(useBudgetStore.getState().isSubmitting).toBe(false);
  });
  it('Viewer can select a cell without changing financial state', () => {
    seed();
    actAs('Viewer');
    const before = useBudgetStore.getState();
    useBudgetStore.getState().setSelectedCell('different-cell');
    expect(useBudgetStore.getState()).toEqual({ ...before, selectedCellId: 'different-cell' });
  });
  it('selection still denies a missing UI permission', () => {
    seed();
    actAsRoleWithout('Admin', 'ui:update');
    const before = JSON.stringify(useBudgetStore.getState());
    expect(() => useBudgetStore.getState().setSelectedCell('different-cell')).toThrow(/ui:update/);
    expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
  });
});
