import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/store/workforceStore', () => ({
  useWorkforceStore: vi.fn(() => ({ departments: [], roles: [] })),
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
    expect(screen.getByText(/payroll forecast/i)).toBeDefined();
  });

  it('renders KPI section', () => {
    render(<PayrollForecastPage />);
    expect(screen.getByText(/total payroll/i)).toBeDefined();
  });

  it('renders department breakdown table', () => {
    render(<PayrollForecastPage />);
    expect(screen.getByText(/department/i)).toBeDefined();
  });

  it('renders charts section', () => {
    render(<PayrollForecastPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders export button', () => {
    render(<PayrollForecastPage />);
    expect(screen.getByText(/download/i)).toBeDefined();
  });
});
