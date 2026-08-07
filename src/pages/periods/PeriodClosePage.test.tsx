// =============================================================================
// PeriodClosePage tests — F-01 month-end close client workflow
// -----------------------------------------------------------------------------
// Real stores (no module mocks): glStore entries drive the readiness checks,
// periodCloseStore drives the state machine, authStore (actAs) drives RBAC.
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import PeriodClosePage from '@/pages/periods/PeriodClosePage';
import { actAs } from '@/test/rbacFixtures';
import { usePeriodCloseStore } from '@/store/periodCloseStore';
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

/** Two entries in August 2026 that balance to the cent. */
function balancedAugustEntries(): GLEntry[] {
  return [
    makeEntry({
      id: 'e1',
      accountId: 'acct-1',
      accountCode: '1000',
      debit: 1250,
      netChange: 1250,
      amount: 1250,
    }),
    makeEntry({
      id: 'e2',
      accountId: 'acct-2',
      accountCode: '4000',
      credit: 1250,
      netChange: -1250,
      amount: -1250,
    }),
  ];
}

function unbalancedAugustEntries(): GLEntry[] {
  return [
    makeEntry({
      id: 'e1',
      accountId: 'acct-1',
      accountCode: '1000',
      debit: 1250,
      netChange: 1250,
      amount: 1250,
    }),
    makeEntry({
      id: 'e2',
      accountId: 'acct-2',
      accountCode: '4000',
      credit: 1249.99,
      netChange: -1249.99,
      amount: -1249.99,
    }),
  ];
}

function resetStores() {
  usePeriodCloseStore.setState({
    entries: {},
    checklists: {},
    chain: [],
    initialized: false,
  });
  useGLStore.setState({ entries: [], trialBalance: [] });
}

describe('PeriodClosePage', () => {
  beforeEach(() => {
    resetStores();
    actAs('Admin');
  });

  it('renders the page with a fiscal-period grid and current period highlighted', async () => {
    useGLStore.setState({ entries: balancedAugustEntries() });
    render(<PeriodClosePage />);
    expect(
      await screen.findByRole('heading', { name: /Period Close/i, level: 1 })
    ).toBeInTheDocument();
    // August 2026 is the current period (today = 2026-08-07).
    const current = await screen.findByRole('button', { name: /August 2026.*current period/i });
    expect(current).toHaveAttribute('aria-pressed', 'true');
    // 12 fiscal periods render.
    expect(screen.getAllByRole('button', { name: /2026/ }).length).toBeGreaterThanOrEqual(12);
  });

  it('empty state: no GL data blocks the close with an explicit reason', async () => {
    render(<PeriodClosePage />);
    // Default selection = current period (August).
    expect(
      await screen.findByText(/No GL entries in August 2026 — import data before closing/i)
    ).toBeInTheDocument();
    const softClose = screen.getByRole('button', { name: /Start soft close/i });
    expect(softClose).toBeDisabled();
    expect(screen.getByText(/Trial balance in balance/i)).toBeInTheDocument();
    expect(screen.getByText(/Debits/i)).toBeInTheDocument();
  });

  it('balanced GL lets Admin start the close and the state persists', async () => {
    useGLStore.setState({ entries: balancedAugustEntries() });
    render(<PeriodClosePage />);

    const softClose = await screen.findByRole('button', { name: /Start soft close/i });
    expect(softClose).toBeEnabled();
    fireEvent.click(softClose);

    // State machine advances; the header badge + grid badge update.
    await waitFor(() => {
      expect(usePeriodCloseStore.getState().entries['P08']?.state).toBe('soft-close');
    });
    const badges = await screen.findAllByText('Soft Close');
    expect(badges.length).toBeGreaterThanOrEqual(1);
    // Live region announces the change.
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/August 2026.*Soft Close/i);
    });
    // The close button is replaced by the hard-close action.
    expect(screen.getByRole('button', { name: /Hard close/i })).toBeInTheDocument();
  });

  it('unbalanced trial balance blocks the close with an explicit reason', async () => {
    useGLStore.setState({ entries: unbalancedAugustEntries() });
    render(<PeriodClosePage />);

    // Soft-close itself is blocked while the books are out of balance.
    const softClose = await screen.findByRole('button', { name: /Start soft close/i });
    expect(softClose).toBeDisabled();
    expect(screen.getByText(/Debits 1,250\.00 ≠ Credits 1,249\.99/i)).toBeInTheDocument();
  });

  it('hard-close becomes blocked reactively when entries go out of balance', async () => {
    useGLStore.setState({ entries: balancedAugustEntries() });
    render(<PeriodClosePage />);

    fireEvent.click(await screen.findByRole('button', { name: /Start soft close/i }));
    await waitFor(() => {
      expect(usePeriodCloseStore.getState().entries['P08']?.state).toBe('soft-close');
    });

    // Books go out of balance after soft-close → hard-close is gated.
    useGLStore.setState({ entries: unbalancedAugustEntries() });
    const hardClose = await screen.findByRole('button', { name: /Hard close/i });
    await waitFor(() => expect(hardClose).toBeDisabled());
    expect(await screen.findByText(/Debits 1,250\.00 ≠ Credits 1,249\.99/i)).toBeInTheDocument();
  });

  it('RBAC: Viewer sees a read-only page with no close actions', async () => {
    actAs('Viewer');
    useGLStore.setState({ entries: balancedAugustEntries() });
    render(<PeriodClosePage />);
    expect(await screen.findByText(/Read-only view/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start soft close/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hard close/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Lock period/i })).not.toBeInTheDocument();
  });

  it('checklist renders REAL FinancialCloseEngine tasks and progress', async () => {
    render(<PeriodClosePage />);
    expect(await screen.findByText('Bank reconciliation')).toBeInTheDocument();
    expect(screen.getByText('CFO approval')).toBeInTheDocument();
    expect(screen.getByText('File US-GAAP regulatory submission')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Close checklist progress/i })).toHaveAttribute(
      'aria-valuenow',
      '0'
    );
  });

  it('audit trail panel lists events after a close', async () => {
    useGLStore.setState({ entries: balancedAugustEntries() });
    render(<PeriodClosePage />);
    const softClose = await screen.findByRole('button', { name: /Start soft close/i });
    fireEvent.click(softClose);
    await waitFor(() => {
      expect(usePeriodCloseStore.getState().chain.filter((c) => c.periodId === 'P08')).toHaveLength(
        1
      );
    });
    // The audit trail row shows the transition from→to (text split by the
    // chevron icon, so match on the paragraph's full text content).
    expect(
      await screen.findByText((content, el) => {
        return el?.tagName === 'P' && content.includes('open') && content.includes('soft-close');
      })
    ).toBeInTheDocument();
  });

  it('renders the close checklist status change via the select (Admin only)', async () => {
    render(<PeriodClosePage />);
    const select = await screen.findByLabelText('Status for Bank reconciliation');
    fireEvent.change(select, { target: { value: 'in-progress' } });
    await waitFor(() => {
      const inst = usePeriodCloseStore
        .getState()
        .checklists['P08']?.instances.find((i) => i.taskId === 'recon');
      expect(inst?.status).toBe('in-progress');
    });
  });

  it('SOX bridge link is present', async () => {
    render(<PeriodClosePage />);
    expect(await screen.findByRole('link', { name: /SOX Compliance/i })).toHaveAttribute(
      'href',
      '/audit/sox'
    );
  });
});
