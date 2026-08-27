import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));

vi.mock('@/engines', () => ({
  RealEstateEngine: {
    calculateREITStats: vi.fn(() => ({
      ffo: 0,
      affo: 0,
      dividendYield: 0,
      navPerShare: 0,
      payoutRatio: 0,
    })),
  },
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data?.length ?? 0} rows</div>
  ),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    BarChart3: makeIcon(),
    TrendingUp: makeIcon(),
    DollarSign: makeIcon(),
    PieChart: makeIcon(),
    ArrowUpRight: makeIcon(),
    Download: makeIcon(),
    Filter: makeIcon(),
    Users: makeIcon(),
    Wallet: makeIcon(),
    Globe: makeIcon(),
    ShieldCheck: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronsUpDown: makeIcon(),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import REITDashboardPage from '@/pages/realestate/REITDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/realestate/reit']}>
      <REITDashboardPage />
    </MemoryRouter>
  );
}

describe('REITDashboardPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No REIT Data/i)).toBeTruthy();
  });

  it('does not render invented peer quotes or a mocked 5.42% yield', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '4001',
          accountName: 'Rental income',
          debit: 0,
          credit: 2000000,
          amount: 2000000,
          date: '2026-01-15',
          period: '2026-01',
        },
      ],
    });
    renderPage();
    const body = document.body.textContent ?? '';
    expect(body).toMatch(/REIT Analytics/i);
    expect(body).not.toMatch(/Prologis/);
    expect(body).not.toMatch(/American Tower/);
    expect(body).not.toMatch(/\$112B/);
    expect(body).not.toMatch(/5\.42%/);
    expect(body).not.toMatch(/1\.38x/);
    expect(body).toMatch(/not derivable/i);
  });
});
