import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/engines/ThreeStatementEngine', async () => {
  // Use the real engine: the balance check it performs is part of what we assert.
  return await vi.importActual('@/engines/ThreeStatementEngine');
});
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  ComposedChart: () => <div data-testid="composed-chart" />,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { render, screen } from '@/test/testUtils';
import ThreeStatementDashboardPage from '@/pages/reports/ThreeStatementDashboardPage';

describe('ThreeStatementDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<ThreeStatementDashboardPage />);
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
  });

  it('renders dashboard with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '1100',
          accountName: 'Cash',
          debit: 50000,
          credit: 0,
          netChange: 50000,
            amount: 50000,
          date: '2024-01-01',
        },
      ],
    });
    render(<ThreeStatementDashboardPage />);
    expect(screen.getByText(/Three-Statement Model/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Balance Sheet/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/P&L/i).length).toBeGreaterThan(0);
  });

  /**
   * Renders a genuinely balanced double-entry ledger and asserts the figures that
   * actually reach the screen.
   *
   * This is the regression that matters: the page previously computed a roughly
   * correct memo and then back-solved the displayed line items out of grossProfit
   * and netIncome, so it showed Revenue -$1,150, COGS $0, Gross Profit -$1,400 and
   * Net Income -$1,650 for exactly this ledger. Asserting on the DOM (not on the
   * derivation) is what catches a view that diverges from its own totals.
   */
  it('displays line items that match the underlying ledger', async () => {
    const { useGLStore } = await import('@/store/glStore');
    let n = 0;
    const e = (accountCode: string, debit: number, credit: number) => ({
      id: `e${(n += 1)}`,
      accountCode,
      accountName: accountCode,
      debit,
      credit,
      netChange: debit - credit,
      amount: debit - credit,
      period: '2026-01',
      date: '2026-01-15',
    });

    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        e('1000', 500, 0),
        e('3000', 0, 500),
        e('1000', 1000, 0),
        e('4000', 0, 1000),
        e('5000', 400, 0),
        e('1000', 0, 400),
        e('6000', 250, 0),
        e('1000', 0, 250),
      ],
    });

    render(<ThreeStatementDashboardPage />);

    const body = document.body.textContent ?? '';

    // The four figures the previous implementation rendered incorrectly.
    expect(body).toContain('$1,000'); // Revenue  (was -$1,150)
    expect(body).toContain('$400'); // COGS     (was  $0)
    expect(body).toContain('$600'); // Gross    (was -$1,400)
    expect(body).toContain('$350'); // Net inc. (was -$1,650)

    // None of the wrong values may reappear.
    expect(body).not.toContain('-$1,150');
    expect(body).not.toContain('-$1,400');
    expect(body).not.toContain('-$1,650');
  });
});
