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
    expect(screen.getByText(/Education Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tuition Revenue/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Grant Income/i).length).toBeGreaterThanOrEqual(1);
  });
});
