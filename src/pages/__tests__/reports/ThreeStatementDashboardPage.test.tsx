import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/engines/ThreeStatementEngine', () => ({
  ThreeStatementEngine: { analyze: vi.fn(() => ({})) },
}));
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn() },
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  ComposedChart: () => <div data-testid="composed-chart" />,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { render, screen } from '@/test/testUtils';
import ThreeStatementDashboardPage from '@/pages/reports/ThreeStatementDashboardPage';

describe('ThreeStatementDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<ThreeStatementDashboardPage />);
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
  });

  it('renders dashboard with entries', async () => {
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
          date: '2024-01-01',
        },
      ],
    });
    render(<ThreeStatementDashboardPage />);
    expect(screen.getByText(/Three-Statement Model/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Balance Sheet/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/P&L/i).length).toBeGreaterThan(0);
  });
});
