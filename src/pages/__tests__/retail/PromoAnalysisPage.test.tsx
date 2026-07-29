import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
import PromoAnalysisPage from '@/pages/retail/PromoAnalysisPage';

describe('PromoAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the promo analysis page', () => {
    render(<PromoAnalysisPage />);
    expect(screen.getByText(/Promotion Analysis/i)).toBeInTheDocument();
  });
});
