/**
 * Render-probe pilot: ProfitLossPage (view-layer divergence harness).
 *
 * The engine (`computeProfitLoss`) is the source of truth; the DOM must
 * agree with it figure-for-figure. Infrastructure is mocked, data is not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

import ProfitLossPage, { computeProfitLoss } from './ProfitLossPage';
import { formatPercent } from '@/utils/financialFormatting';
import {
  seedGLLedger,
  renderMoneyProbe,
  formatProbeUSD,
  expectFigure,
} from '@/test/renderProbe';

describe('ProfitLossPage render-probe (engine vs DOM)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders revenue / COGS / gross profit / net income exactly as computed', () => {
    const entries = seedGLLedger([
      { accountCode: '4010', accountName: 'Product Revenue', debit: 0, credit: 50_000 },
      { accountCode: '5010', accountName: 'Direct Cost', debit: 12_000, credit: 0 },
      { accountCode: '6010', accountName: 'Salaries', debit: 30_000, credit: 0 },
    ]);
    const report = computeProfitLoss(entries);
    expect(report.totalRevenue).toBe(50_000);
    expect(report.netIncome).toBe(8_000);

    renderMoneyProbe(<ProfitLossPage />);
    expectFigure(formatProbeUSD(report.totalRevenue));
    expectFigure(formatProbeUSD(report.totalCOGS));
    expectFigure(formatProbeUSD(report.grossProfit));
    expectFigure(formatProbeUSD(report.totalExpenses));
    expectFigure(formatProbeUSD(report.netIncome));
    expect(screen.getByText(formatPercent(report.grossMargin, 1))).toBeInTheDocument();
  });

  it('renders a loss position with parenthesised figures matching the engine', () => {
    const entries = seedGLLedger([
      { accountCode: '4010', accountName: 'Product Revenue', debit: 0, credit: 5_000 },
      { accountCode: '6010', accountName: 'Salaries', debit: 9_000, credit: 0 },
    ]);
    const report = computeProfitLoss(entries);
    expect(report.netIncome).toBe(-4_000);

    renderMoneyProbe(<ProfitLossPage />);
    expectFigure(formatProbeUSD(report.netIncome));
  });
});
