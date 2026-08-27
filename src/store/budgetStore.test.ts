import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useBudgetStore } from './budgetStore';
import { usePeriodCloseStore, type PeriodChecklist } from './periodCloseStore';
import { PeriodLockedError } from './periodLockGuard';
import { useUIStore } from './uiStore';
import type { Budget, BudgetLineItem } from '@/types';
import type { AccountType } from '@/types';
import { actAs } from '@/test/rbacFixtures';

describe('budgetStore', () => {
  beforeEach(() => {
    actAs('Admin');
    useBudgetStore.setState({
      budgets: [],
      activeBudgetId: null,
      lineItems: [],
      isLoading: false,
      isSubmitting: false,
      lastChange: null,
      history: [[]],
      historyIndex: 0,
      selectedCellId: null,
    });
  });

  const createBudgetInput = (
    overrides: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> = {}
  ) => ({
    name: 'FY2024 Budget',
    description: 'Annual operating budget',
    fiscalYear: 2024,
    status: 'Draft' as const,
    template: 'Standard',
    departments: ['sales', 'engineering'],
    entities: ['ent-1'],
    baseCurrency: 'USD',
    totalAmount: 1000000,
    createdByName: 'John Smith',
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    version: 1,
    progress: 0,
    ...overrides,
  });

  const createLineItem = (overrides: Partial<BudgetLineItem> = {}): BudgetLineItem => ({
    id: 'item-1',
    budgetId: 'bgt-1',
    accountId: 'acct-1',
    accountName: 'Revenue',
    accountCode: '4000',
    accountType: 'Revenue' as AccountType,
    periodId: 'per-1',
    month: 1,
    amount: 10000,
    formula: null,
    isCalculated: false,
    isLocked: false,
    isReadOnly: false,
    notes: null,
    driverId: null,
    assumptions: null,
    version: 1,
    createdBy: 'usr-001',
    updatedBy: 'usr-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  });

  // --- Initial State ---

  it('should have correct initial state', () => {
    const s = useBudgetStore.getState();
    expect(s.budgets).toEqual([]);
    expect(s.activeBudgetId).toBeNull();
    expect(s.lineItems).toEqual([]);
    expect(s.isLoading).toBe(false);
    expect(s.isSubmitting).toBe(false);
    expect(s.lastChange).toBeNull();
    expect(s.history).toEqual([[]]);
    expect(s.historyIndex).toBe(0);
    expect(s.selectedCellId).toBeNull();
  });

  // --- setBudgets ---

  it('should set budgets', () => {
    const budgets = [
      {
        ...createBudgetInput(),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.getState().setBudgets(budgets);
    expect(useBudgetStore.getState().budgets).toEqual(budgets);
    expect(useBudgetStore.getState().budgets).toHaveLength(1);
  });

  it('should replace budgets on subsequent calls', () => {
    const first = [
      {
        ...createBudgetInput({ name: 'First' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    const second = [
      {
        ...createBudgetInput({ name: 'Second' }),
        id: 'bgt-2',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.getState().setBudgets(first);
    useBudgetStore.getState().setBudgets(second);
    expect(useBudgetStore.getState().budgets).toHaveLength(1);
    expect(useBudgetStore!.getState().budgets[0]!.name).toBe('Second');
  });

  // --- setActiveBudget ---

  it('should set active budget id for existing budget', () => {
    const budgets = [
      {
        ...createBudgetInput(),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets });
    useBudgetStore.getState().setActiveBudget('bgt-1');
    expect(useBudgetStore.getState().activeBudgetId).toBe('bgt-1');
  });

  it('should not set active budget id for non-existent budget', () => {
    useBudgetStore.getState().setActiveBudget('non-existent');
    expect(useBudgetStore.getState().activeBudgetId).toBeNull();
  });

  // --- setLineItems ---

  it('should set line items', () => {
    const items = [createLineItem()];
    useBudgetStore.getState().setLineItems(items);
    expect(useBudgetStore.getState().lineItems).toEqual(items);
  });

  it('should replace line items on subsequent calls', () => {
    useBudgetStore.getState().setLineItems([createLineItem({ id: 'item-1', amount: 1000 })]);
    useBudgetStore.getState().setLineItems([createLineItem({ id: 'item-2', amount: 2000 })]);
    expect(useBudgetStore.getState().lineItems).toHaveLength(1);
    expect(useBudgetStore!.getState().lineItems[0]!.amount).toBe(2000);
  });

  // --- updateLineItem ---

  it('should update amount of existing line item', () => {
    useBudgetStore.setState({ lineItems: [createLineItem({ id: 'item-1', amount: 1000 })] });
    useBudgetStore.getState().updateLineItem('item-1', { amount: 2000 });
    const state = useBudgetStore.getState();
    expect(state!.lineItems[0]!.amount).toBe(2000);
    expect(state.lastChange).not.toBeNull();
    expect(state.lastChange!.cellId).toBe('item-1');
  });

  it('should not mutate state for non-existent line item id', () => {
    useBudgetStore.setState({ lineItems: [createLineItem({ id: 'item-1', amount: 1000 })] });
    useBudgetStore.getState().updateLineItem('non-existent', { amount: 5000 });
    const state = useBudgetStore.getState();
    expect(state!.lineItems[0]!.amount).toBe(1000);
    expect(state.lastChange).toBeNull();
  });

  // --- createBudget ---

  it('should create budget with generated id and timestamps', () => {
    const input = createBudgetInput();
    const id = useBudgetStore.getState().createBudget(input);
    expect(id).toMatch(/^bgt-/);
    const state = useBudgetStore.getState();
    expect(state.budgets).toHaveLength(1);
    expect(state!.budgets[0]!.id).toBe(id);
    expect(state!.budgets[0]!.name).toBe('FY2024 Budget');
    expect(state!.budgets[0]!.createdBy).toBe('usr-001');
    expect(state!.budgets[0]!.createdAt).toBeDefined();
    expect(state!.budgets[0]!.updatedAt).toBeDefined();
  });

  it('should create multiple budgets', () => {
    useBudgetStore.getState().createBudget(createBudgetInput({ name: 'Budget A' }));
    useBudgetStore.getState().createBudget(createBudgetInput({ name: 'Budget B' }));
    expect(useBudgetStore.getState().budgets).toHaveLength(2);
  });

  // --- deleteBudget ---

  it('should delete budget by id', () => {
    const budgets = [
      {
        ...createBudgetInput({ name: 'Test' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets });
    useBudgetStore.getState().deleteBudget('bgt-1');
    expect(useBudgetStore.getState().budgets).toEqual([]);
  });

  it('should clear activeBudgetId when deleting active budget', () => {
    const budgets = [
      {
        ...createBudgetInput({ name: 'Test' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets, activeBudgetId: 'bgt-1' });
    useBudgetStore.getState().deleteBudget('bgt-1');
    expect(useBudgetStore.getState().activeBudgetId).toBeNull();
  });

  it('should preserve activeBudgetId when deleting non-active budget', () => {
    const budgets = [
      {
        ...createBudgetInput({ name: 'Active' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
      {
        ...createBudgetInput({ name: 'Other' }),
        id: 'bgt-2',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets, activeBudgetId: 'bgt-1' });
    useBudgetStore.getState().deleteBudget('bgt-2');
    expect(useBudgetStore.getState().activeBudgetId).toBe('bgt-1');
    expect(useBudgetStore.getState().budgets).toHaveLength(1);
  });

  // --- duplicateBudget ---

  it('should duplicate budget with (Copy) suffix', () => {
    const budgets = [
      {
        ...createBudgetInput({ name: 'Original' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets });
    const newId = useBudgetStore.getState().duplicateBudget('bgt-1');
    expect(newId).toMatch(/^bgt-/);
    const state = useBudgetStore.getState();
    expect(state.budgets).toHaveLength(2);
    expect(state!.budgets[1]!.name).toBe('Original (Copy)');
    expect(state!.budgets[1]!.id).toBe(newId);
  });

  it('should return empty string when duplicating non-existent budget', () => {
    const result = useBudgetStore.getState().duplicateBudget('non-existent');
    expect(result).toBe('');
    expect(useBudgetStore.getState().budgets).toEqual([]);
  });

  // --- submitBudget ---

  it('should change budget status to InReview after submission', async () => {
    const budgets = [
      {
        ...createBudgetInput({ status: 'Draft' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets });
    const submitPromise = useBudgetStore.getState().submitBudget('bgt-1');
    expect(useBudgetStore.getState().isSubmitting).toBe(true);
    await submitPromise;
    const state = useBudgetStore.getState();
    expect(state.isSubmitting).toBe(false);
    expect(state!.budgets[0]!.status).toBe('InReview');
  });

  // --- approveBudget ---

  it('should change budget status to Approved', () => {
    const budgets = [
      {
        ...createBudgetInput({ status: 'InReview' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets });
    useBudgetStore.getState().approveBudget('bgt-1');
    expect(useBudgetStore!.getState().budgets[0]!.status).toBe('Approved');
  });

  it('should not throw when approving non-existent budget', () => {
    expect(() => useBudgetStore.getState().approveBudget('non-existent')).not.toThrow();
  });

  // --- rejectBudget ---

  it('should change budget status back to Draft', () => {
    const budgets = [
      {
        ...createBudgetInput({ status: 'InReview' }),
        id: 'bgt-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        createdBy: 'usr-001',
      },
    ] as Budget[];
    useBudgetStore.setState({ budgets });
    useBudgetStore.getState().rejectBudget('bgt-1');
    expect(useBudgetStore!.getState().budgets[0]!.status).toBe('Draft');
  });

  it('should reject non-existent budget without error', () => {
    expect(() => useBudgetStore.getState().rejectBudget('non-existent')).not.toThrow();
  });

  // --- undo / redo ---

  it('should undo to previous line items state', () => {
    const items1 = [createLineItem({ id: 'item-1', amount: 100 })];
    const items2 = [createLineItem({ id: 'item-1', amount: 200 })];
    useBudgetStore.setState({ lineItems: items2, history: [items1, items2], historyIndex: 1 });
    useBudgetStore.getState().undo();
    const state = useBudgetStore.getState();
    expect(state.lineItems).toEqual(items1);
    expect(state.historyIndex).toBe(0);
  });

  it('should not undo when already at beginning', () => {
    const items = [createLineItem({ id: 'item-1', amount: 100 })];
    useBudgetStore.setState({ lineItems: items, history: [items], historyIndex: 0 });
    useBudgetStore.getState().undo();
    expect(useBudgetStore.getState().historyIndex).toBe(0);
  });

  it('should redo to next line items state', () => {
    const items1 = [createLineItem({ id: 'item-1', amount: 100 })];
    const items2 = [createLineItem({ id: 'item-1', amount: 200 })];
    useBudgetStore.setState({ lineItems: items1, history: [items1, items2], historyIndex: 0 });
    useBudgetStore.getState().redo();
    const state = useBudgetStore.getState();
    expect(state.lineItems).toEqual(items2);
    expect(state.historyIndex).toBe(1);
  });

  it('should not redo when already at end', () => {
    const items = [createLineItem({ id: 'item-1', amount: 100 })];
    useBudgetStore.setState({ lineItems: items, history: [items], historyIndex: 0 });
    useBudgetStore.getState().redo();
    expect(useBudgetStore.getState().historyIndex).toBe(0);
  });

  // --- setSelectedCell ---

  it('should set selected cell id', () => {
    useBudgetStore.getState().setSelectedCell('cell-1');
    expect(useBudgetStore.getState().selectedCellId).toBe('cell-1');
  });

  it('should clear selected cell id with null', () => {
    useBudgetStore.setState({ selectedCellId: 'cell-1' });
    useBudgetStore.getState().setSelectedCell(null);
    expect(useBudgetStore.getState().selectedCellId).toBeNull();
  });

  // --- period lock guard (W6-P0-11) ---

  describe('period lock guard (W6-P0-11)', () => {
    const resetPeriodClose = () => {
      usePeriodCloseStore.setState({
        entries: {},
        checklists: {},
        chain: [],
        initialized: true,
      });
    };

    const lockedEntry = {
      periodId: 'P01',
      entityId: 'entity-001',
      state: 'locked' as const,
      closedAt: '2024-12-31T00:00:00.000Z',
      auditEvents: [],
    };

    const p01Checklist = (fiscalYear: number): PeriodChecklist => ({
      plan: {
        id: `close-P01-${fiscalYear}`,
        period: 'monthly',
        fiscalYear,
        fiscalPeriod: 1,
        jurisdiction: 'US',
        tasks: [],
        deadline: `${fiscalYear}-01-31`,
      },
      instances: [],
    });

    const seedLockedPeriod = (fiscalYear?: number) => {
      usePeriodCloseStore.setState({
        entries: { P01: lockedEntry },
        checklists: fiscalYear !== undefined ? { P01: p01Checklist(fiscalYear) } : {},
        initialized: true,
      });
    };

    const seedBudget = () => {
      const budgets = [
        {
          ...createBudgetInput({ fiscalYear: 2024 }),
          id: 'bgt-1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          createdBy: 'usr-001',
        },
      ] as Budget[];
      useBudgetStore.setState({ budgets });
    };

    beforeEach(() => {
      actAs('Admin');
      resetPeriodClose();
    });

    afterEach(() => {
      resetPeriodClose();
    });

    it('rejects updating a line whose periodId matches a locked period, leaving store unchanged', () => {
      seedBudget();
      seedLockedPeriod();
      useBudgetStore.setState({
        lineItems: [createLineItem({ id: 'item-1', periodId: 'P01', month: 1 })],
      });
      expect(() => useBudgetStore.getState().updateLineItem('item-1', { amount: 999 })).toThrow(
        PeriodLockedError
      );
      const state = useBudgetStore.getState();
      expect(state.lineItems[0]!.amount).toBe(10000);
      expect(state.lineItems[0]!.updatedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(state.lastChange).toBeNull();
    });

    it('rejects updates via the month + budget-fiscal-year match even when periodId differs', () => {
      seedBudget();
      seedLockedPeriod(2024); // checklist gives P01 fiscalYear 2024
      useBudgetStore.setState({
        lineItems: [createLineItem({ id: 'item-1', periodId: 'per-other', month: 1 })],
      });
      expect(() => useBudgetStore.getState().updateLineItem('item-1', { amount: 999 })).toThrow(
        PeriodLockedError
      );
      expect(useBudgetStore.getState().lineItems[0]!.amount).toBe(10000);
    });

    it('still mutates lines in unlocked periods (soft-close/open/absent entry)', () => {
      seedBudget();
      usePeriodCloseStore.setState({
        entries: { P01: { ...lockedEntry, state: 'soft-close' } },
        initialized: true,
      });
      useBudgetStore.setState({
        lineItems: [
          createLineItem({ id: 'item-1', periodId: 'P01', month: 1 }),
          createLineItem({ id: 'item-2', periodId: 'per-none', month: 2 }),
        ],
      });
      expect(() =>
        useBudgetStore.getState().updateLineItem('item-1', { amount: 777 })
      ).not.toThrow();
      expect(() =>
        useBudgetStore.getState().updateLineItem('item-2', { amount: 888 })
      ).not.toThrow();
      expect(useBudgetStore.getState().lineItems[0]!.amount).toBe(777);
      expect(useBudgetStore.getState().lineItems[1]!.amount).toBe(888);
    });

    it('permits freeze-marker writes ({ isLocked: true }) but rejects mixed updates on locked lines', () => {
      seedBudget();
      seedLockedPeriod();
      useBudgetStore.setState({
        lineItems: [createLineItem({ id: 'item-1', periodId: 'P01', month: 1 })],
      });
      // Lock propagation contract (periodCloseStore.propagateLock) must keep working.
      expect(() =>
        useBudgetStore.getState().updateLineItem('item-1', { isLocked: true })
      ).not.toThrow();
      expect(useBudgetStore.getState().lineItems[0]!.isLocked).toBe(true);
      expect(() =>
        useBudgetStore.getState().updateLineItem('item-1', { amount: 5, isLocked: false })
      ).toThrow(PeriodLockedError);
      expect(useBudgetStore.getState().lineItems[0]!.amount).toBe(10000);
    });

    it('exposes a typed error with name and periodId', () => {
      seedBudget();
      seedLockedPeriod();
      useBudgetStore.setState({
        lineItems: [createLineItem({ id: 'item-1', periodId: 'P01', month: 1 })],
      });
      try {
        useBudgetStore.getState().updateLineItem('item-1', { amount: 1 });
        throw new Error('expected updateLineItem to throw');
      } catch (e) {
        expect(e).toBeInstanceOf(PeriodLockedError);
        expect(e).toBeInstanceOf(Error);
        expect((e as PeriodLockedError).name).toBe('PeriodLockedError');
        expect((e as PeriodLockedError).periodId).toBe('P01');
      }
    });

    it('surfaces the rejection through the uiStore error toast instead of swallowing silently', () => {
      seedBudget();
      seedLockedPeriod();
      useBudgetStore.setState({
        lineItems: [createLineItem({ id: 'item-1', periodId: 'P01', month: 1 })],
      });
      expect(() => useBudgetStore.getState().updateLineItem('item-1', { amount: 999 })).toThrow(
        PeriodLockedError
      );
      const toasts = useUIStore.getState().toasts;
      expect(toasts.some((t) => t.type === 'error' && t.message.includes('P01'))).toBe(true);
    });

    it('blocks undo when the target snapshot would change a locked-period line; store unchanged', () => {
      seedBudget();
      seedLockedPeriod();
      const items1 = [createLineItem({ id: 'item-1', periodId: 'P01', month: 1, amount: 100 })];
      const items2 = [createLineItem({ id: 'item-1', periodId: 'P01', month: 1, amount: 200 })];
      useBudgetStore.setState({ lineItems: items2, history: [items1, items2], historyIndex: 1 });
      expect(() => useBudgetStore.getState().undo()).toThrow(PeriodLockedError);
      const state = useBudgetStore.getState();
      expect(state.lineItems[0]!.amount).toBe(200);
      expect(state.historyIndex).toBe(1);
    });

    it('blocks redo into a locked-period change just like undo', () => {
      seedBudget();
      seedLockedPeriod();
      const items1 = [createLineItem({ id: 'item-1', periodId: 'P01', month: 1, amount: 100 })];
      const items2 = [createLineItem({ id: 'item-1', periodId: 'P01', month: 1, amount: 200 })];
      useBudgetStore.setState({ lineItems: items1, history: [items1, items2], historyIndex: 0 });
      expect(() => useBudgetStore.getState().redo()).toThrow(PeriodLockedError);
      const state = useBudgetStore.getState();
      expect(state.lineItems[0]!.amount).toBe(100);
      expect(state.historyIndex).toBe(0);
    });

    it('blocks undo that would delete a locked-period line via snapshot replay', () => {
      seedBudget();
      seedLockedPeriod();
      const lockedLine = createLineItem({ id: 'locked-1', periodId: 'P01', month: 1, amount: 50 });
      const otherLine = createLineItem({ id: 'other-1', periodId: 'per-x', month: 2, amount: 60 });
      const target = [otherLine];
      useBudgetStore.setState({
        lineItems: [lockedLine, otherLine],
        history: [target, [lockedLine, otherLine]],
        historyIndex: 1,
      });
      expect(() => useBudgetStore.getState().undo()).toThrow(PeriodLockedError);
      expect(useBudgetStore.getState().lineItems).toHaveLength(2);
    });

    it('allows undo/redo when only unlocked-period lines differ', () => {
      seedBudget();
      seedLockedPeriod();
      const lockedLineA = createLineItem({ id: 'l', periodId: 'P01', month: 1, amount: 10 });
      const otherBefore = createLineItem({ id: 'o', periodId: 'per-y', month: 3, amount: 20 });
      const otherAfter = createLineItem({ id: 'o', periodId: 'per-y', month: 3, amount: 30 });
      useBudgetStore.setState({
        lineItems: [lockedLineA, otherAfter],
        history: [
          [lockedLineA, otherBefore],
          [lockedLineA, otherAfter],
        ],
        historyIndex: 1,
      });
      expect(() => useBudgetStore.getState().undo()).not.toThrow();
      expect(useBudgetStore.getState().lineItems[1]!.amount).toBe(20);
      expect(useBudgetStore.getState().historyIndex).toBe(0);
      expect(() => useBudgetStore.getState().redo()).not.toThrow();
      expect(useBudgetStore.getState().lineItems[1]!.amount).toBe(30);
      expect(useBudgetStore.getState().historyIndex).toBe(1);
    });
  });
});
