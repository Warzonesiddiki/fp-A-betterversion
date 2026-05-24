import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('lucide-react', () => ({
  Truck: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
}));
vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString()}`,
  formatNumber: (v: number) => v.toLocaleString(),
}));

import { render, screen } from '@/test/testUtils';
import { LogisticsDashboardPage } from '@/pages/sector/LogisticsDashboardPage';

describe('LogisticsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<LogisticsDashboardPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
  });

  it('renders dashboard with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '4100',
          accountName: 'Freight Revenue',
          debit: 0,
          credit: 80000,
          netChange: -80000,
          date: '2024-01-01',
        },
        {
          id: '2',
          accountCode: '5100',
          accountName: 'Fleet Vehicle Costs',
          debit: 20000,
          credit: 0,
          netChange: 20000,
          date: '2024-01-01',
        },
      ],
    });
    render(<LogisticsDashboardPage />);
    expect(screen.getByText(/Logistics Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/Fleet Costs/i)).toBeInTheDocument();
  });
});
