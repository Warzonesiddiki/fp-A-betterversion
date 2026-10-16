// =============================================================================
// periodCloseStore tests — F-01 month-end close client workflow
// -----------------------------------------------------------------------------
// Covers: state-machine transitions through the store (open → soft-close →
// hard-close → locked), trial-balance gating on hard-close/lock (money-exact),
// RBAC (Viewer denied, FP&A_Manager closes but cannot reopen, Admin force-
// reopen), chained SHA-256 audit integrity, and lock propagation (budget line
// items + scenarios frozen on lock).
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { usePeriodCloseStore } from './periodCloseStore';
import { useBudgetStore } from './budgetStore';
import { useScenarioStore } from './scenarioStore';
import { actAs, actAsRoleWithout } from '@/test/rbacFixtures';
import type { FiscalPeriod, Budget, BudgetLineItem, Scenario } from '@/types';

function makePeriods(): FiscalPeriod[] {
  return [1, 2].map((n) => ({
    id: `P${String(n).padStart(2, '0')}`,
    year: 2026,
    periodNumber: n,
    name: n === 1 ? 'January' : 'February',
    startDate: n === 1 ? '2026-01-01' : '2026-02-01',
    endDate: n === 1 ? '2026-01-31' : '2026-02-28',
    periodType: 'Monthly',
    isAdjustingPeriod: false,
    isClosed: false,
    closedAt: null,
    closedBy: null,
  }));
}

function balancedTrialBalance() {
  return [
    { accountId: 'a1', debit: 100, credit: 0 },
    { accountId: 'a2', debit: 0, credit: 100 },
  ];
}

function unbalancedTrialBalance() {
  return [
    { accountId: 'a1', debit: 100, credit: 0 },
    { accountId: 'a2', debit: 0, credit: 99.99 },
  ];
}

function resetStores() {
  // Merge mode (no replace flag) — actions must survive the reset.
  usePeriodCloseStore.setState({
    entries: {},
    checklists: {},
    chain: [],
    initialized: false,
  });
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
  useScenarioStore.setState({ scenarios: [] });
}

