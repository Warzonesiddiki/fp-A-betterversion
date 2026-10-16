/**
 * P1-4 consumer-coverage interop test.
 *
 * Why this file exists: `GLTrialBalancePage.test.tsx` mocks `@/store/glStore`
 * wholesale, and `glStore` is tested on its own — so a store change that breaks
 * what this screen shows would pass both suites. Measured before this file was
 * added: `store/glStore` appeared in 0 test files.
 *
 * This suite drives the REAL store and the REAL page together: a balanced
 * journal is imported through the public store action, and the rendered screen
 * must show the amounts that import produced. No value in this file comes from
 * a fixture the page could read instead of the store (the sibling smoke test
 * uses 100000/50000; these journals use 250/875 so a fixture leak cannot pass).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import GLTrialBalancePage from '@/pages/data/GLTrialBalancePage';
import { useGLStore } from '@/store/glStore';
import { useGLTrialBalanceStore } from '@/store/glTrialBalanceStore';
import { actAs } from '@/test/rbacFixtures';
import { setClock, resetClock } from '@/utils/clock';

/** Pinned instant: batch ids and history timestamps must not drift (NFR-001). */
const PINNED = '2026-03-31T10:00:00.000Z';

function resetGLStores() {
  useGLStore.setState({
    entries: [],
    trialBalance: [],
    accountAnalysis: null,
    importHistory: [],
    lastImportEntryIds: [],
    lastImportResult: null,
    importStatus: 'idle',
    importProgress: 0,
    importError: null,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/trial-balance']}>
      <GLTrialBalancePage />
    </MemoryRouter>
  );
}

describe('GLTrialBalancePage ↔ glStore interop (P1-4 consumer coverage)', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(PINNED);
    resetGLStores();
    useGLTrialBalanceStore.getState().reset();
  });

  afterEach(() => {
    resetClock();
  });

  it('renders the trial balance the real store derives from an imported journal', () => {
    const result = useGLStore.getState().importGLData(
      [
        { accountCode: '1000', accountName: 'Cash', date: '2026-03-15', debit: 250, credit: 0 },
        { accountCode: '4000', accountName: 'Revenue', date: '2026-03-15', debit: 0, credit: 250 },
      ],
      'trial-balance.csv'
    );
    expect(result.success).toBe(true);
    // A committed import deliberately drops derived aggregates; regenerating
    // them is the page's job, so this assertion is what makes the screen's
    // numbers meaningful rather than leftovers.
    expect(useGLStore.getState().trialBalance).toHaveLength(0);

    renderPage();

    // The page generated the trial balance from the real store…
    const derived = useGLStore.getState().trialBalance;
    expect(derived.map((row) => row.accountCode).sort()).toEqual(['1000', '4000']);
    expect(derived.find((row) => row.accountCode === '1000')?.netChange).toBe(250);
    expect(derived.find((row) => row.accountCode === '4000')?.netChange).toBe(-250);

    // …and the screen shows those amounts (250 appears in no fixture).
    const table = screen.getByRole('table', { name: /GL trial balance/i });
    expect(within(table).getByText('1000')).toBeTruthy();
    expect(within(table).getByText('4000')).toBeTruthy();
    const cashRow = within(table).getByText('1000').closest('tr');
    expect(cashRow).not.toBeNull();
    expect(within(cashRow!).getAllByText(/250/).length).toBeGreaterThan(0);

    // The balanced banner and the account/entry counts are store-derived too.
    expect(screen.getByText(/Trial Balance is Balanced/i)).toBeTruthy();
    expect(screen.getByText(/2 accounts/)).toBeTruthy();
    expect(screen.getByText(/2 entries/)).toBeTruthy();
  });

  it('updates the rendered rows when the store changes after mount', () => {
    useGLStore.getState().importGLData(
      [
        { accountCode: '1000', accountName: 'Cash', date: '2026-03-15', debit: 250, credit: 0 },
        { accountCode: '4000', accountName: 'Revenue', date: '2026-03-15', debit: 0, credit: 250 },
      ],
      'first.csv'
    );
    renderPage();
    const table = screen.getByRole('table', { name: /GL trial balance/i });
    expect(within(table).queryByText('5000')).toBeNull();

    act(() => {
      const second = useGLStore.getState().importGLData(
        [
          {
            accountCode: '5000',
            accountName: 'Expenses',
            date: '2026-03-20',
            debit: 875,
            credit: 0,
          },
          {
            accountCode: '2000',
            accountName: 'Payables',
            date: '2026-03-20',
            debit: 0,
            credit: 875,
          },
        ],
        'second.csv'
      );
      expect(second.success).toBe(true);
      useGLStore.getState().generateTrialBalance();
    });

    // The screen follows the store: the new accounts and the new amount render.
    const refreshed = screen.getByRole('table', { name: /GL trial balance/i });
    expect(within(refreshed).getByText('5000')).toBeTruthy();
    expect(within(refreshed).getByText('2000')).toBeTruthy();
    const expensesRow = within(refreshed).getByText('5000').closest('tr');
    expect(within(expensesRow!).getAllByText(/875/).length).toBeGreaterThan(0);
  });
});
