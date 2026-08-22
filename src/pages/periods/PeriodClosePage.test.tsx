// =============================================================================
// PeriodClosePage tests — F-01 month-end close client workflow
// -----------------------------------------------------------------------------
// Real stores (no module mocks): glStore entries drive the readiness checks,
// periodCloseStore drives the state machine, authStore (actAs) drives RBAC.
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
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

/** Real store actions, captured once so per-test overrides are restorable. */
const realInitialize = usePeriodCloseStore.getState().initialize;
const realTransition = usePeriodCloseStore.getState().transition;

function resetStores() {
  usePeriodCloseStore.setState({
    entries: {},
    checklists: {},
    chain: [],
    initialized: false,
    initialize: realInitialize,
    transition: realTransition,
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

  // K32-8: blocking reason exposed via aria-disabled + associated text/live
  // region instead of a title-only tooltip.
  it('K32-8: blocked soft-close exposes reason via aria-describedby and visible live region', async () => {
    useGLStore.setState({ entries: unbalancedAugustEntries() });
    render(<PeriodClosePage />);

    const softClose = await screen.findByRole('button', { name: /Start soft close/i });
    expect(softClose).toBeDisabled();
    expect(softClose).toHaveAttribute('aria-disabled', 'true');
    expect(softClose).toHaveAttribute('aria-describedby', 'period-close-block-reason');
    expect(softClose).not.toHaveAttribute('title');

    const liveRegion = screen.getByTestId('period-close-block-reason');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent(/Blocked: GL data or trial balance checks fail/i);
    });
  });

  it('K32-8: reopen button blocked on empty reason shows the reason in the live region', async () => {
    useGLStore.setState({ entries: balancedAugustEntries() });
    render(<PeriodClosePage />);
    fireEvent.click(await screen.findByRole('button', { name: /Start soft close/i }));

    const reopen = await screen.findByRole('button', { name: /Reopen period/i });
    expect(reopen).toBeDisabled();
    expect(reopen).toHaveAttribute('aria-describedby', 'period-close-block-reason');
    const liveRegion = screen.getByTestId('period-close-block-reason');
    // After soft-close, hard-close gating may take precedence in blockReason;
    // what matters is that SOME blocking reason is exposed programmatically.
    await waitFor(() => {
      expect(liveRegion.textContent!.length).toBeGreaterThan(0);
    });
    expect(reopen).toHaveAttribute('aria-disabled', 'true');

    // Filling the reason clears the block.
    fireEvent.change(screen.getByLabelText(/Reason for close or reopen/i), {
      target: { value: 'Audit correction' },
    });
    await waitFor(() => {
      expect(reopen).toBeEnabled();
    });
    // The hard-close action may still legitimately be blocked — only the
    // reopen button's own gating (empty reason) was cleared.
    expect(reopen).not.toHaveAttribute('aria-describedby', 'period-close-block-reason');
  });

  // ── K30 four-states (items 4–5): skeleton / empty / error+retry ──────────

  it('K30: shows the hydrate skeleton while the close workflow initializes', () => {
    // Freeze initialization so the pre-hydration branch stays mounted.
    usePeriodCloseStore.setState({ initialized: false, initialize: () => {} });
    render(<PeriodClosePage />);
    expect(screen.getByTestId('period-close-loading')).toBeInTheDocument();
    // h1 discipline: the loading branch keeps a page-level heading.
    expect(screen.getByRole('heading', { name: /period close/i, level: 1 })).toBeInTheDocument();
  });

  it('K30: empty state offers a CTA that re-enters the period-close flow', () => {
    const initSpy = vi.fn();
    usePeriodCloseStore.setState({ initialized: true, entries: {}, initialize: initSpy });
    render(<PeriodClosePage />);
    expect(screen.getByText(/No fiscal periods to close/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('period-close-init'));
    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it('K30: shows an in-flight skeleton region while a transition runs', async () => {
    useGLStore.setState({ entries: balancedAugustEntries() });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    usePeriodCloseStore.setState({
      transition: (async (...args: Parameters<typeof realTransition>) => {
        await gate;
        return realTransition(...args);
      }) as typeof realTransition,
    });
    render(<PeriodClosePage />);
    fireEvent.click(await screen.findByRole('button', { name: /Start soft close/i }));
    expect(screen.getByTestId('period-close-transition-skeleton')).toBeInTheDocument();
    release();
    await waitFor(() => {
      expect(usePeriodCloseStore.getState().entries['P08']?.state).toBe('soft-close');
    });
    expect(screen.queryByTestId('period-close-transition-skeleton')).not.toBeInTheDocument();
  });

  it('K30: failed transition renders ErrorState (role=alert) whose retry succeeds', async () => {
    useGLStore.setState({ entries: balancedAugustEntries() });
    let fail = true;
    usePeriodCloseStore.setState({
      transition: (async (...args: Parameters<typeof realTransition>) => {
        if (fail) {
          return {
            success: false as const,
            newState: 'open' as const,
            error: 'Engine rejected the close',
          };
        }
        return realTransition(...args);
      }) as typeof realTransition,
    });
    render(<PeriodClosePage />);
    fireEvent.click(await screen.findByRole('button', { name: /Start soft close/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Engine rejected the close/i);
    // Retry re-runs exactly the failed transition.
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: /retry soft close/i }));
    await waitFor(() => {
      expect(usePeriodCloseStore.getState().entries['P08']?.state).toBe('soft-close');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
