import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], trialBalance: [] })),
}));

vi.mock('@/hooks/usePeriods', () => ({
  usePeriods: vi.fn(() => []),
}));

vi.mock('@/engines', () => ({
  EnergyEngine: {
    calculateStats: vi.fn(() => ({
      totalRevenue: 0,
      productionVolume: 0,
      avgMarketPrice: 0,
      carbonIntensity: 0,
    })),
    getProductionBySource: vi.fn(() => []),
    getRevenueTrend: vi.fn(() => []),
  },
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div />,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

import EnergyDashboardPage from '@/pages/energy/EnergyDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/energy']}>
      <EnergyDashboardPage />
    </MemoryRouter>
  );
}

describe('EnergyDashboardPage smoke test', () => {
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
  it('displays dashboard heading', () => {
    renderPage();
    expect(screen.getByText('Energy Dashboard')).toBeTruthy();
  });

  // =============================================================================
  // Empty-branch honesty (K17/K18): with the post-1bea2f3a factory defaults
  // (real store, all slices []) and an empty GL, every KPI renders '—' with
  // its disclosure, no chart mounts, and the asset table is replaced by
  // disclosure copy. No seeded records may appear.
  // =============================================================================
  it('empty store and GL render disclosures and mount no chart or table', () => {
    renderPage();

    const gridProduction = screen.getByRole('region', { name: 'Grid Production (window)' });
    expect(gridProduction).toHaveTextContent('—');
    expect(gridProduction).toHaveTextContent('no generation on file');

    const revenueKpi = screen.getByRole('region', { name: 'Total Energy Revenue (GL)' });
    expect(revenueKpi).toHaveTextContent('—');
    expect(revenueKpi).toHaveTextContent(/no 4xxx revenue in the GL/i);

    expect(screen.getByText('spot-price feed not connected')).toBeInTheDocument();
    expect(screen.getByText('intensity feed not connected')).toBeInTheDocument();

    // Generation chart: disclosure only — no AreaChart mount.
    expect(screen.getByText(/No generation trend recorded yet\./i)).toBeInTheDocument();
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();

    // Production by Source + asset table: disclosures only — no BarChart,
    // no ResponsiveContainer, no DataTable.
    expect(
      screen.getByText(/Record renewable assets to populate this chart\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Add renewable assets in the energy store to populate this table\./i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
  });
});
