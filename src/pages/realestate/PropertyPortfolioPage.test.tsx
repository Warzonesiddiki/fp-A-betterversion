import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines', () => ({
  RealEstateEngine: {
    calculatePortfolioStats: vi.fn(() => ({
      totalProperties: 0,
      unrealizedGain: 0,
      ltv: 0,
      avgHoldingPeriod: 0,
    })),
    getPropertyBreakdown: vi.fn(() => []),
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

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
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
    Building2: makeIcon(),
    MapPin: makeIcon(),
    DollarSign: makeIcon(),
    TrendingUp: makeIcon(),
    BarChart3: makeIcon(),
    Calendar: makeIcon(),
    Download: makeIcon(),
    Filter: makeIcon(),
    ArrowRight: makeIcon(),
    Hammer: makeIcon(),
    Search: makeIcon(),
    ArrowUpRight: makeIcon(),
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
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div />,
}));

import PropertyPortfolioPage from '@/pages/realestate/PropertyPortfolioPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/realestate/portfolio']}>
      <PropertyPortfolioPage />
    </MemoryRouter>
  );
}

describe('PropertyPortfolioPage smoke test', () => {
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
    expect(screen.getByText(/No Portfolio Data/i)).toBeTruthy();
  });
});
