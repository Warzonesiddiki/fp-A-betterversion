import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));
vi.mock('lucide-react', () => ({
  Landmark: () => <span data-testid="mock-icon" />,
  Layers: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
}));
vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString()}`,
  formatNumber: (v: number) => v.toLocaleString(),
}));

import { render, screen } from '@/test/testUtils';
import BankingDashboardPage from '@/pages/sector/BankingDashboardPage';

describe('BankingDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<BankingDashboardPage />);
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
          accountName: 'Cash Assets',
          debit: 50000,
          credit: 0,
          netChange: 50000,
          amount: 50000,
          date: '2024-01-01',
        },
        {
          id: '2',
          accountCode: '2100',
          accountName: 'Loan Liabilities',
          debit: 0,
          credit: 30000,
          netChange: -30000,
          amount: -30000,
          date: '2024-01-01',
        },
      ],
    });
    render(<BankingDashboardPage />);
    // Real header surface: canonical PageHeader title built from the sector
    // config (not the retired invisible LEGACY_SECTOR_COPY spans).
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Banking / Financial Services Driver Modeling Dashboard',
      })
    ).toBeInTheDocument();
    // Measured-vs-projection KPI strip renders from the classified ledger.
    expect(screen.getByText('Actual Revenue (classified)')).toBeInTheDocument();
    // Data lineage card exposes only account classes actually posted
    // (1xxx assets, 2xxx liabilities) — no invented balance-sheet totals.
    expect(screen.getByText('Assets (classified)')).toBeInTheDocument();
    expect(screen.getByText('Liabilities (classified)')).toBeInTheDocument();
    // The assets-only ledger yields NO invented NIM number — the Net Interest
    // Margin card discloses why it is not derivable instead.
    expect(screen.getByRole('region', { name: 'Net Interest Margin' })).toBeInTheDocument();
    expect(
      screen.getByText(/Needs interest income\/expense accounts and asset-class balances/i)
    ).toBeInTheDocument();
  });
});
