import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/energyStore', () => ({
  useEnergyStore: vi.fn(() => ({ assets: [], generationTrend: [], capacityMix: [] })),
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
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
    Sun: makeIcon(),
    Wind: makeIcon(),
    Droplets: makeIcon(),
    Leaf: makeIcon(),
    Battery: makeIcon(),
    TrendingUp: makeIcon(),
    Download: makeIcon(),
    RefreshCw: makeIcon(),
    LayoutGrid: makeIcon(),
    FileText: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronsUpDown: makeIcon(),
    AlertTriangle: makeIcon(),
  };
});

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data?.length ?? 0} rows</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import RenewableEnergyPage from '@/pages/energy/RenewableEnergyPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/energy/renewable']}>
      <RenewableEnergyPage />
    </MemoryRouter>
  );
}

describe('RenewableEnergyPage smoke test', () => {
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
    expect(screen.getByRole('heading', { name: /Renewable Energy/i })).toBeTruthy();
  });
});
