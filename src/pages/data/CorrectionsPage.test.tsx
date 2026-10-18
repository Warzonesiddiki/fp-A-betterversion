/**
 * Phase 5 tracker (DEC-018): corrections are created from accepted
 * findings, advanced only by human clicks, exported from the same
 * records, and re-verified only after a human confirms the proposal.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CorrectionsPage from './CorrectionsPage';
import { useGLStore } from '@/store/glStore';
import { useExceptionDispositionStore } from '@/store/exceptionDispositionStore';
import { setClock, resetClock } from '@/utils/clock';
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
    expect(screen.getByText('REQUESTED')).toBeInTheDocument();
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
    expect(screen.getByText('APPLIED')).toBeInTheDocument();
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

  it('empty tracker points at the exception queue', () => {
    renderPage();
    expect(screen.getByText(/No corrections yet/i)).toBeInTheDocument();
  });
});
