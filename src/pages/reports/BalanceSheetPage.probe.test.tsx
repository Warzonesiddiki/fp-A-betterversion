/**
 * Render-probe pilot: BalanceSheetPage (view-layer divergence harness).
 *
 * The engine (`computeBalanceSheet`) is the source of truth; the DOM must
 * agree with it figure-for-figure. Infrastructure is mocked, data is not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

import BalanceSheetPage, { computeBalanceSheet } from './BalanceSheetPage';
import { formatCurrency } from '@/utils/financialFormatting';
import {
  seedGLLedger,
  renderMoneyProbe,
  formatProbeUSD,
  expectFigure,
} from '@/test/renderProbe';

describe('BalanceSheetPage render-probe (engine vs DOM)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assets / liabilities / equity exactly as the engine computes them', () => {
    const entries = seedGLLedger([
      { accountCode: '1010', accountName: 'Cash', debit: 100_000, credit: 0 },
      { accountCode: '2010', accountName: 'Accounts Payable', debit: 0, credit: 40_000 },
      { accountCode: '3010', accountName: 'Common Stock', debit: 0, credit: 60_000 },
    ]);
    const report = computeBalanceSheet(entries);
    expect(report.isBalanced).toBe(true);

    renderMoneyProbe(<BalanceSheetPage />);
    expectFigure(formatProbeUSD(report.totalAssets));
    expectFigure(formatProbeUSD(report.totalLiabilities));
    expectFigure(formatProbeUSD(report.totalEquity));
    expect(screen.getByText('Balance Sheet is Balanced')).toBeInTheDocument();
  });

  it('surfaces an imbalance in the DOM exactly at the engine diff', () => {
    const entries = seedGLLedger([
      { accountCode: '1010', accountName: 'Cash', debit: 123_456, credit: 0 },
    ]);
    const report = computeBalanceSheet(entries);
    expect(report.isBalanced).toBe(false);

    renderMoneyProbe(<BalanceSheetPage />);
    // The page renders the imbalance with fmt.currency (full precision) plus
    // a directional clause ("— assets exceed liabilities + equity"), so match
    // by prefix and assert the engine diff appears verbatim in the message.
    const message = screen.getByText(/^Off by /);
    expect(message.textContent).toBe(
      `Off by ${formatCurrency(Math.abs(report.diff), { currency: 'USD' })}${
        report.diff > 0 ? ' — assets exceed liabilities + equity' : ' — liabilities + equity exceed assets'
      }`
    );
  });
});
