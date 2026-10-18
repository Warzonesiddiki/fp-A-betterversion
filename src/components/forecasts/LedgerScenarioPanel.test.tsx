import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import LedgerScenarioPanel from './LedgerScenarioPanel';
import { useGLStore } from '@/store/glStore';
import { setClock, resetClock } from '@/utils/clock';
import type { GLEntry } from '@/types';

/**
 * Phase 7 scenario UI wiring: the ledger what-if panel runs the
 * scenarioImpact service against the user's posted GL and shows
 * base/adjusted/delta for the three statements — flagging, never
 * plugging, a what-if that breaks double-entry.
 */

const ENTRIES = [
  {
    id: '1',
    date: '2026-01-15',
    postDate: '2026-01-15',
    accountCode: '1000',
    debit: 5000,
    credit: 0,
  },
  {
    id: '2',
    date: '2026-01-15',
    postDate: '2026-01-15',
    accountCode: '1100',
    debit: 2000,
    credit: 0,
  },
  {
    id: '3',
    date: '2026-01-15',
    postDate: '2026-01-15',
    accountCode: '2100',
    debit: 0,
    credit: 1500,
  },
  {
    id: '4',
    date: '2026-01-15',
    postDate: '2026-01-15',
    accountCode: '3000',
    debit: 0,
    credit: 2500,
  },
  {
    id: '5',
    date: '2026-01-15',
    postDate: '2026-01-15',
    accountCode: '4010',
    debit: 0,
    credit: 4000,
  },
  {
    id: '6',
    date: '2026-01-15',
    postDate: '2026-01-15',
    accountCode: '5010',
    debit: 1000,
    credit: 0,
  },
] as unknown as GLEntry[];

describe('LedgerScenarioPanel', () => {
  beforeEach(() => {
    setClock('2026-10-15T09:00:00.000Z');
    useGLStore.setState({ entries: [], importStatus: 'idle', importProgress: 0 });
  });

  it('without GL entries it says what to do instead of inventing figures', () => {
    render(<LedgerScenarioPanel />);
    expect(screen.getByText(/Import a general-ledger file/i)).toBeInTheDocument();
  });

  it('shows base figures, applies percentage what-ifs, and flags imbalance until offset', () => {
    useGLStore.setState({ entries: ENTRIES });
    render(<LedgerScenarioPanel />);

    // Base and what-if columns both start at revenue 4000.
    const revenueRow = screen.getByRole('row', { name: /Revenue/ });
    expect(within(revenueRow).getAllByRole('cell', { name: '$4,000' })).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('Revenue change %'), { target: { value: '25' } });
    // Adjusted revenue 5000; imbalance of -1000 flagged, never plugged.
    expect(within(revenueRow).getByRole('cell', { name: '$5,000' })).toBeInTheDocument();
    expect(screen.getByText(/does not balance/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Cash change %'), { target: { value: '20' } });
    expect(screen.queryByText(/does not balance/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: '+$1,000' }).length).toBeGreaterThan(0);
    resetClock();
  });
});
