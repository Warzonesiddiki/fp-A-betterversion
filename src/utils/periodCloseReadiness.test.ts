// =============================================================================
// PeriodCloseReadiness unit tests
// =============================================================================
import { describe, expect, it } from 'vitest';
import {
  blockingChecksFor,
  entriesForPeriod,
  evaluateCloseReadiness,
  isTransitionAllowed,
  type CloseTransition,
} from './periodCloseReadiness';
import type { Budget, FiscalPeriod, GLEntry } from '@/types';
import type { ClosePlan, CloseTaskInstance } from '@/engines/FinancialCloseEngine';

const period: FiscalPeriod = {
  id: 'p-2026-06',
  year: 2026,
  periodNumber: 6,
  name: 'June',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  periodType: 'monthly',
  isAdjustingPeriod: false,
  isClosed: false,
  closedAt: null,
  closedBy: null,
};

function entry(overrides: Partial<GLEntry> = {}): GLEntry {
  return {
    id: 'e',
    accountId: 'a',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-06',
    periodName: 'June 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-06-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

const balancedPair: GLEntry[] = [
  entry({ id: 'e1', debit: 1000 }),
  entry({ id: 'e2', credit: 1000 }),
];

const budget = (overrides: Partial<Budget>): Budget =>
  ({
    id: 'b1',
    name: 'FY2026 Budget',
    description: '',
    fiscalYear: 2026,
    status: 'Approved',
    template: '',
    departments: [],
    entities: [],
    baseCurrency: 'USD',
    totalAmount: 100000,
    createdBy: '',
    createdByName: '',
    createdAt: '',
    updatedAt: '',
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    version: 1,
    progress: 1,
    ...overrides,
  }) as Budget;

const plan: ClosePlan = {
  id: 'plan',
  period: 'monthly',
  fiscalYear: 2026,
  fiscalPeriod: 6,
  jurisdiction: 'US-GAAP',
  deadline: '2099-01-01',
  tasks: [
    {
      id: 'critical-1',
      name: 'Critical 1',
      description: '',
      category: 'review',
      priority: 'critical',
      dependencies: [],
      assigneeRole: 'controller',
      estimatedHours: 2,
      regulatoryFlag: false,
    },
    {
      id: 'normal-1',
      name: 'Normal 1',
      description: '',
      category: 'review',
      priority: 'low',
      dependencies: [],
      assigneeRole: 'preparer',
      estimatedHours: 2,
      regulatoryFlag: false,
    },
  ],
};

const checklistComplete: { plan: ClosePlan; instances: CloseTaskInstance[] } = {
  plan,
  instances: [
    {
      taskId: 'critical-1',
      status: 'complete',
      assignee: 'x',
      startedAt: null,
      completedAt: null,
      notes: '',
    },
    {
      taskId: 'normal-1',
      status: 'complete',
      assignee: 'x',
      startedAt: null,
      completedAt: null,
      notes: '',
    },
  ],
};

const checklistIncomplete: { plan: ClosePlan; instances: CloseTaskInstance[] } = {
  plan,
  instances: [
    {
      taskId: 'critical-1',
      status: 'in-progress',
      assignee: 'x',
      startedAt: null,
      completedAt: null,
      notes: '',
    },
    {
      taskId: 'normal-1',
      status: 'complete',
      assignee: 'x',
      startedAt: null,
      completedAt: null,
      notes: '',
    },
  ],
};

describe('entriesForPeriod', () => {
  it('includes entries inside the period date range', () => {
    const result = entriesForPeriod(
      [entry({ id: 'in', date: '2026-06-15' }), entry({ id: 'boundary', date: '2026-06-30' })],
      period
    );
    expect(result.map((e) => e.id)).toEqual(['in', 'boundary']);
  });

  it('excludes entries outside the period', () => {
    const result = entriesForPeriod(
      [entry({ id: 'before', date: '2026-05-31' }), entry({ id: 'after', date: '2026-07-01' })],
      period
    );
    expect(result.map((e) => e.id)).toEqual([]);
  });

  it('falls back to postDate when date is missing', () => {
    const result = entriesForPeriod(
      [entry({ id: 'post', date: '', postDate: '2026-06-10' })],
      period
    );
    expect(result.map((e) => e.id)).toEqual(['post']);
  });

  it('returns an empty array for no entries', () => {
    expect(entriesForPeriod([], period)).toEqual([]);
  });
});

describe('evaluateCloseReadiness', () => {
  it('returns ready when everything is in order', () => {
    const r = evaluateCloseReadiness(
      period,
      balancedPair,
      [budget({ status: 'Approved' })],
      checklistComplete
    );
    expect(r.ready).toBe(true);
    expect(r.checks.every((c) => c.ok)).toBe(true);
    expect(r.totalDebits).toBe(1000);
    expect(r.totalCredits).toBe(1000);
    expect(r.difference).toBe(0);
    expect(r.entryCount).toBe(2);
  });

  it('flags gl-data when there are no entries in the period', () => {
    const r = evaluateCloseReadiness(
      period,
      [entry({ date: '2026-05-01' })],
      [],
      checklistComplete
    );
    expect(r.ready).toBe(false);
    const gl = r.checks.find((c) => c.id === 'gl-data');
    expect(gl?.ok).toBe(false);
    expect(gl?.detail).toContain('No GL entries');
  });

  it('flags tb-balanced when debits do not equal credits', () => {
    const entries = [entry({ id: 'e1', debit: 1000 }), entry({ id: 'e2', credit: 400 })];
    const r = evaluateCloseReadiness(period, entries, [], checklistComplete);
    const tb = r.checks.find((c) => c.id === 'tb-balanced');
    expect(tb?.ok).toBe(false);
    expect(tb?.detail).toContain('≠');
    expect(r.difference).toBe(600);
  });

  it('passes tb-balanced with money-exact rounding on floating-point sums', () => {
    // 0.1 + 0.2 (IEEE-754: 0.30000000000000004) must still equal 0.3 via money primitives
    const entries = [
      entry({ id: 'e1', debit: 0.1 }),
      entry({ id: 'e2', debit: 0.2 }),
      entry({ id: 'e3', credit: 0.3 }),
    ];
    const r = evaluateCloseReadiness(period, entries, [], checklistComplete);
    expect(r.ready).toBe(true);
    expect(r.difference).toBe(0);
  });

  it('budgets-approved is vacuously true when no budgets exist', () => {
    const r = evaluateCloseReadiness(period, balancedPair, [], checklistComplete);
    const check = r.checks.find((c) => c.id === 'budgets-approved');
    expect(check?.ok).toBe(true);
    expect(check?.detail).toContain('No budgets');
  });

  it('flags budgets-approved when a fiscal-year budget is not approved', () => {
    const r = evaluateCloseReadiness(
      period,
      balancedPair,
      [budget({ status: 'Draft' })],
      checklistComplete
    );
    const check = r.checks.find((c) => c.id === 'budgets-approved');
    expect(check?.ok).toBe(false);
  });

  it('ignores budgets for a different fiscal year', () => {
    const r = evaluateCloseReadiness(
      period,
      balancedPair,
      [budget({ fiscalYear: 2025, status: 'Draft' })],
      checklistComplete
    );
    const check = r.checks.find((c) => c.id === 'budgets-approved');
    expect(check?.ok).toBe(true);
  });

  it('flags checklist-ready when a critical task is incomplete', () => {
    const r = evaluateCloseReadiness(period, balancedPair, [], checklistIncomplete);
    const check = r.checks.find((c) => c.id === 'checklist-ready');
    expect(check?.ok).toBe(false);
    expect(check?.detail).toContain('%');
  });

  it('checklist-ready fails when no checklist is provided', () => {
    const r = evaluateCloseReadiness(period, balancedPair, [], undefined);
    const check = r.checks.find((c) => c.id === 'checklist-ready');
    expect(check?.ok).toBe(false);
  });
});

describe('blockingChecksFor / isTransitionAllowed', () => {
  const incomplete: ReturnType<typeof evaluateCloseReadiness> = {
    ready: false,
    totalDebits: 1000,
    totalCredits: 400,
    difference: 600,
    entryCount: 2,
    checks: [
      { id: 'gl-data', label: 'GL data present', ok: true, detail: 'ok' },
      { id: 'tb-balanced', label: 'Trial balance in balance', ok: false, detail: 'unbalanced' },
      { id: 'budgets-approved', label: 'Fiscal-year budgets approved', ok: false, detail: 'draft' },
      {
        id: 'checklist-ready',
        label: 'Critical close tasks complete',
        ok: false,
        detail: 'incomplete',
      },
    ],
  };

  it('soft-close only requires gl-data and tb-balanced', () => {
    const blocks = blockingChecksFor(incomplete, 'soft-close');
    expect(blocks.map((c) => c.id)).toEqual(['tb-balanced']);
  });

  it('hard-close and lock require all four checks', () => {
    expect(blockingChecksFor(incomplete, 'hard-close').map((c) => c.id)).toEqual([
      'tb-balanced',
      'budgets-approved',
      'checklist-ready',
    ]);
    expect(blockingChecksFor(incomplete, 'lock').map((c) => c.id)).toEqual([
      'tb-balanced',
      'budgets-approved',
      'checklist-ready',
    ]);
  });

  it('reopen and force-reopen are never blocked', () => {
    expect(blockingChecksFor(incomplete, 'reopen')).toEqual([]);
    expect(blockingChecksFor(incomplete, 'force-reopen')).toEqual([]);
  });

  it('isTransitionAllowed reflects the blocking checks', () => {
    expect(isTransitionAllowed(incomplete, 'soft-close')).toBe(false);
    expect(isTransitionAllowed(incomplete, 'reopen')).toBe(true);
  });

  it('handles an unknown transition string defensively', () => {
    const r = blockingChecksFor(incomplete, 'some-unknown' as CloseTransition);
    expect(r).toEqual([]);
  });

  it('allows all transitions when readiness is fully ready', () => {
    const ready: ReturnType<typeof evaluateCloseReadiness> = {
      ready: true,
      totalDebits: 1000,
      totalCredits: 1000,
      difference: 0,
      entryCount: 2,
      checks: [
        { id: 'gl-data', label: 'GL data present', ok: true, detail: 'ok' },
        { id: 'tb-balanced', label: 'Trial balance in balance', ok: true, detail: 'ok' },
        { id: 'budgets-approved', label: 'Fiscal-year budgets approved', ok: true, detail: 'ok' },
        { id: 'checklist-ready', label: 'Critical close tasks complete', ok: true, detail: 'ok' },
      ],
    };
    expect(isTransitionAllowed(ready, 'hard-close')).toBe(true);
    expect(isTransitionAllowed(ready, 'lock')).toBe(true);
  });
});
