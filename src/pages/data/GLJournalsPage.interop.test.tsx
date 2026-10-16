/**
 * P1-4 consumer-coverage interop test (third screen).
 *
 * `GLJournalsPage.test.tsx` mocks `@/store/glStore` and the store is covered
 * in isolation elsewhere — measured before this file landed: the joint
 * store↔journals-screen contract had no test. This suite runs the REAL store
 * and the REAL page together, so the entry count, filtered count, footer
 * debit/credit totals (via the `computeJournalTotals` money primitive) and
 * every rendered row are store-derived values that no fixture could supply.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import GLJournalsPage from '@/pages/data/GLJournalsPage';
import { useGLStore } from '@/store/glStore';
import { actAs } from '@/test/rbacFixtures';
import { setClock, resetClock } from '@/utils/clock';

/** Pinned instant: ids and history timestamps must not drift (NFR-001). */
const PINNED = '2026-03-31T10:00:00.000Z';

function resetGLStore() {
  useGLStore.setState({
    entries: [],
    accounts: [],
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
    <MemoryRouter initialEntries={['/data/gl-journals']}>
      <GLJournalsPage />
    </MemoryRouter>
  );
}

/**
 * Two balanced journals in two different months, through the public store
 * action, so ids, provenance and control totals are all real import output.
 */
function importTwoJournals() {
  return useGLStore.getState().importGLData(
    [
      {
        accountCode: '9000',
        accountName: 'Rent Expense',
        date: '2026-02-15',
        debit: 400,
        credit: 0,
        description: 'February rent',
        reference: 'JE-FEB',
      },
      {
        accountCode: '6000',
        accountName: 'Prepaid Rent',
        date: '2026-02-15',
        debit: 0,
        credit: 400,
        description: 'February rent offset',
        reference: 'JE-FEB',
      },
      {
        accountCode: '9000',
        accountName: 'Rent Expense',
        date: '2026-03-15',
        debit: 250,
        credit: 0,
        description: 'March rent',
        reference: 'JE-MAR',
      },
      {
        accountCode: '6000',
        accountName: 'Prepaid Rent',
        date: '2026-03-15',
        debit: 0,
        credit: 250,
        description: 'March rent offset',
        reference: 'JE-MAR',
      },
    ],
    'journals.csv'
  );
}

describe('GLJournalsPage ↔ glStore interop (P1-4 consumer coverage)', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(PINNED);
    resetGLStore();
  });

  afterEach(() => {
    resetClock();
  });

  it('shows the empty state when the real store holds nothing', () => {
    renderPage();
    expect(screen.getByText('No journal entries')).toBeTruthy();
    expect(screen.getByTestId('journals-empty-import')).toBeTruthy();
  });

  it('renders counts, rows, references and money totals from the real store', () => {
    const result = importTwoJournals();
    expect(result.success).toBe(true);

    renderPage();

    const rows = useGLStore.getState().entries;
    expect(rows).toHaveLength(4);
    expect(screen.getByText('4 total entries')).toBeTruthy();

    const table = screen.getByRole('table', { name: /GL journal entries/i });
    expect(within(table).getAllByText('9000')).toHaveLength(2);
    expect(within(table).getAllByText('6000')).toHaveLength(2);
    expect(within(table).getAllByText('February rent')).toHaveLength(1);
    expect(within(table).getAllByText('March rent offset')).toHaveLength(1);
    expect(within(table).getAllByText('JE-FEB')).toHaveLength(2);
    expect(within(table).getAllByText('JE-MAR')).toHaveLength(2);

    // Footer totals come from computeJournalTotals over the store's entries:
    // debits 400 + 250 and credits 400 + 250, in reporting-currency format.
    expect(within(table).getByText('Total (4 entries)')).toBeTruthy();
    const footer = within(table).getAllByRole('row').at(-1)!;
    expect(footer.textContent).toContain('650');
    expect(footer.textContent!.match(/650/g)).toHaveLength(2);
  });

  it('recomputes store-derived rows and totals through the date-range filter', () => {
    importTwoJournals();
    renderPage();

    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-03-01' },
    });

    // Store still holds 4 entries; the screen reports both facts honestly.
    expect(screen.getByText(/4 total entries · 2 filtered/)).toBeTruthy();

    const table = screen.getByRole('table', { name: /GL journal entries/i });
    expect(within(table).queryByText('February rent')).toBeNull();
    expect(within(table).getByText('March rent')).toBeTruthy();

    // Filtered totals recompute: only the March journal (250 per side).
    expect(within(table).getByText('Total (2 entries)')).toBeTruthy();
    const footer = within(table).getAllByRole('row').at(-1)!;
    expect(footer.textContent!.match(/250/g)).toHaveLength(2);
  });

  it('filters store-derived rows through the screen search box', async () => {
    importTwoJournals();
    renderPage();

    const search = screen.getByPlaceholderText('Description or ref...');
    fireEvent.change(search, { target: { value: 'offset' } });

    // Search runs inside startTransition; await the settled render.
    expect(await screen.findByText(/4 total entries · 2 filtered/)).toBeTruthy();

    const table = screen.getByRole('table', { name: /GL journal entries/i });
    expect(within(table).getByText('February rent offset')).toBeTruthy();
    expect(within(table).getByText('March rent offset')).toBeTruthy();
    // Non-matching rows are gone, but each surviving row keeps its reference.
    expect(within(table).queryByText('February rent')).toBeNull();
    expect(within(table).queryByText('March rent')).toBeNull();
    expect(within(table).getAllByText('JE-FEB')).toHaveLength(1);
    expect(within(table).getAllByText('JE-MAR')).toHaveLength(1);
  });
});
