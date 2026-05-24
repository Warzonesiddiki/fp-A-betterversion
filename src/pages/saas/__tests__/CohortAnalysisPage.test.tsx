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
  BarChart4: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Users: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  TrendingDown: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  DollarSign: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
}));

import { render, screen } from '@/test/testUtils';
import CohortAnalysisPage from '../CohortAnalysisPage';

describe('CohortAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<CohortAnalysisPage />);
    expect(screen.getByText(/cohort analysis/i)).toBeDefined();
  });

  it('renders retention matrix section', () => {
    render(<CohortAnalysisPage />);
    expect(screen.getByText(/retention/i)).toBeDefined();
  });

  it('renders cohort sizes section', () => {
    render(<CohortAnalysisPage />);
    expect(screen.getByText(/cohort size/i)).toBeDefined();
  });

  it('renders charts', () => {
    render(<CohortAnalysisPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders export button', () => {
    render(<CohortAnalysisPage />);
    expect(screen.getByText(/download/i)).toBeDefined();
  });
});
