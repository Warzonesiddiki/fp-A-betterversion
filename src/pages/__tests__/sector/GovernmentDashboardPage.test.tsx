import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('lucide-react', () => ({
  Building2: () => <span data-testid="mock-icon" />,
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
import { GovernmentDashboardPage } from '@/pages/sector/GovernmentDashboardPage';

describe('GovernmentDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<GovernmentDashboardPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
  });

  it('renders dashboard with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '1100',
          accountName: 'General Fund',
          debit: 0,
          credit: 50000,
          netChange: -50000,
          amount: -50000,
          date: '2024-01-01',
        },
      ],
    });
    render(<GovernmentDashboardPage />);
    // Real header surface: canonical PageHeader title from the sector config.
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Public Sector / Government Driver Modeling Dashboard',
      })
    ).toBeInTheDocument();
    // Scenario simulator renders driver-driven projections, each with its
    // computation basis — labeled as projections, not measured KPIs.
    expect(screen.getByText('Budget Utilization')).toBeInTheDocument();
    expect(screen.getByText(/Basis: capacity slider passthrough/)).toBeInTheDocument();
    // Measured strip and Data lineage card reflect what the ledger actually
    // contains (a single 1xxx entry): revenue class absent → $0 actuals,
    // assets classified, no invented fund-balance or expense totals.
    expect(screen.getByText('Actual Revenue (classified)')).toBeInTheDocument();
    expect(screen.getByText('Assets (classified)')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Operating Margin' })).toBeInTheDocument();
    expect(screen.getByText(/No expense-class accounts posted/i)).toBeInTheDocument();
  });
});
