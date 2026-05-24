import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn() },
}));
vi.mock('@/engines/ManufacturingEngine', () => ({
  ManufacturingEngine: {},
}));
vi.mock('lucide-react', () => ({
  Store: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  Download: () => <span data-testid="mock-icon" />,
  FileText: () => <span data-testid="mock-icon" />,
  Table: () => <span data-testid="mock-icon" />,
  ShoppingCart: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
  ChevronUp: () => <span data-testid="mock-icon" />,
  ChevronDown: () => <span data-testid="mock-icon" />,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('@/store/retailStore', () => ({
  useRetailStore: () => ({
    entries: [],
    products: [],
    getLowStockProducts: () => [],
  }),
}));
vi.mock('@/engines/RetailEngine', () => ({
  RetailEngine: {
    getStoreBreakdown: () => [
      { store: 'Store A', revenue: 50000, margin: 0.35, transactions: 120, revenuePercent: 50 },
    ],
  },
}));

import { render, screen } from '@/test/testUtils';
import StoreDashboardPage from '@/pages/retail/StoreDashboardPage';

describe('StoreDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<StoreDashboardPage />);
    expect(screen.getByText(/No Retail Data/i)).toBeInTheDocument();
  });

  it('renders dashboard with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '4100',
          accountName: 'Revenue',
          debit: 50000,
          credit: 0,
          date: '2024-01-01',
        },
        {
          id: '2',
          accountCode: '5100',
          accountName: 'COGS',
          debit: 0,
          credit: 20000,
          date: '2024-01-01',
        },
      ],
    });
    render(<StoreDashboardPage />);
    expect(screen.getByText(/Store Dashboard/i)).toBeInTheDocument();
  });
});
