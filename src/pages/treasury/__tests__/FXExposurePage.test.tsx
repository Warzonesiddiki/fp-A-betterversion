import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

vi.mock('lucide-react', () => ({
  FileText: makeIcon(),
}));

function makeIcon() {
  return ({ className }: any) => <span data-testid="mock-icon" className={className} />;
}

import { render, screen } from '@/test/testUtils';
import FXExposurePage from '../FXExposurePage';

describe('FXExposurePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<FXExposurePage />);
    expect(screen.getByText(/fx exposure/i)).toBeDefined();
  });

  it('renders KPI section', () => {
    render(<FXExposurePage />);
    expect(screen.getByText(/total exposure/i)).toBeDefined();
  });

  it('renders currency exposure table', () => {
    render(<FXExposurePage />);
    expect(screen.getByText(/currency/i)).toBeDefined();
  });

  it('renders charts', () => {
    render(<FXExposurePage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders export button', () => {
    render(<FXExposurePage />);
    expect(screen.getByText(/download/i)).toBeDefined();
  });
});
