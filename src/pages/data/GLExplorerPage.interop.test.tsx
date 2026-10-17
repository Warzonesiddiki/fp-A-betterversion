/**
 * P1-4 consumer-coverage interop test (second screen).
 *
 * `GLExplorerPage.test.tsx` mocks `@/store/glStore` with an empty store, and
 * `glStore` is tested alone — measured before this file: `store/glStore`
 * appeared in 0 test files. This suite runs the REAL store and the REAL page
 * together, so the screen's counts, money totals, rows and import provenance
 * are all store-derived values that no fixture could supply.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import GLExplorerPage from '@/pages/data/GLExplorerPage';
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
    <MemoryRouter initialEntries={['/data/gl-explorer']}>
      <GLExplorerPage />
    </MemoryRouter>
  );
}

/** Import one balanced journal through the public store action. */
function importBalancedJournal() {
  return useGLStore.getState().importGLData(
    [
      {
        accountCode: '9000',
        accountName: 'Rent Expense',
        date: '2026-03-15',
        debit: 250,
        credit: 0,
        description: 'March rent',
      },
      {
        accountCode: '6000',
        accountName: 'Prepaid Rent',
        date: '2026-03-15',
        debit: 0,
        credit: 250,
        description: 'March rent offset',
      },
    ],
    'explorer.csv'
  );
}

describe('GLExplorerPage ↔ glStore interop (P1-4 consumer coverage)', () => {
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
    expect(screen.getByText('No GL Data')).toBeTruthy();
  });

  it('renders counts, money totals, rows and import provenance from the real store', () => {
    const result = importBalancedJournal();
    expect(result.success).toBe(true);

    renderPage();

    // Counts are derived from the store, not from a fixture.
    const rows = useGLStore.getState().entries;
    expect(rows).toHaveLength(2);
    expect(screen.getByText('Journal lines').parentElement?.textContent).toContain('2');
    expect(screen.getByText('Active accounts').parentElement?.textContent).toContain('2');

    // Money totals come from the store's decimal aggregation (250 each side).
    expect(screen.getByText('Debits').parentElement?.textContent).toContain('250');
    expect(screen.getByText('Credits').parentElement?.textContent).toContain('250');

    // Both journal lines render, with their real description text.
    const table = screen.getByRole('table', { name: /General ledger explorer/i });
    expect(within(table).getByText('9000')).toBeTruthy();
    expect(within(table).getByText('6000')).toBeTruthy();
    expect(within(table).getAllByText('March rent')).toHaveLength(1);
    expect(within(table).getAllByText('March rent offset')).toHaveLength(1);

    // Provenance is produced only by a real import: file name + source row.
    expect(within(table).getByText('explorer.csv:2')).toBeTruthy();
    expect(within(table).getByText('explorer.csv:3')).toBeTruthy();

    expect(screen.getByText(/2 total · 2 matching/)).toBeTruthy();
  });

  it('states the matching count and the display limit exactly when the ledger is longer', () => {
    // 125 balanced pairs = 250 journal lines in one committed batch.
    const pairs = Array.from({ length: 125 }, (_, i) => [
      {
        accountCode: '5000',
        accountName: 'Supplies',
        date: '2026-03-15',
        debit: 1,
        credit: 0,
        description: `Supplies ${i}`,
      },
      {
        accountCode: '6000',
        accountName: 'Payable',
        date: '2026-03-15',
        debit: 0,
        credit: 1,
        description: `Payable ${i}`,
      },
    ]).flat();
    const result = useGLStore.getState().importGLData(pairs, 'long.csv');
    expect(result.success).toBe(true);

    renderPage();

    expect(screen.getByText(/250 total · 250 matching · showing first 200/)).toBeTruthy();

    // The table really is windowed at 200 data rows (plus the header row).
    const table = screen.getByRole('table', { name: /General ledger explorer/i });
    expect(within(table).getAllByRole('row')).toHaveLength(201);
  });

  it('filters the store-derived rows through the screen search box', () => {
    importBalancedJournal();
    renderPage();

    const table = screen.getByRole('table', { name: /General ledger explorer/i });
    expect(within(table).getByText('6000')).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText('Explore entries...'), {
      target: { value: 'Rent Expense' },
    });

    const refreshed = screen.getByRole('table', { name: /General ledger explorer/i });
    expect(within(refreshed).getByText('9000')).toBeTruthy();
    expect(within(refreshed).queryByText('6000')).toBeNull();
  });
});
