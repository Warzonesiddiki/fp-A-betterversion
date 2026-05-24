import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/logisticsStore', () => ({
  useLogisticsStore: vi.fn(() => ({
    shipments: [],
    vehicles: [],
    warehouses: [],
    routeCosts: [],
    carrierPerformance: [],
    getActiveShipmentCount: vi.fn(() => 0),
    getOnTimeRate: vi.fn(() => 0),
  })),
}));
vi.mock('lucide-react', () => ({
  Truck: () => <span data-testid="mock-icon" />,
  Package: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  MapPin: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  BarChart3: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
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
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
}));

import { render, screen } from '@/test/testUtils';
import { LogisticsDashboardPage } from '@/pages/sectors/LogisticsDashboardPage';

describe('sectors/LogisticsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the logistics dashboard', () => {
    render(<LogisticsDashboardPage />);
    expect(screen.getByText(/Logistics Dashboard/i)).toBeInTheDocument();
  });

  it('renders charts', () => {
    render(<LogisticsDashboardPage />);
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });
});
