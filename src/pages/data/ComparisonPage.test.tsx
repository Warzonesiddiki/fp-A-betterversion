/**
 * Phase 4 comparison workspace (FR-011): the grid states what moved, by
 * how much, over exactly which periods — with "not in file" honesty and
 * drill-to-entries on every figure.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ComparisonPage from './ComparisonPage';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

function entry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: 'cmp-1',
    accountId: '4010',
    accountCode: '4010',
    accountName: 'Revenue',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    amount: 0,
    date: '2026-01-05',
    description: 'sale',
    reference: 'J-1',
    ...overrides,
  } as GLEntry;
}

const LEDGER: GLEntry[] = [
  entry({ id: 'cmp-1', credit: 1000, date: '2025-01-06', period: '2025-01' }),
  entry({ id: 'cmp-2', credit: 2000, date: '2026-01-05', period: '2026-01' }),
  entry({
    id: 'cmp-3',
    accountId: '7010',
    accountCode: '7010',
    accountName: 'Interest',
    debit: 40,
    date: '2025-01-08',
    period: '2025-01',
  }),
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/comparison']}>
      <Routes>
        <Route path="/data/comparison" element={<ComparisonPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ComparisonPage (Phase 4)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], accounts: [] });
  });

  it('empty ledger invites an import', () => {
    renderPage();
    expect(screen.getByText(/No GL Data/i)).toBeInTheDocument();
  });

  it('grid shows current vs prior-year with deltas and not-in-file honesty', () => {
    useGLStore.setState({ entries: LEDGER, accounts: [] });
    renderPage();
    // Default anchor is the latest month (2026-01); revenue doubled YoY.
    expect((screen.getByLabelText('Current period') as HTMLSelectElement).value).toBe('2026-01');
    const revRow = screen.getByText('Revenue').closest('tr')!;
    expect(revRow.textContent).toContain('2,000');
    expect(revRow.textContent).toContain('1,000');
    expect(revRow.textContent).toContain('+100.00%');
    // Interest posted only in 2025-01: current cell is "not in file".
    const intRow = screen.getByText('Interest').closest('tr')!;
    expect(intRow.textContent).toContain('not in file');
  });

  it('a figure drills to its contributing entries', async () => {
    useGLStore.setState({ entries: LEDGER, accounts: [] });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Drill into Revenue 2026-01 entries/i }));
    expect(await screen.findByText('Redirected')).toBeInTheDocument();
  });

  it('grain switch re-anchors the grid by year', () => {
    useGLStore.setState({ entries: LEDGER, accounts: [] });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Year$/i }));
    expect((screen.getByLabelText('Current period') as HTMLSelectElement).value).toBe('2026');
    const revRow = screen.getByText('Revenue').closest('tr')!;
    expect(revRow.textContent).toContain('$2,000');
    expect(revRow.textContent).toContain('$1,000');
  });
});
