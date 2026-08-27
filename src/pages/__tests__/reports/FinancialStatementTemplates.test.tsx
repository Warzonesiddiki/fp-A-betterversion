import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="mock-icon" />,
  Download: () => <span data-testid="mock-icon" />,
  ChevronDown: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
  ChevronUp: () => <span data-testid="mock-icon" />,
  Table: () => <span data-testid="mock-icon" />,
}));
vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(vi.fn((sel?: (s: unknown) => unknown) => { const state = { entries: [] }; return sel ? sel(state) : state; }), { getState: () => ({ entries: [] }) }),
}));
vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn(() => ({
    createReport: vi.fn(),
    templates: [],
  })),
}));
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));
vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString()}`,
  formatNumber: (v: number) => v.toLocaleString(),
  formatPercent: (v: number) => `${v}%`,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ComposedChart: () => <div data-testid="composed-chart" />,
  Line: () => null,
}));

import { render, screen, fireEvent } from '@/test/testUtils';
import FinancialStatementTemplatesPage from '@/pages/reports/FinancialStatementTemplates';

describe('FinancialStatementTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<FinancialStatementTemplatesPage />);
    expect(screen.getByText(/No GL Data/i)).toBeInTheDocument();
  });

  it('renders with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '1100',
          accountName: 'Cash',
          debit: 50000,
          credit: 0,
          netChange: 50000,
            amount: 50000,
          date: '2024-01-01',
        },
      ],
      accounts: [{ code: '1100', name: 'Cash', type: 'asset' }],
    });
    render(<FinancialStatementTemplatesPage />);
    expect(screen.getByText(/Financial Statement Templates/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Income Statement/i).length).toBeGreaterThanOrEqual(2);
  });

  it('switches statement types', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '1100',
          accountName: 'Cash',
          debit: 50000,
          credit: 0,
          netChange: 50000,
            amount: 50000,
          date: '2024-01-01',
        },
      ],
      accounts: [{ code: '1100', name: 'Cash', type: 'asset' }],
    });
    render(<FinancialStatementTemplatesPage />);
    const toggleButton = screen.getByRole('button', { name: /Income Statement/i });
    fireEvent.click(toggleButton);
    const bsButton = screen.getByRole('button', { name: /Balance Sheet/i });
    fireEvent.click(bsButton);
    expect(screen.getAllByText(/Balance Sheet/i).length).toBeGreaterThan(0);
  });
});
