import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useBudgetStore } from './budgetStore';
import type { Budget, BudgetLineItem, BudgetState } from '@/types';
import type { AccountType } from '@/types';

describe('budgetStore', () => {
  beforeEach(() => {
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
    expect(useBudgetStore.getState().budgets[0].name).toBe('Second');
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
    expect(useBudgetStore.getState().lineItems[0].amount).toBe(2000);
  });

  // --- updateLineItem ---

  it('should update amount of existing line item', () => {
    useBudgetStore.setState({ lineItems: [createLineItem({ id: 'item-1', amount: 1000 })] });
    useBudgetStore.getState().updateLineItem('item-1', { amount: 2000 });
    const state = useBudgetStore.getState();
    expect(state.lineItems[0].amount).toBe(2000);
    expect(state.lastChange).not.toBeNull();
    expect(state.lastChange!.cellId).toBe('item-1');
  });

  it('should not mutate state for non-existent line item id', () => {
    useBudgetStore.setState({ lineItems: [createLineItem({ id: 'item-1', amount: 1000 })] });
    useBudgetStore.getState().updateLineItem('non-existent', { amount: 5000 });
    const state = useBudgetStore.getState();
    expect(state.lineItems[0].amount).toBe(1000);
    expect(state.lastChange).toBeNull();
  });

  // --- createBudget ---

  it('should create budget with generated id and timestamps', () => {
    const input = createBudgetInput();
    const id = useBudgetStore.getState().createBudget(input);
    expect(id).toMatch(/^bgt-/);
    const state = useBudgetStore.getState();
    expect(state.budgets).toHaveLength(1);
    expect(state.budgets[0].id).toBe(id);
    expect(state.budgets[0].name).toBe('FY2024 Budget');
    expect(state.budgets[0].createdBy).toBe('usr-001');
    expect(state.budgets[0].createdAt).toBeDefined();
    expect(state.budgets[0].updatedAt).toBeDefined();
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
    expect(state.budgets[1].name).toBe('Original (Copy)');
    expect(state.budgets[1].id).toBe(newId);
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
    expect(state.budgets[0].status).toBe('InReview');
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
    expect(useBudgetStore.getState().budgets[0].status).toBe('Approved');
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
    expect(useBudgetStore.getState().budgets[0].status).toBe('Draft');
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
});
