/**
 * Phase 2 articulation (F-P2-01): the cash-flow statement's Net Income must
 * be the P&L's net income on the same ledger. The page previously recomputed
 * it inline from code prefixes 4/5/6 only, so interest and tax never reached
 * it and the two statements disagreed on any ledger that had them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CashFlowPage from './CashFlowPage';
import { computeProfitLoss } from './ProfitLossPage';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

const PERIOD = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

function entry(id: string, code: string, debit: number, credit: number): GLEntry {
  return {
    id,
    accountId: code,
    accountCode: code,
    accountName: code,
    period: PERIOD,
    periodName: PERIOD,
    debit,
    credit,
    netChange: debit - credit,
    amount: debit - credit,
    date: `${PERIOD}-15`,
    description: '',
    reference: '',
  };
}

const LEDGER: GLEntry[] = [
  entry('c1', '1010', 850, 0), // cash
  entry('c2', '4010', 0, 1000), // revenue
  entry('c3', '6010', 100, 0), // operating expense
  entry('c4', '7010', 50, 0), // interest expense — the line the old math dropped
];

describe('CashFlowPage — net income articulates with the P&L (Phase 2)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: LEDGER, accounts: [], importError: null });
  });

  it('shows the P&L net income (850), not the prefix-only recomputation (900)', () => {
    expect(computeProfitLoss(LEDGER, PERIOD).netIncome).toBe(850);
    render(
      <MemoryRouter initialEntries={['/reports/cash-flow']}>
        <CashFlowPage />
      </MemoryRouter>
    );
    const niRow = screen.getByText('Net Income').closest('tr');
    expect(niRow?.textContent).toContain('850');
    expect(niRow?.textContent).not.toContain('900');
  });
});
