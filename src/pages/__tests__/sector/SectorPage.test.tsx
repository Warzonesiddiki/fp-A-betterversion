import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/hooks/useSector', () => ({
  useSector: vi.fn(() => ({ sectorConfig: null })),
}));
vi.mock('lucide-react', () => ({
  Layers: () => <span data-testid="mock-icon" />,
  ArrowUpRight: () => <span data-testid="mock-icon" />,
  ArrowDownRight: () => <span data-testid="mock-icon" />,
  Minus: () => <span data-testid="mock-icon" />,
  ChevronUp: () => <span data-testid="mock-icon" />,
  ChevronDown: () => <span data-testid="mock-icon" />,
}));
vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString()}`,
  formatNumber: (v: number) => v.toLocaleString(),
  formatCompactNumber: (v: number) => `${v}K`,
}));

import { render, screen } from '@/test/testUtils';
import SectorPage from '@/pages/sector/SectorPage';

describe('SectorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when sectorConfig is null', () => {
    render(<SectorPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText(/Loading Sector/i)).toBeInTheDocument();
  });

  it('renders empty state when no entries', async () => {
    const { useSector } = await import('@/hooks/useSector');
    (useSector as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sectorConfig: { name: 'Banking', description: 'Banking sector analysis', defaultKPIs: [] },
    });
    render(<SectorPage />);
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Banking — No Data/i)).toBeInTheDocument();
  });

  it('renders dashboard with entries', async () => {
    const { useGLStore } = await import('@/store/glStore');
    const { useSector } = await import('@/hooks/useSector');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '1100',
          accountName: 'Cash',
          debit: 10000,
          credit: 0,
          netChange: 10000,
          amount: 10000,
          date: '2024-01-01',
        },
      ],
    });
    (useSector as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sectorConfig: {
        name: 'Banking',
        description: 'Banking sector analysis',
        defaultKPIs: [{ id: 'gross_margin', label: 'Gross Margin', format: 'percent', target: 40 }],
      },
    });
    render(<SectorPage />);
    expect(screen.getByText(/Sector Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Gross Margin/i)).toBeInTheDocument();
  });
});
