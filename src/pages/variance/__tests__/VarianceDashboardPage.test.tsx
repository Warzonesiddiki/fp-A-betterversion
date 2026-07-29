/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => {
    const data = {
      entries: [
        {
          id: '1',
          accountId: 'a1',
          accountCode: '4000',
          accountName: 'Revenue',
          debit: 100000,
          credit: 0,
          netChange: 100000,
          period: '2026-01',
          amount: 100000,
        },
        {
          id: '2',
          accountId: 'a2',
          accountCode: '5000',
          accountName: 'COGS',
          debit: 30000,
          credit: 0,
          netChange: 30000,
          period: '2026-01',
          amount: 30000,
        },
      ],
    };
    return data;
  }),
}));

vi.mock('@/store/budgetStore', () => ({
  // VarianceDashboardPage now computes variance only from real approved
  // budget line items (see the fix removing the fabricated
  // actual*1.05/0.95/0.93 placeholder baseline). Provide a realistic
  // approved budget + line items matching the mocked GL account codes
  // (4000 = Revenue, 5000 = COGS) so the page renders its full data view.
  useBudgetStore: vi.fn(() => ({
    budgets: [
      {
        id: 'b1',
        name: 'FY26 Budget',
        status: 'Approved',
        totalAmount: 150000,
      },
    ],
    lineItems: [
      {
        id: 'li1',
        budgetId: 'b1',
        accountId: 'a1',
        accountCode: '4000',
        accountName: 'Revenue',
        amount: 95000,
      },
      {
        id: 'li2',
        budgetId: 'b1',
        accountId: 'a2',
        accountCode: '5000',
        accountName: 'COGS',
        amount: 28000,
      },
    ],
  })),
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

vi.mock('@/components/ai/AnomalyHighlight', () => ({
  AnomalyHighlight: () => <div data-testid="mock-anomaly-highlight" />,
}));

vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="mock-ai-copilot-panel" />,
}));

vi.mock('lucide-react', () => ({
  DollarSign: makeIcon(),
  AlertTriangle: makeIcon(),
  Info: makeIcon(),
  BarChart3: makeIcon(),
  TrendingUp: makeIcon(),
  TrendingDown: makeIcon(),
  ShieldAlert: makeIcon(),
  Download: makeIcon(),
  FileText: makeIcon(),
  Table: makeIcon(),
  Brain: makeIcon(),
  Send: makeIcon(),
  Sparkles: makeIcon(),
  ChevronDown: makeIcon(),
  ChevronUp: makeIcon(),
  Loader2: makeIcon(),
  Lightbulb: makeIcon(),
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
    expect(screen.getAllByText(/variance/i).length).toBeGreaterThan(0);
  });

  it('renders KPI section', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getAllByText(/revenue variance/i).length).toBeGreaterThan(0);
  });

  it('renders variance table', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getByText(/key driver/i)).toBeDefined();
  });

  it('renders charts', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getByText(/variance by category/i)).toBeDefined();
  });

  it('renders export button', () => {
    render(<VarianceDashboardPage />);
    expect(screen.getAllByText(/pdf|excel/i).length).toBeGreaterThan(0);
  });
});
