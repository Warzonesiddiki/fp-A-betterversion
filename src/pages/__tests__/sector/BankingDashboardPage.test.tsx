import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
          date: '2024-01-01',
        },
        {
          id: '2',
          accountCode: '2100',
          accountName: 'Loan Liabilities',
          debit: 0,
          credit: 30000,
          netChange: -30000,
          date: '2024-01-01',
        },
      ],
    });
    render(<BankingDashboardPage />);
    expect(screen.getByText('Banking Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Total Assets/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Liabilities/i)).toBeInTheDocument();
    expect(screen.getByText(/Interest Income/i)).toBeInTheDocument();
    expect(screen.getByText(/Capital.*Risk/i)).toBeInTheDocument();
    expect(screen.getByText(/NPL Ratio/i)).toBeInTheDocument();
  });
});
