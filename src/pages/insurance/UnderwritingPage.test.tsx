import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const mockInsuranceState = {
  rateAdequacy: [],
  lossPicks: [],
  rateFilings: [],
};
vi.mock('@/store/insuranceStore', () => ({
  useInsuranceStore: (selector?: (s: typeof mockInsuranceState) => unknown) =>
    selector ? selector(mockInsuranceState) : mockInsuranceState,
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
    Scale: makeIcon(),
    TrendingUp: makeIcon(),
    TrendingDown: makeIcon(),
    DollarSign: makeIcon(),
    AlertTriangle: makeIcon(),
    BarChart3: makeIcon(),
    Download: makeIcon(),
    Filter: makeIcon(),
    Percent: makeIcon(),
    Target: makeIcon(),
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
  ComposedChart: () => <div data-testid="composed-chart" />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import UnderwritingPage from '@/pages/insurance/UnderwritingPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/insurance/underwriting']}>
      <UnderwritingPage />
    </MemoryRouter>
  );
}

describe('UnderwritingPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Underwriting Analytics/i })).toBeTruthy();
  });
});
