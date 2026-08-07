// =============================================================================
// PeriodClosePage a11y tests — labels, keyboard, live region
// -----------------------------------------------------------------------------
// Patterned after the Q5 a11y suite: every interactive control needs an
// accessible name, the workflow must be keyboard-operable, and status changes
// must be announced via a polite live region (Q5.4).
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import PeriodClosePage from '@/pages/periods/PeriodClosePage';
import { actAs } from '@/test/rbacFixtures';
import { usePeriodCloseStore } from '@/store/periodCloseStore';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

function balancedEntries(): GLEntry[] {
  return [
    {
      id: 'e1',
      accountId: 'acct-1',
      accountCode: '1000',
      accountName: 'Cash',
      period: '2026-08',
      periodName: 'August 2026',
      debit: 100,
      credit: 0,
      netChange: 100,
      date: '2026-08-15',
      amount: 100,
      description: '',
      reference: '',
    },
    {
      id: 'e2',
      accountId: 'acct-2',
      accountCode: '4000',
      accountName: 'Revenue',
      period: '2026-08',
      periodName: 'August 2026',
      debit: 0,
      credit: 100,
      netChange: -100,
      date: '2026-08-15',
      amount: -100,
      description: '',
      reference: '',
    },
  ];
}

describe('PeriodClosePage a11y', () => {
  beforeEach(() => {
    usePeriodCloseStore.setState({ entries: {}, checklists: {}, chain: [], initialized: false });
    useGLStore.setState({ entries: [] });
    actAs('Admin');
  });

  it('has exactly one live region with polite politeness and atomic announcements', async () => {
    render(<PeriodClosePage />);
    const statuses = await screen.findAllByRole('status');
    // LiveRegion (role=status) is the only status element on the page.
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true');
  });

  it('period cards are keyboard-focusable buttons with accessible names', async () => {
    render(<PeriodClosePage />);
    const august = await screen.findByRole('button', { name: /August 2026.*current period/i });
    august.focus();
    expect(august).toHaveFocus();
    // Keyboard "selects" a period card.
    fireEvent.keyDown(august, { key: 'Enter' });
    expect(august).toHaveAttribute('aria-pressed', 'true');
  });

  it('every action button has an accessible name and the reason input is labelled', async () => {
    useGLStore.setState({ entries: balancedEntries() });
    render(<PeriodClosePage />);
    const close = await screen.findByRole('button', { name: /Start soft close/i });
    expect(close).toBeInTheDocument();
    // Reason input has a sr-only label (present in the a11y tree).
    const reason = screen.getByLabelText(/Reason for close or reopen/i);
    expect(reason).toBeInTheDocument();
  });

  it('checklist selects and assignee inputs are labelled', async () => {
    render(<PeriodClosePage />);
    const select = await screen.findByLabelText(/Status for Bank reconciliation/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByLabelText(/Assignee for Bank reconciliation/i)).toBeInTheDocument();
  });

  it('live region announces a status change after closing a period', async () => {
    useGLStore.setState({ entries: balancedEntries() });
    render(<PeriodClosePage />);
    const close = await screen.findByRole('button', { name: /Start soft close/i });
    fireEvent.click(close);
    await waitFor(() => {
      expect(usePeriodCloseStore.getState().entries['P08']?.state).toBe('soft-close');
    });
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/August 2026.*Soft Close/i);
    });
  });

  it('heading hierarchy starts at h1 and sections are labelled', async () => {
    render(<PeriodClosePage />);
    expect(
      await screen.findByRole('heading', { level: 1, name: /Period Close/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Fiscal periods/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Close readiness checks/i)).toBeInTheDocument();
  });
});
