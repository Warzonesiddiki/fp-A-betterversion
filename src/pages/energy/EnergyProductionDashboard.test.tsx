// =============================================================================
// EnergyProductionDashboard tests — K18/K30 truthfulness
// -----------------------------------------------------------------------------
// Real store, no store-module mocks: `useEnergyStore` is seeded through
// setState with TEST fixtures that exercise derivation — they are never
// rendered by the page as demo data. The removed SOURCES/MONTHLY fixtures
// and the hardcoded 15000*6 capacity benchmark must stay gone; regression
// guards below pin those literals out of the DOM. The page gates on the
// energy store itself now, not on unrelated GL entries.
//
// Loading skeleton honesty: every store read here is synchronous, so there
// is deliberately no hydrate skeleton (same honesty test as
// ScenarioBuilderPage).
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@/test/testUtils';
import EnergyProductionDashboard from '@/pages/energy/EnergyProductionDashboard';
import {
  useEnergyStore,
  type RenewableAsset,
  type GenerationPoint,
  type CapacitySlice,
} from '@/store/energyStore';
import { ExportEngine } from '@/engines/ExportEngine';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn().mockResolvedValue(undefined) },
}));

// lucide-react is globally mocked in src/test/setup.ts with every named
// export (page icons + EmptyState/KPIValue internals), so no local mock is
// needed here — a narrow local list would whack-a-mole on transitive icons.

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const assetsFixture: RenewableAsset[] = [
  {
    id: 'S-TEST',
    name: 'Test Array',
    type: 'Solar',
    capacity: '10 MW',
    outputYTD: '5 GWh',
    availability: '97%',
    roi: '9%',
  },
];

const trendFixture: GenerationPoint[] = [
  { date: '2026-01-01', solar: 100, wind: 200, hydro: 200, total: 500 },
  { date: '2026-01-02', solar: 150, wind: 250, hydro: 300, total: 700 },
];

const mixFixture: CapacitySlice[] = [
  { name: 'Solar', value: 40, color: '#f59e0b' },
  { name: 'Wind', value: 60, color: '#10b981' },
];

function seedContentState() {
  useEnergyStore.setState({
    assets: assetsFixture,
    generationTrend: trendFixture,
    capacityMix: mixFixture,
  });
}

function seedEmptyState() {
  useEnergyStore.setState({ assets: [], generationTrend: [], capacityMix: [] });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EnergyProductionDashboard', () => {
  it('derives every figure from the real energy store (content state)', () => {
    seedContentState();
    render(<EnergyProductionDashboard />);

    expect(
      screen.getByRole('heading', { name: /energy production/i, level: 1 })
    ).toBeInTheDocument();

    // 500 + 700 = 1,200 MWh across the recorded window; latest point is 700.
    expect(screen.getByRole('region', { name: 'Total Generation (window)' })).toHaveTextContent(
      '1,200 MWh'
    );
    expect(screen.getByRole('region', { name: 'Latest Recorded Period' })).toHaveTextContent(
      '700 MWh'
    );
    expect(screen.getByText(/as of 2026-01-02/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Recorded Assets' })).toHaveTextContent('1');

    // Charts render recorded points and the recorded mix — nothing hand-typed.
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('discloses non-derivable figures instead of estimating them', () => {
    seedContentState();
    render(<EnergyProductionDashboard />);

    const capacityFactor = screen.getByRole('region', { name: 'Capacity Factor' });
    expect(capacityFactor).toHaveTextContent('—');
    expect(capacityFactor).toHaveTextContent(/stated theoretical maximum output/i);
    expect(screen.getByText(/not derivable from recorded energy data/i)).toBeInTheDocument();
    expect(screen.getByText(/operating-cost ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/tariff or PPA feed/i)).toBeInTheDocument();

    // Retired fabrications stay retired (SOURCES/MONTHLY + hardcoded
    // capacity-factor benchmark + GL-gated cost/revenue KPIs).
    expect(screen.queryByText(/4,200/)).not.toBeInTheDocument();
    expect(screen.queryByText(/168,000|152,000|84,000|95,000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/revenue vs cost/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /avg cost \/ mwh/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Gas$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Jan$/)).not.toBeInTheDocument();
  });

  it('K30: empty store renders EmptyState under the mounted h1 — nothing invented', () => {
    seedEmptyState();
    render(<EnergyProductionDashboard />);

    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(
      screen.getByRole('heading', { name: /energy production/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/no energy production data/i)).toBeInTheDocument();

    // No charts are faked for an empty store, and no fixture literals exist.
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    expect(screen.queryByText(/4,200/)).not.toBeInTheDocument();
  });

  it('exports exactly the recorded generation rows; export is disabled without them', () => {
    seedContentState();
    const view = render(<EnergyProductionDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /export recorded generation/i }));
    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const [call] = vi.mocked(ExportEngine.exportToPDF).mock.calls;
    expect(call).toBeDefined();
    const [payload, options] = call as unknown as [
      { headers: string[]; rows: (string | number)[][] },
      { title: string },
    ];
    expect(payload.headers).toEqual(['Date', 'Solar MWh', 'Wind MWh', 'Hydro MWh', 'Total MWh']);
    expect(payload.rows[0]).toEqual(['2026-01-01', 100, 200, 200, 500]);
    expect(payload.rows[1]).toEqual(['2026-01-02', 150, 250, 300, 700]);
    expect(options).toEqual({ title: 'Energy Production' });
    view.unmount();

    // Without recorded points there is nothing truthful to export, so the
    // content-branch export control is not offered at all.
    seedEmptyState();
    render(<EnergyProductionDashboard />);
    expect(
      screen.queryByRole('button', { name: /export recorded generation/i })
    ).not.toBeInTheDocument();
    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
  });
});
