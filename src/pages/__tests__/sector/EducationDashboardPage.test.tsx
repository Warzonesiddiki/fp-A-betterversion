import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('lucide-react', () => ({
  GraduationCap: () => <span data-testid="mock-icon" />,
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
import { EducationDashboardPage } from '@/pages/sector/EducationDashboardPage';

describe('EducationDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<EducationDashboardPage />);
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
          accountName: 'Tuition Revenue',
          debit: 0,
          credit: 100000,
          netChange: -100000,
          amount: -100000,
          date: '2024-01-01',
        },
      ],
    });
    render(<EducationDashboardPage />);
    // Real header surface: canonical PageHeader title from the sector config
    // (not the retired invisible LEGACY_SECTOR_COPY spans).
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Education / Higher Ed Driver Modeling Dashboard',
      })
    ).toBeInTheDocument();
    // The tuition-only ledger classifies revenue but posts neither a COGS
    // nor an OpEx class, so Operating Margin stays honestly null with its
    // disclosure note.
    expect(screen.getByText('Actual Revenue (classified)')).toBeInTheDocument();
    expect(screen.getByText('Revenue (classified)')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Operating Margin' })).toBeInTheDocument();
    expect(screen.getByText('No expense-class accounts posted.')).toBeInTheDocument();
  });
});
