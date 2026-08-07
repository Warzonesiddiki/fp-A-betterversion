// =============================================================================
// PeriodClosePage money-exactness tests
// -----------------------------------------------------------------------------
// The pre-close trial-balance check MUST be exact: floats like 0.1 + 0.2 ≠ 0.3
// would falsely block (or falsely pass) a close. These tests falsify the float
// path with the canonical 0.1+0.2 case plus cent-level drift cases, at both
// the helper layer and the page layer.
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import PeriodClosePage from '@/pages/periods/PeriodClosePage';
import { actAs } from '@/test/rbacFixtures';
import { useGLStore } from '@/store/glStore';
import { usePeriodCloseStore } from '@/store/periodCloseStore';
import { evaluateCloseReadiness, isTransitionAllowed } from '@/utils/periodCloseReadiness';
import type { FiscalPeriod, GLEntry } from '@/types';

const AUGUST: FiscalPeriod = {
  id: 'P08',
  year: 2026,
  periodNumber: 8,
  name: 'August',
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  periodType: 'Monthly',
  isAdjustingPeriod: false,
  isClosed: false,
  closedAt: null,
  closedBy: null,
};

function entry(id: string, debit: number, credit: number): GLEntry {
  return {
    id,
    accountId: `acct-${id}`,
    accountCode: `1${id.replace(/\D/g, '')}000`,
    accountName: 'Account',
    period: '2026-08',
    periodName: 'August 2026',
    debit,
    credit,
    netChange: debit - credit,
    date: '2026-08-15',
    amount: debit - credit,
    description: '',
    reference: '',
  };
}

function resetStores() {
  usePeriodCloseStore.setState({ entries: {}, checklists: {}, chain: [], initialized: false });
  useGLStore.setState({ entries: [] });
}

describe('evaluateCloseReadiness — money-exact trial balance', () => {
  it('0.1 + 0.2 === 0.3 exactly (float falsifier would report unbalanced)', () => {
    const readiness = evaluateCloseReadiness(
      AUGUST,
      [entry('a', 0.1, 0), entry('b', 0.2, 0), entry('c', 0, 0.3)],
      [],
      undefined
    );
    const tb = readiness.checks.find((c) => c.id === 'tb-balanced');
    expect(tb?.ok).toBe(true);
    expect(readiness.totalDebits).toBe(0.3);
    expect(readiness.totalCredits).toBe(0.3);
    expect(readiness.difference).toBe(0);
    // Soft-close and hard-close are both allowed on these books.
    expect(isTransitionAllowed(readiness, 'soft-close')).toBe(true);
  });

  it('cent-level drift (0.334 × 3 style) cannot fake a balance', () => {
    // 0.334 × 3 = 1.002 → 1.00 at 2dp vs credit 1.01: genuinely unbalanced.
    const entries = [
      entry('a', 0.334, 0),
      entry('b', 0.334, 0),
      entry('c', 0.334, 0),
      entry('d', 0, 1.01),
    ];
    const readiness = evaluateCloseReadiness(AUGUST, entries, [], undefined);
    const tb = readiness.checks.find((c) => c.id === 'tb-balanced');
    expect(tb?.ok).toBe(false);
    expect(readiness.difference).toBe(-0.01);
    expect(isTransitionAllowed(readiness, 'soft-close')).toBe(false);
  });

  it('0.335 × 3 = 1.005 rounds half-up to 1.01 and balances exactly', () => {
    // Decimal half-up rounding: 1.005 → 1.01, matching the credit — no false
    // imbalance from accumulated float error.
    const entries = [
      entry('a', 0.335, 0),
      entry('b', 0.335, 0),
      entry('c', 0.335, 0),
      entry('d', 0, 1.01),
    ];
    const readiness = evaluateCloseReadiness(AUGUST, entries, [], undefined);
    const tb = readiness.checks.find((c) => c.id === 'tb-balanced');
    expect(tb?.ok).toBe(true);
    expect(readiness.difference).toBe(0);
  });

  it('empty ledger is not balanced (no data to certify)', () => {
    const readiness = evaluateCloseReadiness(AUGUST, [], [], undefined);
    expect(readiness.entryCount).toBe(0);
    expect(isTransitionAllowed(readiness, 'soft-close')).toBe(false);
    const gl = readiness.checks.find((c) => c.id === 'gl-data');
    expect(gl?.ok).toBe(false);
  });

  it('entries outside the period do not affect its balance', () => {
    const outside: GLEntry = { ...entry('x', 999999, 0), date: '2026-07-15' };
    const inside = [entry('a', 100, 0), entry('b', 0, 100)];
    const readiness = evaluateCloseReadiness(AUGUST, [...inside, outside], [], undefined);
    expect(readiness.entryCount).toBe(2);
    expect(readiness.totalDebits).toBe(100);
    expect(readiness.totalCredits).toBe(100);
    expect(isTransitionAllowed(readiness, 'soft-close')).toBe(true);
  });

  it('budget approval gate blocks hard-close when a year budget is unapproved', () => {
    const entries = [entry('a', 100, 0), entry('b', 0, 100)];
    const unapproved = [
      {
        id: 'b1',
        name: 'FY2026',
        description: '',
        fiscalYear: 2026,
        status: 'Draft' as const,
        template: 'Standard',
        departments: [],
        entities: [],
        baseCurrency: 'USD',
        totalAmount: 1000,
        createdBy: 'u',
        createdByName: 'U',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
        version: 1,
        progress: 0,
      },
    ];
    const readiness = evaluateCloseReadiness(AUGUST, entries, unapproved, undefined);
    expect(isTransitionAllowed(readiness, 'soft-close')).toBe(true);
    expect(isTransitionAllowed(readiness, 'hard-close')).toBe(false);
    const chk = readiness.checks.find((c) => c.id === 'budgets-approved');
    expect(chk?.ok).toBe(false);
  });
});

describe('PeriodClosePage money display', () => {
  beforeEach(() => {
    resetStores();
    actAs('Admin');
  });

  it('renders TB totals formatted to 2dp from real GL (no raw float display)', async () => {
    useGLStore.setState({
      entries: [entry('a', 1250.5, 0), entry('b', 0, 1250.5)],
    });
    render(<PeriodClosePage />);
    expect(await screen.findByText(/Debits \$1,250\.50/i)).toBeInTheDocument();
    expect(screen.getByText(/Credits \$1,250\.50/i)).toBeInTheDocument();
    expect(screen.getByText(/Difference \$0\.00/i)).toBeInTheDocument();
  });

  it('float-drift books (0.1 + 0.2 vs 0.3) pass the close gate (page-level)', async () => {
    // Floats sum 0.1+0.2 = 0.30000000000000004 ≠ 0.3; the money primitive
    // sees an exactly balanced ledger, so the button must be enabled.
    useGLStore.setState({
      entries: [entry('a', 0.1, 0), entry('b', 0.2, 0), entry('c', 0, 0.3)],
    });
    render(<PeriodClosePage />);
    const btn = await screen.findByRole('button', { name: /Start soft close/i });
    await waitFor(() => expect(btn).toBeEnabled());
  });

  it('a truly cent-imbalanced ledger disables the close button (page-level)', async () => {
    useGLStore.setState({
      entries: [entry('a', 0.1, 0), entry('b', 0.2, 0), entry('c', 0, 0.29)],
    });
    render(<PeriodClosePage />);
    const btn = await screen.findByRole('button', { name: /Start soft close/i });
    await waitFor(() => expect(btn).toBeDisabled());
  });
});
