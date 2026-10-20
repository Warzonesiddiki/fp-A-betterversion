import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useBudgetStore } from './budgetStore';
import { usePeriodCloseStore } from './periodCloseStore';
import { actAs, signOut } from '@/test/rbacFixtures';
import { setClock, resetClock } from '@/utils/clock';
import type { Budget, BudgetLineItem } from '@/types';

const instant = '2026-10-20T09:00:00.000Z';
const input = {
  name: 'Provenance probe',
  description: '',
  fiscalYear: 2026,
  status: 'Draft' as const,
  template: 'Standard',
  departments: ['finance'],
  entities: ['entity-001'],
  baseCurrency: 'USD',
  totalAmount: 100.01,
  createdByName: 'Untrusted supplied name',
  submittedAt: null,
  approvedAt: null,
  approvedBy: null,
  version: 1,
  progress: 0,
};
const source: Budget = {
  ...input,
  id: 'original-budget',
  createdBy: 'original-author',
  createdByName: 'Original author',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const originalLine: BudgetLineItem = {
  id: 'original-line',
  budgetId: source.id,
  accountId: '4000',
  accountCode: '4000',
  accountName: 'Revenue',
  accountType: 'Revenue',
  periodId: 'P02',
  month: 2,
  amount: 100.01,
  formula: null,
  isCalculated: false,
  isLocked: false,
  isReadOnly: false,
  notes: null,
  driverId: null,
  assumptions: null,
  version: 1,
  createdBy: 'original-author',
  updatedBy: 'original-author',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('budget mutation provenance and clock-collision safety', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(instant);
    usePeriodCloseStore.setState({ entries: {}, checklists: {}, chain: [], initialized: true });
    useBudgetStore.setState({
      budgets: [source],
      activeBudgetId: source.id,
      lineItems: [originalLine],
      history: [[originalLine]],
      historyIndex: 0,
      lastChange: null,
      isLoading: false,
      isSubmitting: false,
      selectedCellId: null,
    });
  });
  afterEach(() => {
    signOut();
    resetClock();
  });

  for (const [from, to] of [
    [100.01, 200.02],
    [100.01, 0],
    [0, -0.01],
    [-100.01, -200.02],
  ] as const) {
    it(`captures the actual old amount ${from} before assigning ${to}`, () => {
      useBudgetStore.setState({ lineItems: [{ ...originalLine, amount: from }] });
      useBudgetStore.getState().updateLineItem(originalLine.id, { amount: to });
      expect(useBudgetStore.getState().lastChange).toEqual({
        cellId: originalLine.id,
        oldValue: from,
        newValue: to,
        timestamp: instant,
      });
      expect(useBudgetStore.getState().lineItems[0]?.amount).toBe(to);
    });
  }
  it('a metadata-only edit does not invent an amount delta', () => {
    useBudgetStore.getState().updateLineItem(originalLine.id, { notes: 'Reviewed' });
    expect(useBudgetStore.getState().lastChange).toEqual({
      cellId: originalLine.id,
      oldValue: 100.01,
      newValue: 100.01,
      timestamp: instant,
    });
  });
  it('new records use the authenticated creator, not a hardcoded user or supplied name', () => {
    const actor = actAs('Admin', { id: 'actual-creator' });
    const id = useBudgetStore.getState().createBudget(input);
    expect(useBudgetStore.getState().budgets.find((b) => b.id === id)).toMatchObject({
      createdBy: actor.id,
      createdByName: `${actor.firstName} ${actor.lastName}`,
      createdAt: instant,
      updatedAt: instant,
    });
  });
  it('copy creation records the current creator without rewriting source history', () => {
    const actor = actAs('Admin', { id: 'actual-copy-creator' });
    const before = JSON.stringify(useBudgetStore.getState().budgets[0]);
    const id = useBudgetStore.getState().duplicateBudget(source.id);
    expect(useBudgetStore.getState().budgets.find((b) => b.id === id)).toMatchObject({
      createdBy: actor.id,
      createdByName: `${actor.firstName} ${actor.lastName}`,
      createdAt: instant,
      updatedAt: instant,
    });
    expect(JSON.stringify(useBudgetStore.getState().budgets[0])).toBe(before);
  });
  it('multiple creations in the same injected millisecond have distinct stable IDs', () => {
    const first = useBudgetStore.getState().createBudget(input);
    const second = useBudgetStore.getState().createBudget(input);
    const copy = useBudgetStore.getState().duplicateBudget(source.id);
    expect([first, second, copy]).toEqual([
      'bgt-1792486800000',
      'bgt-1792486800000-1',
      'bgt-1792486800000-2',
    ]);
    useBudgetStore.getState().updateBudget(second, { description: 'Second only' });
    expect(useBudgetStore.getState().budgets.find((b) => b.id === first)?.description).toBe('');
    expect(useBudgetStore.getState().budgets.find((b) => b.id === second)?.description).toBe(
      'Second only'
    );
    expect(useBudgetStore.getState().budgets).toHaveLength(4);
  });
  it('collision resolution does not overwrite an existing suffixed ID', () => {
    useBudgetStore.setState({
      budgets: [
        source,
        { ...source, id: 'bgt-1792486800000' },
        { ...source, id: 'bgt-1792486800000-1' },
      ],
    });
    const before = JSON.stringify(useBudgetStore.getState().budgets);
    const id = useBudgetStore.getState().createBudget(input);
    expect(id).toBe('bgt-1792486800000-2');
    expect(JSON.stringify(useBudgetStore.getState().budgets.slice(0, 3))).toBe(before);
  });
  it('new IDs cannot attach an orphaned persisted line or history to a new budget', () => {
    useBudgetStore.setState({
      lineItems: [{ ...originalLine, budgetId: 'bgt-1792486800000' }],
      history: [[{ ...originalLine, budgetId: 'bgt-1792486800000-1' }]],
    });
    const beforeLines = JSON.stringify(useBudgetStore.getState().lineItems);
    const beforeHistory = JSON.stringify(useBudgetStore.getState().history);
    expect(useBudgetStore.getState().createBudget(input)).toBe('bgt-1792486800000-2');
    expect(JSON.stringify(useBudgetStore.getState().lineItems)).toBe(beforeLines);
    expect(JSON.stringify(useBudgetStore.getState().history)).toBe(beforeHistory);
  });
  for (const action of ['updateBudget', 'deleteBudget', 'duplicateBudget'] as const) {
    it(`${action} refuses an ambiguous legacy ID without guessing which record to change`, () => {
      useBudgetStore.setState({
        budgets: [source, { ...source, description: 'Different legacy record' }],
      });
      const before = JSON.stringify(useBudgetStore.getState());
      const run =
        action === 'updateBudget'
          ? () => useBudgetStore.getState().updateBudget(source.id, { totalAmount: 999.99 })
          : () => useBudgetStore.getState()[action](source.id);
      expect(run).toThrow(/ambiguous/);
      expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
    });
  }
  it('line edits refuse ambiguous legacy line IDs without choosing the first', () => {
    useBudgetStore.setState({ lineItems: [originalLine, { ...originalLine, amount: 200.02 }] });
    const before = JSON.stringify(useBudgetStore.getState());
    expect(() =>
      useBudgetStore.getState().updateLineItem(originalLine.id, { amount: 999.99 })
    ).toThrow(/ambiguous/);
    expect(JSON.stringify(useBudgetStore.getState())).toBe(before);
  });
});
