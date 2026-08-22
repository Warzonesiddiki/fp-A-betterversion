// =============================================================================
// GLJournalsPage tests — K30 four-states
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): glStore entries drive the journal
// table. There is deliberately NO loading-skeleton spec: the store reads are
// synchronous and the page invents no fetch; in-flight filtering feedback is
// the real useTransition pending state.
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import GLJournalsPage from '@/pages/data/GLJournalsPage';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

function makeEntry(overrides: Partial<GLEntry> & { id: string }): GLEntry {
  return {
    accountId: 'acct-1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-08',
    periodName: 'August 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-08-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

function postedLedger(): GLEntry[] {
  return [
    makeEntry({
      id: 'gl-1',
      accountCode: '1000',
      accountName: 'Cash',
      debit: 1500,
      description: 'Receipt 42',
      reference: 'R-42',
    }),
    makeEntry({
      id: 'gl-2',
      accountCode: '4000',
      accountName: 'Revenue',
      credit: 1500,
      description: 'Invoice 42',
      reference: 'I-42',
    }),
  ];
}

/** Stub the blob-URL boundary (unimplemented in jsdom) for export tests. */
function stubBlobUrl(create: () => string) {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(create),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [], trialBalance: [] });
  // Anchor clicks must not attempt real navigation in jsdom.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

describe('GLJournalsPage', () => {
  it('renders posted journal rows and money totals from real glStore entries (content state)', () => {
    useGLStore.setState({ entries: postedLedger() });
    render(<GLJournalsPage />);
    expect(screen.getByRole('heading', { name: /general journal/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /gl journal entries/i })).toBeInTheDocument();
    expect(screen.getByText('Receipt 42')).toBeInTheDocument();
    expect(screen.getByText('Invoice 42')).toBeInTheDocument();
    expect(screen.getByText('2 total entries')).toBeInTheDocument();
    expect(screen.getByText(/total \(2 entries\)/i)).toBeInTheDocument();
  });

  it('K30: an empty ledger renders the shared EmptyState under the page h1 with an import CTA', () => {
    useGLStore.setState({ entries: [] });
    render(<GLJournalsPage />);
    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(screen.getByRole('heading', { name: /general journal/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no journal entries/i)).toBeInTheDocument();
    expect(screen.getByTestId('journals-empty-import')).toBeInTheDocument();
  });

  it('K30: a failed CSV export renders ErrorState (role=alert) whose retry succeeds', async () => {
    useGLStore.setState({ entries: postedLedger() });
    let calls = 0;
    stubBlobUrl(() => {
      calls += 1;
      if (calls === 1) throw new Error('blob storage unavailable');
      return 'blob:journals-ok';
    });
    render(<GLJournalsPage />);

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not export journals/i);
    expect(alert).toHaveTextContent(/blob storage unavailable/i);

    // Retry runs exactly the failed export over the same filtered rows.
    fireEvent.click(screen.getByRole('button', { name: /retry export/i }));
    await waitFor(() => {
      expect(calls).toBe(2);
    });
    expect(URL.createObjectURL).toHaveLastReturnedWith('blob:journals-ok');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('filters by search text through the real transition without fabricating rows', async () => {
    useGLStore.setState({ entries: postedLedger() });
    render(<GLJournalsPage />);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Invoice' } });
    // The search update is intentionally non-urgent (useTransition); wait for
    // the deferred re-filter to land.
    await waitFor(() => {
      expect(screen.queryByText('Receipt 42')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Invoice 42')).toBeInTheDocument();
    // The footer always says "entries", even for a single row.
    expect(screen.getByText(/total \(1 entr(?:y|ies)\)/i)).toBeInTheDocument();
  });
});
