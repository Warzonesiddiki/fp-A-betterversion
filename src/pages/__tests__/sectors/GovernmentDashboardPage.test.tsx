import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/governmentStore', () => ({
  useGovernmentStore: vi.fn(() => ({
    funds: [],
    compliance: [],
    budgetLines: [],
  })),
}));
vi.mock('lucide-react', () => ({
  makeIcon: vi.fn(() => ({ className }: { className?: string }) => (
    <span data-testid="mock-icon" className={className} />
  )),
  Landmark: () => <span data-testid="mock-icon" />,
  Users: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  Shield: () => <span data-testid="mock-icon" />,
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

import { render, screen, fireEvent } from '@/test/testUtils';
import { GovernmentDashboardPage } from '@/pages/sectors/GovernmentDashboardPage';

describe('sectors/GovernmentDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the government dashboard', () => {
    render(<GovernmentDashboardPage />);
    expect(screen.getByText(/Government Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Department/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Budget/i).length).toBeGreaterThan(0);
  });

  it('renders tabs and allows tab switching', () => {
    render(<GovernmentDashboardPage />);
    const spendingTab = screen.getByText('Spending');
    fireEvent.click(spendingTab);
    expect(spendingTab).toBeInTheDocument();
  });

  it('renders charts', () => {
    render(<GovernmentDashboardPage />);
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });
});
