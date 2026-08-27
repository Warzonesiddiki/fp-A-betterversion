import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const glState = vi.hoisted(() => ({
  entries: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => glState),
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
    FileSearch: makeIcon(),
    TrendingUp: makeIcon(),
    DollarSign: makeIcon(),
    Users: makeIcon(),
    AlertTriangle: makeIcon(),
    BarChart3: makeIcon(),
    Download: makeIcon(),
    Filter: makeIcon(),
    Clock: makeIcon(),
    PieChart: makeIcon(),
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
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

// The page imports InsuranceEngine from its direct path, not the barrel —
// mock THAT module so unit tests stay isolated from real ratio math.
vi.mock('@/engines/InsuranceEngine', () => ({
  InsuranceEngine: {
    calculateStats: vi.fn(() => ({
      lossRatio: null,
      combinedRatio: null,
      earnedPremium: 0,
    })),
    getPremiumByLine: vi.fn(() => []),
    getCombinedRatioTrend: vi.fn(() => []),
  },
}));

import ClaimsAnalyticsPage from '@/pages/insurance/ClaimsAnalyticsPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/insurance/claims']}>
      <ClaimsAnalyticsPage />
    </MemoryRouter>
  );
}

describe('ClaimsAnalyticsPage smoke test', () => {
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
  it('displays page heading', () => {
    renderPage();
    expect(screen.getByText('Claims Analytics')).toBeTruthy();
  });
});

describe('ClaimsAnalyticsPage — Loss Run Export honesty (R4 residual)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    glState.entries = [];
  });

  it('renders no Loss Run Export control when the GL is empty', () => {
    renderPage();
    expect(screen.queryByText(/loss run export/i)).not.toBeInTheDocument();
  });

  it('still renders no Loss Run Export control once entries exist (was an enabled no-op)', () => {
    glState.entries = [{ accountCode: '5100', period: '2026-01', debit: 100 }];
    renderPage();
    expect(screen.queryByText(/loss run export/i)).not.toBeInTheDocument();
    // Page still mounts fully with data present.
    expect(screen.getByText('Claims Analytics')).toBeInTheDocument();
    // The per-claim disclosure stands: no claim rows are shown or implied.
    expect(screen.getAllByText(/claim-management/i).length).toBeGreaterThan(0);
  });
});
