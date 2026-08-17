import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useGLStore } from '@/store/glStore';

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
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Underwriting Analytics/i })).toBeTruthy();
  });

  it('shows empty state and no invented filings when the GL is empty', () => {
    renderPage();
    expect(screen.getByText(/No Underwriting Analytics Data/i)).toBeInTheDocument();
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/96\.4%/);
    expect(body).not.toMatch(/61\.4%/);
    expect(body).not.toMatch(/RF-401/);
    expect(body).not.toMatch(/\+8\.4%/);
  });

  it('renders posted premium from the GL instead of invented adequacy', () => {
    useGLStore.setState({
      entries: [
        {
          id: '1',
          accountId: '4000',
          accountCode: '4000',
          accountName: 'Premium',
          period: '2026-01',
          periodName: 'Jan',
          debit: 0,
          credit: 1000,
          netChange: 1000,
          date: '2026-01-15',
          amount: 1000,
          description: 'Prem',
          reference: '',
        },
        {
          id: '2',
          accountId: '5100',
          accountCode: '5100',
          accountName: 'Claims',
          period: '2026-01',
          periodName: 'Jan',
          debit: 400,
          credit: 0,
          netChange: 400,
          date: '2026-01-15',
          amount: 400,
          description: 'Loss',
          reference: '',
        },
      ] as never,
    });
    renderPage();
    const body = document.body.textContent ?? '';
    expect(body).toMatch(/\$1,000/);
    expect(body).toMatch(/40\.0%/);
    expect(body).not.toMatch(/96\.4%/);
    expect(body).not.toMatch(/RF-401/);
    useGLStore.setState({ entries: [] });
  });
});
