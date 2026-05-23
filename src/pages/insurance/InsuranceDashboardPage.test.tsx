import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/hooks/usePeriods', () => ({
  usePeriods: vi.fn(() => []),
}));

vi.mock('@/engines', () => ({
  InsuranceEngine: {
    calculateStats: vi.fn(() => ({
      policyCount: 0,
      lossExpense: 0,
      combinedRatio: 0,
      netWrittenPremium: 0,
      lossRatio: 0,
    })),
    getPremiumByLine: vi.fn(() => []),
    getCombinedRatioTrend: vi.fn(() => []),
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
    Shield: makeIcon(),
    TrendingUp: makeIcon(),
    DollarSign: makeIcon(),
    Users: makeIcon(),
    Activity: makeIcon(),
    BarChart3: makeIcon(),
    Download: makeIcon(),
    RefreshCw: makeIcon(),
    FileText: makeIcon(),
    Percent: makeIcon(),
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
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import InsuranceDashboardPage from '@/pages/insurance/InsuranceDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/insurance']}>
      <InsuranceDashboardPage />
    </MemoryRouter>
  );
}

describe('InsuranceDashboardPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays dashboard heading', () => {
    renderPage();
    expect(screen.getByText('Insurance Dashboard')).toBeTruthy();
  });
});
