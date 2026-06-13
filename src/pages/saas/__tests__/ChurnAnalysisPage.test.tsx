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

vi.mock('@/engines/SaaSMetricsEngine', () => ({
  SaaSMetricsEngine: { analyze: vi.fn(() => ({})) },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn() },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

import { render, screen } from '@/test/testUtils';
import ChurnAnalysisPage from '../ChurnAnalysisPage';

describe('ChurnAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<ChurnAnalysisPage />);
    expect(screen.getByText(/churn analysis/i)).toBeDefined();
  });

  it('renders churn trend section', () => {
    render(<ChurnAnalysisPage />);
    expect(screen.getByText(/churn trend/i)).toBeDefined();
  });

  it('renders segment analysis', () => {
    render(<ChurnAnalysisPage />);
    expect(screen.getByText(/segment/i)).toBeDefined();
  });

  it('renders charts', () => {
    render(<ChurnAnalysisPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders export button', () => {
    const { container } = render(<ChurnAnalysisPage />);
    // The page uses an icon button (Download icon) - check for svg in a button
    const buttons = container.querySelectorAll('button');
    const hasExportButton = Array.from(buttons).some((b) => b.querySelector('svg'));
    expect(hasExportButton).toBe(true);
  });
});
