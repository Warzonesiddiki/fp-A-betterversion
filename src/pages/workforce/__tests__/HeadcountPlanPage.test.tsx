import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        account: '4000',
        accountName: 'Revenue',
        amount: 100000,
        period: '2026-01',
        department: 'Sales',
        type: 'revenue',
      },
      {
        id: '2',
        account: '5000',
        accountName: 'COGS',
        amount: 30000,
        period: '2026-01',
        department: 'COGS',
        type: 'expense',
      },
    ],
  })),
}));

vi.mock('@/store/workforceStore', () => ({
  useWorkforceStore: vi.fn(() => ({ departments: [], roles: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToCSV: vi.fn(), exportToPDF: vi.fn() },
}));

vi.mock('@/components/charts/TreemapChart', () => ({
  TreemapChart: ({ data }: any) => <div data-testid="treemap-chart">{JSON.stringify(data)}</div>,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
}));

vi.mock('lucide-react', () => ({
  Headphones: makeIcon(),
  Download: makeIcon(),
  FileText: makeIcon(),
  Table: makeIcon(),
  Users: makeIcon(),
  DollarSign: makeIcon(),
  TrendingDown: makeIcon(),
  ChevronUp: makeIcon(),
  ChevronDown: makeIcon(),
}));

function makeIcon() {
  return ({ className }: any) => <span data-testid="mock-icon" className={className} />;
}

import { render, screen } from '@/test/testUtils';
import HeadcountPlanPage from '../HeadcountPlanPage';

describe('HeadcountPlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByText(/headcount plan/i).length).toBeGreaterThan(0);
  });

  it('renders KPI section', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByText(/total headcount/i).length).toBeGreaterThan(0);
  });

  it('renders department table', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByText(/department/i).length).toBeGreaterThan(0);
  });

  it('renders charts section', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders treemap chart', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getByTestId('treemap-chart')).toBeDefined();
  });

  it('renders export button', () => {
    render(<HeadcountPlanPage />);
    expect(screen.getByLabelText(/export pdf/i)).toBeDefined();
    expect(screen.getByLabelText(/export excel/i)).toBeDefined();
  });
});
