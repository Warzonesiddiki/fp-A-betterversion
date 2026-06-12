/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({ budgets: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToCSV: vi.fn(), exportToPDF: vi.fn() },
}));

vi.mock('@/engines/VarianceDecompositionEngine', () => ({
  VarianceDecompositionEngine: { decompose: vi.fn(() => []) },
}));

vi.mock('@/engines/AnomalyDetectionEngine', () => ({
  AnomalyDetectionEngine: { detect: vi.fn(() => []) },
}));

vi.mock('@/components/variance/VarianceDrillModal', () => ({
  VarianceDrillModal: () => <div data-testid="variance-drill-modal" />,
}));

vi.mock('@/components/CommentaryPanel', () => ({
  CommentaryPanel: () => <div data-testid="commentary-panel" />,
}));

vi.mock('@/components/charts/VarianceChart', () => ({
  VarianceChart: () => <div data-testid="variance-chart" />,
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
}));

vi.mock('lucide-react', () => ({
  DollarSign: makeIcon(),
  AlertTriangle: makeIcon(),
  BarChart3: makeIcon(),
  TrendingUp: makeIcon(),
  TrendingDown: makeIcon(),
  Download: makeIcon(),
  FileText: makeIcon(),
  Table: makeIcon(),
}));

function makeIcon() {
  return ({ className }: any) => <span data-testid="mock-icon" className={className} />;
}

import { render, screen } from '@/test/testUtils';
import VarianceDashboardPage from '../VarianceDashboardPage';

describe('VarianceDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getByText(/variance/i)).toBeDefined();
  });

  it('renders KPI section', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getByText(/total variance/i)).toBeDefined();
  });

  it('renders variance table', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getByText(/account/i)).toBeDefined();
  });

  it('renders charts', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getByTestId('variance-chart')).toBeDefined();
  });

  it('renders export button', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getByText(/download/i)).toBeDefined();
  });
});
