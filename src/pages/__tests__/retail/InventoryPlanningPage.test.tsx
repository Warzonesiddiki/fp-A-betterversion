import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/store/retailStore', () => ({
  useRetailStore: vi.fn(() => ({ stores: [], inventory: [], products: [] })),
}));
vi.mock('@/engines/InventoryEngine', () => ({
  InventoryEngine: {
    analyze: vi.fn(() => ({})),
    calculateGLInventoryStats: vi.fn(() => ({
      totalValue: 0,
      turnover: 0,
      daysOnHand: 0,
      outOfStockCount: 0,
      stockouts: 0,
    })),
  },
}));
vi.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="mock-icon" />,
  Check: () => <span data-testid="mock-icon" />,
  Package: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  TrendingDown: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  AlertTriangle: () => <span data-testid="mock-icon" />,
  BarChart3: () => <span data-testid="mock-icon" />,
  Download: () => <span data-testid="mock-icon" />,
  RefreshCw: () => <span data-testid="mock-icon" />,
  Clock: () => <span data-testid="mock-icon" />,
  Truck: () => <span data-testid="mock-icon" />,
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
  ComposedChart: () => <div data-testid="composed-chart" />,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => null,
}));

import { render, screen } from '@/test/testUtils';
import InventoryPlanningPage from '@/pages/retail/InventoryPlanningPage';

describe('InventoryPlanningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<InventoryPlanningPage />);
    expect(screen.getByText(/No Inventory Data/i)).toBeInTheDocument();
  });

  it('renders dashboard with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '1300',
          accountName: 'Inventory',
          debit: 50000,
          credit: 0,
          amount: 50000,
          date: '2024-01-01',
        },
      ],
    });
    render(<InventoryPlanningPage />);
    expect(screen.getByRole('heading', { name: /Inventory Planning/i })).toBeInTheDocument();
  });
});
