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

  it('resetPeriod returns a period to open state', async () => {
    const store = usePeriodCloseStore.getState();
    await store.transition('P01', 'soft-close', 'close');
    expect(usePeriodCloseStore.getState().entries['P01']?.state).toBe('soft-close');
    usePeriodCloseStore.getState().resetPeriod('P01');
    expect(usePeriodCloseStore.getState().entries['P01']?.state).toBe('open');
  });
});
