/**
 * Render-probe pilot: WorkingCapitalPage (view-layer divergence harness).
 *
 * The engine (`computeWorkingCapital`) is the source of truth; the DOM must
 * agree with it figure-for-figure. Infrastructure is mocked, data is not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="rc">{children}</div>
  ),
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import WorkingCapitalPage, { computeWorkingCapital } from './WorkingCapitalPage';
import { formatPercent } from '@/utils/financialFormatting';
import { seedGLLedger, renderMoneyProbe, formatProbeUSD, expectFigure } from '@/test/renderProbe';

describe('WorkingCapitalPage render-probe (engine vs DOM)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders working-capital KPIs exactly as the engine computes them', () => {
    const entries = seedGLLedger([
      { accountCode: '1100', accountName: 'Operating Cash', debit: 60_000, credit: 0 },
      { accountCode: '2100', accountName: 'Accounts Payable', debit: 0, credit: 20_000 },
      { accountCode: '4000', accountName: 'Sales', debit: 0, credit: 80_000 },
      { accountCode: '5000', accountName: 'Direct Cost', debit: 50_000, credit: 0 },
    ]);
    const data = computeWorkingCapital(entries);
    expect(data.assets).toBe(60_000);
    expect(data.liabilities).toBe(20_000);
    expect(data.wc).toBe(40_000);

    renderMoneyProbe(<WorkingCapitalPage />);
    expectFigure(formatProbeUSD(data.wc));
    expect(screen.getByText(formatPercent(data.currentRatio, 2))).toBeInTheDocument();
    expect(screen.getByText(formatPercent(data.quickRatio, 2))).toBeInTheDocument();
    expect(screen.getAllByText(`${data.ccc} days`).length).toBeGreaterThan(0);
  });

  it('renders every component row amount from the engine table', () => {
    const entries = seedGLLedger([
      { accountCode: '1100', accountName: 'Operating Cash', debit: 60_000, credit: 0 },
      { accountCode: '2100', accountName: 'Accounts Payable', debit: 0, credit: 20_000 },
      { accountCode: '4000', accountName: 'Sales', debit: 0, credit: 80_000 },
      { accountCode: '5000', accountName: 'Direct Cost', debit: 50_000, credit: 0 },
    ]);
    const data = computeWorkingCapital(entries);

    renderMoneyProbe(<WorkingCapitalPage />);
    for (const component of data.components) {
      expectFigure(formatProbeUSD(component.amount));
    }
  });
});
