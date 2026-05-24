import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
}));

vi.mock('lucide-react', () => ({
  Download: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Users: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  TrendingDown: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
}));

import { render, screen } from '@/test/testUtils';
import ChurnDashboard from '../ChurnDashboard';

describe('ChurnDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/churn dashboard/i)).toBeDefined();
  });

  it('renders customer churn KPI', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/customer churn/i)).toBeDefined();
  });

  it('renders revenue churn KPI', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/revenue churn/i)).toBeDefined();
  });

  it('renders at risk section', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/at risk/i)).toBeDefined();
  });

  it('renders charts', () => {
    render(<ChurnDashboard />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders export button', () => {
    render(<ChurnDashboard />);
    expect(screen.getByText(/download/i)).toBeDefined();
  });
});
