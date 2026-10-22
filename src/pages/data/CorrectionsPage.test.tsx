/**
 * Phase 5 tracker (DEC-035): corrections are created from accepted
 * findings, advanced only by human clicks, optionally exported from the same
 * records, and re-verified only after a human confirms the proposal.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { actAs } from '@/test/rbacFixtures';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CorrectionsPage from './CorrectionsPage';
import { useGLStore } from '@/store/glStore';
import { useExceptionDispositionStore } from '@/store/exceptionDispositionStore';
import { setClock } from '@/utils/clock';
import type { GLEntry } from '@/types';

const FIXED = '2026-10-15T09:30:00.000Z';
const FINDING_KEY = 'R-006:J-1:2026-01';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToExcel: vi.fn(async () => {}), exportToPDF: vi.fn(async () => {}) },
}));

function entry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: 'x1',
    accountId: '1010',
    accountCode: '1010',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    amount: 0,
    date: '2026-01-05',
    description: 'ok',
    reference: 'J-1',
    journalId: 'J-1',
    ...overrides,
  } as GLEntry;
}

const UNBALANCED: GLEntry[] = [
  entry({ id: 'x1', debit: 500, amount: 500 }),
  entry({
    id: 'x2',
    accountId: '4010',
    accountCode: '4010',
    accountName: 'Revenue',
    credit: 450,
    amount: -450,
  }),
];

function renderPage() {
  return render(
    <BrowserRouter>
      <CorrectionsPage />
    </BrowserRouter>
  );
}

describe('CorrectionsPage (Phase 5)', () => {
  beforeEach(() => {
    actAs('Admin'); // Phase 12: disposition/correction actions require permissions
    setClock(FIXED);
    useGLStore.setState({ entries: UNBALANCED, accounts: [] });
    useExceptionDispositionStore.getState().reset();
  });

  it('creates a correction from an accepted finding and tracks it', () => {
    useExceptionDispositionStore
      .getState()
      .recordDisposition(FINDING_KEY, 'ACCEPT', 'Confirmed with AP', { ruleId: 'R-006' });
    renderPage();

    fireEvent.change(screen.getByLabelText(/Correction instruction/i), {
      target: { value: 'Find the missing 50 credit' },
    });
    fireEvent.change(screen.getByLabelText(/Assignee/i), { target: { value: 'accounts-team' } });
    fireEvent.click(screen.getByRole('button', { name: /Request correction/i }));

    expect(screen.getByText('Find the missing 50 credit')).toBeInTheDocument();
    expect(screen.getAllByText('REQUESTED')[0]).toBeInTheDocument();
    expect(useExceptionDispositionStore.getState().getCorrection(FINDING_KEY)?.assignee).toBe(
      'accounts-team'
    );
  });

  it('human clicks advance REQUESTED → APPLIED; no other path does', () => {
    useExceptionDispositionStore.getState().requestCorrection({
      exceptionId: FINDING_KEY,
      ruleId: 'R-006',
      instruction: 'Fix J-1',
      assignee: 'accounts-team',
    });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Mark applied/i }));
    expect(useExceptionDispositionStore.getState().getCorrection(FINDING_KEY)?.status).toBe(
      'APPLIED'
    );
    expect(screen.getAllByText('APPLIED')[0]).toBeInTheDocument();
    const historySummary = screen.getByText('Correction history (2)');
    fireEvent.click(historySummary);
    expect(historySummary.closest('details')).toHaveProperty('open', true);
    expect(screen.getAllByText('by test-user-admin')).toHaveLength(2);
  });

  it('proposes re-verification when the finding is gone, human confirms', () => {
    useExceptionDispositionStore.getState().requestCorrection({
      exceptionId: 'R-006:J-OLD:2025-12',
      ruleId: 'R-006',
      instruction: 'Fix old journal',
      assignee: 'accounts-team',
    });
    useExceptionDispositionStore
      .getState()
      .updateCorrectionStatus('R-006:J-OLD:2025-12', 'APPLIED');
    renderPage();

    expect(screen.getByText(/no longer flags/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirm re-verified for/i }));
    expect(
      useExceptionDispositionStore.getState().getCorrection('R-006:J-OLD:2025-12')?.status
    ).toBe('REVERIFIED');
  });

  it('filters by status and assignee without restricting the full Excel export', async () => {
    const store = useExceptionDispositionStore.getState();
    store.requestCorrection({
      exceptionId: 'R-006:J-A:2026-01',
      instruction: 'First correction',
      assignee: 'team-a',
    });
    store.updateCorrectionStatus('R-006:J-A:2026-01', 'APPLIED');
    store.requestCorrection({
      exceptionId: 'R-006:J-B:2026-01',
      instruction: 'Second correction',
      assignee: 'team-b',
    });
    store.requestCorrection({
      exceptionId: 'R-006:J-C:2026-01',
      instruction: 'Third correction',
      assignee: 'team-a',
    });
    store.updateCorrectionStatus('R-006:J-C:2026-01', 'APPLIED');

    renderPage();
    fireEvent.change(screen.getByLabelText('Filter by status'), {
      target: { value: 'APPLIED' },
    });
    fireEvent.change(screen.getByLabelText('Filter by assignee'), {
      target: { value: 'team-a' },
    });

    expect(screen.getByText(/Showing 2 of 3 correction requests/)).toBeInTheDocument();
    expect(screen.getByText('First correction')).toBeInTheDocument();
    expect(screen.getByText('Third correction')).toBeInTheDocument();
    expect(screen.queryByText('Second correction')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Export correction list to Excel/i }));
    const { ExportEngine } = await import('@/engines/ExportEngine');
    const exportCalls = vi.mocked(ExportEngine.exportToExcel).mock.calls;
    expect(exportCalls).toHaveLength(1);
    expect(exportCalls[0]?.[0].rows).toHaveLength(3);
  });

  it('does not propose re-verification when there is no ledger to examine', () => {
    useExceptionDispositionStore.getState().requestCorrection({
      exceptionId: 'R-006:J-OLD:2025-12',
      ruleId: 'R-006',
      instruction: 'Fix old journal',
      assignee: 'accounts-team',
    });
    useExceptionDispositionStore
      .getState()
      .updateCorrectionStatus('R-006:J-OLD:2025-12', 'APPLIED');
    useGLStore.setState({ entries: [], accounts: [] });

    renderPage();

    expect(screen.queryByText('Proposed re-verifications')).not.toBeInTheDocument();
  });

  it('empty tracker points at the exception queue', () => {
    renderPage();
    expect(screen.getByText(/No corrections yet/i)).toBeInTheDocument();
  });

  it('shows an error alert when correction request is invalid', () => {
    useExceptionDispositionStore
      .getState()
      .recordDisposition(FINDING_KEY, 'ACCEPT', 'Confirmed with AP', { ruleId: 'R-006' });
    renderPage();

    // Leave instruction and assignee empty to trigger validation error
    fireEvent.change(screen.getByLabelText(/Correction instruction/i), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText(/Assignee/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Request correction/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
