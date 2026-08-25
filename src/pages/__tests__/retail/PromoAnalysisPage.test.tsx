import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));
vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  Download: () => <span data-testid="mock-icon" />,
  Tag: () => <span data-testid="mock-icon" />,
  Percent: () => <span data-testid="mock-icon" />,
  Table: () => <span data-testid="mock-icon" />,
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
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  ScatterChart: () => <div data-testid="scatter-chart" />,
  Scatter: () => null,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
}));

import { render, screen } from '@/test/testUtils';
import { useRetailStore } from '@/store/retailStore';
import PromoAnalysisPage from '@/pages/retail/PromoAnalysisPage';

describe('PromoAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for a campaign when none is recorded', () => {
    useRetailStore.setState({ promotions: [] });
    render(<PromoAnalysisPage />);
    expect(screen.getByText('No Promotions Recorded')).toBeInTheDocument();
  });

  it('renders the promo analysis page once a campaign is recorded', () => {
    useRetailStore.setState({
      promotions: [
        {
          id: 'P-1',
          name: 'Test Campaign',
          type: 'Percentage',
          discountPercent: 10,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          cost: 100,
          revenue: 500,
          baselineRevenue: 400,
          status: 'completed',
        },
      ],
    });
    render(<PromoAnalysisPage />);
    expect(screen.getByText(/Promotion Analysis/i)).toBeInTheDocument();
  });
});
