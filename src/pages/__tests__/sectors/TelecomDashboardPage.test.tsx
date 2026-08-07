import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/telecomStore', () => ({
  useTelecomStore: vi.fn(() => ({
    subscribers: [],
    plans: [],
    networkMetrics: [],
    arpuTrends: [],
    getTotalSubscribers: vi.fn(() => 0),
    getAverageARPU: vi.fn(() => 0),
  })),
}));
vi.mock('lucide-react', () => ({
  Wifi: () => <span data-testid="mock-icon" />,
  Users: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  Signal: () => <span data-testid="mock-icon" />,
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
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
}));

import { render, screen } from '@/test/testUtils';
import { TelecomDashboardPage } from '@/pages/sectors/TelecomDashboardPage';

describe('sectors/TelecomDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the telecom dashboard', () => {
    render(<TelecomDashboardPage />);
    expect(screen.getByText(/Telecom Dashboard/i)).toBeInTheDocument();
  });

  it('renders KPI metrics', () => {
    render(<TelecomDashboardPage />);
    expect(screen.getByText(/Total Subscribers/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ARPU/i).length).toBeGreaterThan(0);
  });

  it('renders charts', () => {
    render(<TelecomDashboardPage />);
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });
});
