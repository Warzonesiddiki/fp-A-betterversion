import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// W-FAB remediation pins. This page previously rendered five invented stores
// ('Downtown', 'Mall', 'Airport', 'Online', 'Suburban') with revenue split by
// a fixed factor formula, synthesized transaction counts / basket sizes /
// YoY growth, and exported those invented rows to PDF and Excel. It also
// applied Math.abs() to the COGS sum, counting credited reversals as cost.
// All displayed figures are now derived from posted GL entities.
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('@/engines/RetailEngine', () => ({
  RetailEngine: {
    getStoreBreakdown: vi.fn(() => [
      {
        id: 'S-01',
        name: 'Store S-01',
        revenue: 50000,
        labor: 8000,
        cogs: 20000,
        occupancy: 4000,
        grossProfit: 30000,
        netProfit: 18000,
        margin: 36,
        laborPercent: 16,
        rank: 1,
      },
    ]),
    calculateDashboardStats: vi.fn(() => ({
      avgRevenuePerStore: 0,
      avgNetMargin: 0,
      salesPerLaborHour: 0,
      avgCustSat: 0,
    })),
    getPnLTrend: vi.fn(() => []),
  },
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">rows:{data.length}</div>
  ),
}));

vi.mock('lucide-react', () => ({
  Store: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  Download: () => <span data-testid="mock-icon" />,
  FileText: () => <span data-testid="mock-icon" />,
  Table: () => <span data-testid="mock-icon" />,
  ShoppingCart: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { render, screen } from '@/test/testUtils';
import StoreDashboardPage from '@/pages/retail/StoreDashboardPage';

const glEntries = [
  {
    id: '1',
    accountId: 'a1',
    accountCode: '4100',
    accountName: 'Revenue',
    period: '2024-01',
    periodName: 'Jan 2024',
    debit: 50000,
    credit: 0,
    netChange: -50000,
    date: '2024-01-01',
    amount: 50000,
    description: '',
    reference: '',
    entityId: 'S-01',
  },
  {
    id: '2',
    accountId: 'a2',
    accountCode: '5100',
    accountName: 'COGS',
    period: '2024-01',
    periodName: 'Jan 2024',
    // Credited COGS line: under the old Math.abs() sum this INFLATED cost;
    // signed accounting must treat it as a reduction.
    debit: 0,
    credit: 2000,
    netChange: 2000,
    date: '2024-01-02',
    amount: -2000,
    description: '',
    reference: '',
    entityId: 'S-01',
  },
];

describe('StoreDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<StoreDashboardPage />);
    expect(screen.getByText(/No Retail Data/i)).toBeInTheDocument();
  });

  it('renders the dashboard heading when entries exist', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: glEntries });
    render(<StoreDashboardPage />);
    expect(screen.getByRole('heading', { level: 1, name: /store dashboard/i })).toBeInTheDocument();
  });

  it('never renders the removed invented store names or growth column', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: glEntries });
    render(<StoreDashboardPage />);
    for (const invented of ['Downtown', 'Mall', 'Airport', 'Online', 'Suburban']) {
      expect(screen.queryByText(invented)).toBeNull();
    }
    // The data table has no Transactions / Avg Basket / YoY Growth columns.
    // (Prose in the disclosure card may explain their absence.)
    expect(screen.queryAllByRole('columnheader', { name: /YoY Growth/i })).toHaveLength(0);
    expect(screen.queryAllByRole('columnheader', { name: /Avg Basket/i })).toHaveLength(0);
    expect(screen.queryAllByRole('columnheader', { name: /Transactions/i })).toHaveLength(0);
  });

  it('sums COGS signed (a credit reversal reduces cost instead of inflating it)', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: glEntries });
    const { getByTestId } = render(<StoreDashboardPage />);
    const kpis = getByTestId('store-dashboard-kpis');
    // Total COGS = 0 − 2000 = −2000 → accounting-negative "($2,000)", not +2,000.
    expect(kpis.textContent).toContain('($2,000)');
    // Revenue = 50,000 − 0.
    expect(kpis.textContent).toContain('$50,000');
  });

  it('discloses that transactions, basket and YoY need POS feeds', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: glEntries });
    render(<StoreDashboardPage />);
    expect(screen.getByText(/require POS transaction history/i)).toBeInTheDocument();
  });
});
