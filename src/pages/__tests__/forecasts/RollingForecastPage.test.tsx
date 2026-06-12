/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="mock-icon" />,
  RefreshCw: () => <span data-testid="mock-icon" />,
  Calendar: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Target: () => <span data-testid="mock-icon" />,
  HelpCircle: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: any) => <div>{label}</div>,
}));

vi.mock('@/components/charts/SparklineChart', () => ({
  SparklineChart: () => <div data-testid="sparkline-chart" />,
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
  })),
}));

import { render, screen } from '@/test/testUtils';
import RollingForecastPage from '@/pages/forecasts/RollingForecastPage';

describe('RollingForecastPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    render(<RollingForecastPage />);
    expect(screen.getByText(/Rolling Forecast/i)).toBeInTheDocument();
  });

  it('renders empty state with zero entries', () => {
    render(<RollingForecastPage />);
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data/i)).toBeInTheDocument();
  });

  it('renders period selector buttons', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '4100',
          accountName: 'Revenue',
          debit: 0,
          credit: 10000,
          date: '2024-01-01',
          period: '2024-01',
        },
      ],
    });
    render(<RollingForecastPage />);
    expect(screen.getByText('3M')).toBeInTheDocument();
    expect(screen.getByText('6M')).toBeInTheDocument();
    expect(screen.getByText('12M')).toBeInTheDocument();
  });
});
