import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
}));

vi.mock('lucide-react', () => ({
  TrendingDown: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Download: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  BarChart4: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
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
    render(<ChurnAnalysisPage />);
    expect(screen.getByText(/download/i)).toBeDefined();
  });
});
