import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBudgetStore } from './budgetStore';
import { usePeriodCloseStore, type PeriodChecklist } from './periodCloseStore';
import { PeriodLockedError } from './periodLockGuard';
import { actAs, signOut } from '@/test/rbacFixtures';
import { resetClock, setClock } from '@/utils/clock';
import type { Budget, BudgetLineItem } from '@/types';

const header: Budget = {
  id: 'closed-budget',
  name: 'Closed-period probe',
  description: 'Original',
  fiscalYear: 2026,
  status: 'Draft',
  template: 'Standard',
  departments: ['finance'],
  entities: ['entity-001'],
  baseCurrency: 'USD',
  totalAmount: 100.01,
  createdBy: 'original',
  createdByName: 'Original',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  submittedAt: null,
  approvedAt: null,
  approvedBy: null,
  version: 1,
  progress: 0,
};
const original: BudgetLineItem = {
  id: 'closed-line',
  budgetId: header.id,
  accountId: '4000',
  accountName: 'Revenue',
  accountCode: '4000',
  accountType: 'Revenue',
  periodId: 'legacy-january',
  month: 1,
  amount: 100.01,
  formula: null,
  isCalculated: false,
  isLocked: false,
  isReadOnly: false,
  notes: null,
  driverId: null,
  assumptions: null,
  version: 1,
  createdBy: 'original',
  updatedBy: 'original',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const checklist: PeriodChecklist = {
  plan: {
    id: 'close-january',
    period: 'monthly',
    fiscalYear: 2026,
    fiscalPeriod: 1,
    jurisdiction: 'US',
    tasks: [],
    deadline: '2026-01-31',
  },
  instances: [],
};

function seed(lines: BudgetLineItem[] = [original]): void {
  useBudgetStore.setState({
    budgets: [header],
    lineItems: lines,
    activeBudgetId: header.id,
    history: [[original], lines, [{ ...original, amount: 200.02 }]],
    historyIndex: 1,
    selectedCellId: original.id,
    lastChange: null,
    isLoading: false,
    isSubmitting: false,
  });
}

function expectAtomicDenial(
  run: () => void,
  error: typeof PeriodLockedError | ErrorConstructor = PeriodLockedError
): void {
  const before = useBudgetStore.getState();
  const contents = JSON.stringify(before);
  const closeBefore = JSON.stringify(usePeriodCloseStore.getState());
  expect(run).toThrow(error);
  expect(useBudgetStore.getState()).toBe(before);
  expect(JSON.stringify(useBudgetStore.getState())).toBe(contents);
  expect(JSON.stringify(usePeriodCloseStore.getState())).toBe(closeBefore);
}

describe('budget closed-period write chokepoints', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock('2026-10-20T09:00:00.000Z');
    seed();
    usePeriodCloseStore.setState({
      entries: {
        P01: {
          periodId: 'P01',
          entityId: 'entity-001',
          state: 'locked',
          closedAt: '2026-02-01T00:00:00.000Z',
          auditEvents: [],
        },
      },
      checklists: { P01: checklist },
      chain: [],
      initialized: true,
    });
  });
  afterEach(() => {
    signOut();
    resetClock();
    usePeriodCloseStore.setState({ entries: {}, checklists: {}, chain: [], initialized: true });
  });

  for (const [label, target] of [
    ['edit', [{ ...original, amount: 200.02 }]],
    ['delete', []],
    ['insert', [original, { ...original, id: 'new-closed-line' }]],
  ] as const) {
    it(`bulk replacement cannot ${label} a closed line`, () => {
      expectAtomicDenial(() => useBudgetStore.getState().setLineItems([...target]));
    });
  }

  it('bulk replacement is atomic even if an open row precedes the forbidden row', () => {
    const open = { ...original, id: 'open-line', periodId: 'P02', month: 2 };
    seed([open, original]);
    expectAtomicDenial(() =>
      useBudgetStore.getState().setLineItems([
        { ...open, amount: 300.03 },
        { ...original, amount: 200.02 },
      ])
    );
  });

  it('an open line cannot be moved into a closed period by updateLineItem', () => {
    seed([{ ...original, periodId: 'P02', month: 2 }]);
    expectAtomicDenial(() =>
      useBudgetStore.getState().updateLineItem(original.id, { periodId: 'P01', month: 1 })
    );
  });
  for (const direction of ['undo', 'redo'] as const) {
    it(`${direction} checks both source and destination period`, () => {
      const open = { ...original, periodId: 'P02', month: 2 };
      seed([open]);
      useBudgetStore.setState({ history: [[original], [open], [original]], historyIndex: 1 });
      expectAtomicDenial(() => useBudgetStore.getState()[direction]());
    });
  }
  it('bulk replacement cannot move an open row into a closed period', () => {
    seed([{ ...original, periodId: 'P02', month: 2 }]);
    expectAtomicDenial(() => useBudgetStore.getState().setLineItems([original]));
  });
  it('duplicate target IDs cannot conceal a changed closed line', () => {
    expectAtomicDenial(
      () => useBudgetStore.getState().setLineItems([{ ...original, amount: 200.02 }, original]),
      Error
    );
  });
  it('duplicate current IDs are rejected rather than silently collapsed', () => {
    seed([original, { ...original, amount: 200.02 }]);
    expectAtomicDenial(() => useBudgetStore.getState().setLineItems([original]), Error);
  });

  for (const [label, run] of [
    [
      'edit header',
      () => useBudgetStore.getState().updateBudget(header.id, { totalAmount: 200.02 }),
    ],
    [
      'change fiscal year',
      () => useBudgetStore.getState().updateBudget(header.id, { fiscalYear: 2027 }),
    ],
    ['delete header', () => useBudgetStore.getState().deleteBudget(header.id)],
    [
      'replace header',
      () => useBudgetStore.getState().setBudgets([{ ...header, fiscalYear: 2027 }]),
    ],
    ['remove header', () => useBudgetStore.getState().setBudgets([])],
  ] as const) {
    it(`${label} cannot detach or rewrite closed-period financial context`, () =>
      expectAtomicDenial(run));
  }
  it('prospective fiscal-year mapping cannot attach an open line to a closed year', () => {
    useBudgetStore.setState({ budgets: [{ ...header, fiscalYear: 2027 }] });
    expectAtomicDenial(() => useBudgetStore.getState().setBudgets([header]));
  });
  it('identical closed data can be replaced without inventing a financial edit', () => {
    useBudgetStore.getState().setLineItems([{ ...original }]);
    useBudgetStore.getState().setBudgets([{ ...header, departments: [...header.departments] }]);
    expect(useBudgetStore.getState().lineItems).toEqual([original]);
    expect(useBudgetStore.getState().budgets).toEqual([header]);
  });
  it('open-period rows remain editable while closed rows are preserved', () => {
    const open = { ...original, id: 'open-line', periodId: 'P02', month: 2 };
    seed([original, open]);
    useBudgetStore.getState().setLineItems([original, { ...open, amount: 200.02 }]);
    expect(useBudgetStore.getState().lineItems[0]).toEqual(original);
    expect(useBudgetStore.getState().lineItems[1]?.amount).toBe(200.02);
  });
  it('the system freeze-marker-only path remains usable', () => {
    useBudgetStore.getState().updateLineItem(original.id, { isLocked: true });
    expect(useBudgetStore.getState().lineItems[0]).toEqual({ ...original, isLocked: true });
  });
  it('month-only reassignment checks the destination fiscal-year mapping', () => {
    seed([{ ...original, periodId: 'legacy-february', month: 2 }]);
    expectAtomicDenial(() => useBudgetStore.getState().updateLineItem(original.id, { month: 1 }));
  });
  it('budget-owner reassignment checks the destination fiscal year', () => {
    seed([{ ...original, budgetId: 'open-year' }]);
    useBudgetStore.setState({
      budgets: [header, { ...header, id: 'open-year', fiscalYear: 2027 }],
    });
    expectAtomicDenial(() =>
      useBudgetStore.getState().updateLineItem(original.id, { budgetId: header.id })
    );
  });
});