describe('periodCloseStore', () => {
  beforeEach(() => {
    actAs('Admin');
    resetStores();
    usePeriodCloseStore.getState().initialize(makePeriods(), 'US-GAAP');
  });

  it('initializes open entries + real close checklists from FinancialCloseEngine', () => {
    const state = usePeriodCloseStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.entries['P01']?.state).toBe('open');
    expect(state.entries['P02']?.state).toBe('open');
    const checklist = state.checklists['P01'];
    expect(checklist).toBeDefined();
    // Real engine tasks — never invented per-page.
    expect(checklist!.plan.tasks.some((t) => t.id === 'recon')).toBe(true);
    expect(checklist!.plan.tasks.some((t) => t.id === 'cfo-approval')).toBe(true);
    expect(checklist!.plan.tasks.some((t) => t.id === 'file')).toBe(true);
  });

  it('walks open → soft-close → hard-close → locked with audit events', async () => {
    const store = usePeriodCloseStore.getState();
    const sc = await store.transition('P01', 'soft-close', 'month-end close');
    expect(sc.success).toBe(true);
    expect(sc.newState).toBe('soft-close');

    const hc = await store.transition(
      'P01',
      'hard-close',
      'books verified',
      balancedTrialBalance()
    );
    expect(hc.success).toBe(true);
    expect(hc.newState).toBe('hard-close');

    const lk = await store.transition('P01', 'lock', 'final lock', balancedTrialBalance());
    expect(lk.success).toBe(true);
    expect(lk.newState).toBe('locked');

    const entry = usePeriodCloseStore.getState().entries['P01']!;
    expect(entry.auditEvents.map((e) => e.transition)).toEqual([
      'soft-close',
      'hard-close',
      'lock',
    ]);
    expect(entry.closedBy).toBe('test-user-admin');
    expect(entry.closedAt).toBeTruthy();
  });

  it('rejects hard-close on an unbalanced trial balance (money-exact, cent-level)', async () => {
    const store = usePeriodCloseStore.getState();
    await store.transition('P01', 'soft-close', 'start');
    const hc = await store.transition('P01', 'hard-close', 'close', unbalancedTrialBalance());
    expect(hc.success).toBe(false);
    expect(hc.error).toMatch(/trial balance is out of balance/i);
    expect(usePeriodCloseStore.getState().entries['P01']?.state).toBe('soft-close');
    // Chain must not contain the failed event.
    expect(usePeriodCloseStore.getState().chain.filter((c) => c.periodId === 'P01')).toHaveLength(
      1
    );
  });

  it('rejects an invalid transition (open → lock directly)', async () => {
    const store = usePeriodCloseStore.getState();
    const res = await store.transition('P01', 'lock', 'skip steps', balancedTrialBalance());
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid transition/i);
  });

  it('RBAC: Viewer cannot transition (PermissionError), FP&A_Manager cannot reopen', async () => {
    // Viewer → enforce throws synchronously (PermissionError)
    actAs('Viewer');
    const store = usePeriodCloseStore.getState();
    expect(() => store.transition('P01', 'soft-close', 'x')).toThrow(/period:close/);

    // FP&A_Manager can close but reopen requires period:reopen
    actAs('FP&A_Manager');
    await store.transition('P01', 'soft-close', 'close');
    const hc = await store.transition('P01', 'hard-close', 'close', balancedTrialBalance());
    expect(hc.success).toBe(true);
    const reopen = await store.transition('P01', 'reopen', 'oops');
    expect(reopen.success).toBe(false);
    expect(reopen.error).toMatch(/period:reopen/);

    // Admin force-reopens a locked period with approval
    actAs('Admin');
    const lk = await store.transition('P01', 'lock', 'lock', balancedTrialBalance());
    expect(lk.success).toBe(true);
    const fr = await store.transition('P01', 'force-reopen', 'audit adjustment');
    expect(fr.success).toBe(true);
    expect(fr.newState).toBe('open');
  });

  it('RBAC: stripping period:close via actAsRoleWithout denies the action', async () => {
    actAsRoleWithout('Admin', 'period:close');
    const store = usePeriodCloseStore.getState();
    expect(() => store.transition('P01', 'soft-close', 'x')).toThrow(/period:close/);
  });

  it('persists a verifiable SHA-256 chain (verifyChain ok, tamper detected)', async () => {
    const store = usePeriodCloseStore.getState();
    await store.transition('P01', 'soft-close', 'close');
    await store.transition('P01', 'hard-close', 'close', balancedTrialBalance());
    const v = await usePeriodCloseStore.getState().verifyChain('P01');
    expect(v.ok).toBe(true);
    expect(v.totalEntries).toBe(2);

    // Tamper: flip a stored event state → chain must break.
    usePeriodCloseStore.setState((s) => {
      const chain = s.chain.map((c) =>
        c.periodId === 'P01'
          ? {
              ...c,
              event: { ...c.event, toState: 'locked' as const },
            }
          : c
      );
      return { chain };
    });
    const broken = await usePeriodCloseStore.getState().verifyChain('P01');
    expect(broken.ok).toBe(false);
    expect(broken.reason).toBe('BROKEN_HASH_MISMATCH');
  });

  it('updateTaskStatus + assignTask update the checklist (assignApprover marks in-progress)', () => {
    const store = usePeriodCloseStore.getState();
    expect(store.assignTask('P01', 'recon', 'a.analyst')).toBe(true);
    const afterAssign = usePeriodCloseStore.getState().checklists['P01']!;
    expect(afterAssign.instances.find((i) => i.taskId === 'recon')?.status).toBe('in-progress');
    expect(store.updateTaskStatus('P01', 'recon', 'complete')).toBe(true);
    const after = usePeriodCloseStore.getState().checklists['P01']!;
    expect(after.instances.find((i) => i.taskId === 'recon')?.status).toBe('complete');
  });

  it('lock propagates: freezes the period budget line items + year scenarios', async () => {
    // Seed a budget + line item for Jan 2026 and a scenario on that budget.
    const budget: Budget = {
      id: 'b1',
      name: 'FY2026',
      description: '',
      fiscalYear: 2026,
      status: 'Approved',
      template: 'Standard',
      departments: [],
      entities: [],
      baseCurrency: 'USD',
      totalAmount: 1000,
      createdBy: 'u1',
      createdByName: 'U',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      submittedAt: null,
      approvedAt: '2026-01-02',
      approvedBy: 'u1',
      version: 1,
      progress: 100,
    };
    const line: BudgetLineItem = {
      id: 'l1',
      budgetId: 'b1',
      accountId: 'acct-1',
      accountName: 'Revenue',
      accountCode: '4000',
      accountType: 'Revenue',
      periodId: 'P01',
      month: 1,
      amount: 500,
      formula: null,
      isCalculated: false,
      isLocked: false,
      isReadOnly: false,
      notes: null,
      driverId: null,
      assumptions: null,
      version: 1,
      createdBy: 'u1',
      updatedBy: 'u1',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      description: '',
      baseBudgetId: null,
      baseBudgetName: null,
    };
    useBudgetStore.setState({ budgets: [budget], lineItems: [line] });

    const scenario: Scenario = {
      id: 's1',
      name: 'Optimistic',
      description: '',
      baseBudgetId: 'b1',
      baseBudgetName: 'FY2026',
      type: 'Optimistic',
      probability: 50,
      isActive: true,
      isLocked: false,
      assumptions: [],
      calculatedMetrics: {
        netIncome: 0,
        revenue: 0,
        expenses: 0,
        cash: 0,
        headcount: 0,
        ebitda: 0,
      },
      createdBy: 'u1',
      createdByName: 'U',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    useScenarioStore.setState({ scenarios: [scenario] });

    const store = usePeriodCloseStore.getState();
    await store.transition('P01', 'soft-close', 'close');
    await store.transition('P01', 'hard-close', 'close', balancedTrialBalance());
    const lock = await store.transition('P01', 'lock', 'final', balancedTrialBalance());

    expect(lock.success).toBe(true);
    expect(lock.lockedLineItems).toBe(1);
    expect(lock.lockedScenarios).toBe(1);
    expect(useBudgetStore.getState().lineItems[0]?.isLocked).toBe(true);
    expect(useScenarioStore.getState().scenarios[0]?.isLocked).toBe(true);
  });

  it.each(['soft-close', 'hard-close', 'locked'] as const)(
    'resetPeriod cannot bypass authorized reopen from %s, even for Admin',
    (state) => {
      const entry = usePeriodCloseStore.getState().entries.P01!;
      usePeriodCloseStore.setState({ entries: { P01: { ...entry, state } } });
      const before = usePeriodCloseStore.getState();
      expect(() => before.resetPeriod('P01')).toThrow(/authorized reopen/);
      expect(usePeriodCloseStore.getState().entries).toBe(before.entries);
      expect(usePeriodCloseStore.getState().chain).toBe(before.chain);
    }
  );

  it('resetPeriod is a no-op for an open or unknown period', () => {
    const before = usePeriodCloseStore.getState();
    before.resetPeriod('P01');
    before.resetPeriod('unknown');
    expect(usePeriodCloseStore.getState()).toBe(before);
  });

  it.each([undefined, '', '   '])(
    'reopen requires a meaningful audit reason (%s)',
    async (reason) => {
      await usePeriodCloseStore.getState().transition('P01', 'soft-close', 'close');
      const before = usePeriodCloseStore.getState();
      const result = await before.transition('P01', 'reopen', reason);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/non-empty audit reason/);
      expect(usePeriodCloseStore.getState()).toBe(before);
    }
  );

  it('force-reopen also requires a non-empty reason and cannot mutate a locked period', async () => {
    const entry = usePeriodCloseStore.getState().entries.P01!;
    usePeriodCloseStore.setState({ entries: { P01: { ...entry, state: 'locked' } } });
    const before = usePeriodCloseStore.getState();
    const result = await before.transition('P01', 'force-reopen', '   ', undefined, 'approval-1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/non-empty audit reason/);
    expect(usePeriodCloseStore.getState()).toBe(before);
  });

  it('authorized reopen records a trimmed reason and preserves a verifiable chain', async () => {
    await usePeriodCloseStore.getState().transition('P01', 'soft-close', 'close');
    const result = await usePeriodCloseStore
      .getState()
      .transition('P01', 'reopen', '  correction approved  ');
    expect(result.success).toBe(true);
    const state = usePeriodCloseStore.getState();
    expect(state.entries.P01?.reopenReason).toBe('correction approved');
    expect(state.chain.at(-1)?.event.reason).toBe('correction approved');
    expect((await state.verifyChain('P01')).ok).toBe(true);
  });

  it('retains supplied fiscal dates instead of guessing calendar months from period IDs', () => {
    const p = {
      ...makePeriods()[0]!,
      id: 'retail-2026-P01',
      startDate: '2025-12-29',
      endDate: '2026-01-25',
    };
    usePeriodCloseStore.getState().initialize([p], 'US-GAAP');
    expect(usePeriodCloseStore.getState().checklists[p.id]?.fiscalScope).toEqual({
      startDate: '2025-12-29',
      endDate: '2026-01-25',
      isAdjustingPeriod: false,
    });
  });

  it('reinitialization is idempotent and cannot reopen closed periods', async () => {
    await usePeriodCloseStore.getState().transition('P01', 'soft-close', 'close');
    const before = usePeriodCloseStore.getState();
    before.initialize(makePeriods(), 'US-GAAP');
    expect(usePeriodCloseStore.getState()).toBe(before);
  });

  it('backfills compatible legacy checklists without replacing tasks or audit state', async () => {
    await usePeriodCloseStore.getState().transition('P01', 'soft-close', 'close');
    const original = usePeriodCloseStore.getState().checklists.P01!;
    const legacy = { plan: original.plan, instances: original.instances };
    usePeriodCloseStore.setState({ checklists: { P01: legacy } });
    const before = usePeriodCloseStore.getState();
    before.initialize([makePeriods()[0]!], 'US-GAAP');
    const after = usePeriodCloseStore.getState();
    expect(after.checklists.P01?.fiscalScope?.startDate).toBe('2026-01-01');
    expect(after.checklists.P01?.instances).toBe(before.checklists.P01?.instances);
    expect(after.entries).toBe(before.entries);
    expect(after.chain).toBe(before.chain);
  });

  it.each([
    { year: 2027 },
    { periodNumber: 5 },
    { startDate: '2025-12-31' },
    { endDate: '2026-01-30' },
    { isAdjustingPeriod: true },
  ])('rejects rebinding an existing period scope atomically: %j', (change) => {
    const before = usePeriodCloseStore.getState();
    const newPeriod = { ...makePeriods()[1]!, id: 'new-period' };
    const changed = { ...makePeriods()[0]!, ...change };
    expect(() => before.initialize([newPeriod, changed], 'US-GAAP')).toThrow(/migration required/);
    expect(usePeriodCloseStore.getState()).toBe(before);
  });

  it('rejects entity reuse of an existing period ID', () => {
    const before = usePeriodCloseStore.getState();
    expect(() => before.initialize(makePeriods(), 'US-GAAP', 'other-entity')).toThrow(
      /migration required/
    );
    expect(usePeriodCloseStore.getState()).toBe(before);
  });

  it.each([
    { startDate: '2026-02-30', endDate: '2026-03-01' },
    { startDate: '2026-02-10', endDate: '2026-02-01' },
    { startDate: '2026/02/01', endDate: '2026-02-28' },
  ])('rejects invalid or noncanonical calendar ranges without partial changes: %j', (range) => {
    const before = usePeriodCloseStore.getState();
    expect(() =>
      before.initialize([{ ...makePeriods()[1]!, id: 'bad', ...range }], 'US-GAAP')
    ).toThrow(/Invalid fiscal date range/);
    expect(usePeriodCloseStore.getState()).toBe(before);
  });

  it('rejects duplicate calendar IDs before creating any periods', () => {
    const before = usePeriodCloseStore.getState();
    const p = { ...makePeriods()[0]!, id: 'new-period' };
    expect(() => before.initialize([p, p], 'US-GAAP')).toThrow(/duplicate fiscal period ID/);
    expect(usePeriodCloseStore.getState()).toBe(before);
  });
});
