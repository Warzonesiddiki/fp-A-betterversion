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

  // =============================================================================
  // Empty-branch honesty (K17/K18): with a fully empty store — the post-
  // 1bea2f3a factory default — every KPI renders '—', no chart mounts and
  // the asset table is replaced by disclosure copy. No seeded records may
  // appear.
  // =============================================================================
  it('empty store renders disclosures and mounts no chart or table', () => {
    renderPage();

    // KPIs disclose absence instead of showing figures. The absence label
    // repeats across all four cards and the capacity/table descriptions, so
    // these are asserted with getAllByText.
    expect(screen.getAllByText(/no generation on file/i).length).toBeGreaterThan(0);
    const solarKpi = screen.getByRole('region', { name: /Solar \(latest period\)/i });
    expect(solarKpi).toHaveTextContent('—');
    expect(screen.getAllByText(/no assets recorded/i).length).toBeGreaterThan(0);

    // Generation chart: disclosure text only, no LineChart mount.
    expect(screen.getByText(/No generation trend recorded yet\./i)).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();

    // Capacity card: disclosure only, no PieChart mount.
    expect(screen.getByText(/No assets to chart\./i)).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();

    // Asset portfolio: disclosure paragraphs replace the DataTable.
    expect(screen.getByText(/No renewable assets recorded yet\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Add assets in the energy store to populate this table\./i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();

    // The REC / CO2 non-derivability disclosure stays visible.
    expect(
      screen.getByText(/Renewable Energy Credits \(RECs\) and CO2 offset are not derivable/i)
    ).toBeInTheDocument();
  });
});
