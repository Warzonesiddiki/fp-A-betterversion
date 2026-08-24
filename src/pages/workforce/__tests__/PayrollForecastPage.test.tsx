import { describe, it, expect, vi, beforeEach } from 'vitest';

// Selector-aware mocks: the page subscribes via useGLStore((s) => s.entries)
// and useWorkforceStore(useShallow(...)), so each mock must apply a selector
// when one is passed.
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn((selector?: (s: { entries: unknown[] }) => unknown) => {
    const state = {
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
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/store/workforceStore', () => ({
  useWorkforceStore: vi.fn(
    (selector?: (s: { departments: unknown[]; roles: unknown[] }) => unknown) => {
      const state = { departments: [], roles: [] };
      return selector ? selector(state) : state;
    }
  ),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToCSV: vi.fn(), exportToPDF: vi.fn() },
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
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
}));

vi.mock('lucide-react', () => ({
  Download: makeIcon(),
  Users: makeIcon(),
  DollarSign: makeIcon(),
  TrendingUp: makeIcon(),
  Percent: makeIcon(),
  ChevronUp: makeIcon(),
  ChevronDown: makeIcon(),
  // DataTable's empty state renders a Search icon (department table is empty
  // until workforce data is imported).
  Search: makeIcon(),
  AlertCircle: makeIcon(),
}));

function makeIcon() {
  return ({ className }: any) => <span data-testid="mock-icon" className={className} />;
}

import { render, screen } from '@/test/testUtils';
import PayrollForecastPage from '../PayrollForecastPage';

describe('PayrollForecastPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<PayrollForecastPage />);
    expect(screen.getAllByText(/payroll forecast/i).length).toBeGreaterThan(0);
  });

  it('renders KPI section', () => {
    render(<PayrollForecastPage />);
    expect(screen.getAllByText(/annual payroll/i).length).toBeGreaterThan(0);
  });

  it('renders department breakdown table', () => {
    render(<PayrollForecastPage />);
    expect(screen.getAllByText(/department/i).length).toBeGreaterThan(0);
  });

  it('renders charts section', () => {
    render(<PayrollForecastPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders export button', () => {
    render(<PayrollForecastPage />);
    expect(screen.getAllByText(/export/i).length).toBeGreaterThan(0);
  });
});
