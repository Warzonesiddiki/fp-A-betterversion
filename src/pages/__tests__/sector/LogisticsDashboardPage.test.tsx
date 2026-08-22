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
          amount: -80000,
          date: '2024-01-01',
        },
        {
          id: '2',
          accountCode: '5100',
          accountName: 'Fleet Vehicle Costs',
          debit: 20000,
          credit: 0,
          netChange: 20000,
          amount: 20000,
          date: '2024-01-01',
        },
      ],
    });
    render(<LogisticsDashboardPage />);
    // Real header surface: canonical PageHeader title from the sector config
    // (not the retired invisible LEGACY_SECTOR_COPY spans).
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Logistics & Supply Chain Driver Modeling Dashboard',
      })
    ).toBeInTheDocument();
    // Both P&L classes post in this ledger (4xxx freight revenue, 5xxx fleet
    // costs), so the Data lineage card shows both classified signals.
    expect(screen.getByText('Actual Revenue (classified)')).toBeInTheDocument();
    expect(screen.getByText('Revenue (classified)')).toBeInTheDocument();
    expect(screen.getByText('COGS (classified)')).toBeInTheDocument();
    // Driver-driven projections render in the simulator with their basis.
    expect(screen.getByText('On-Time Delivery Rate')).toBeInTheDocument();
  });
});
