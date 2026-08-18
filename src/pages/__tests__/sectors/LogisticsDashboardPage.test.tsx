import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Structural smoke test for the sectors logistics dashboard.
 *
 * This file previously rendered the page with an EMPTY logistics store and
 * asserted that the dashboard and its charts appeared — which only passed
 * because the page shipped module-level fixtures (service-line revenue, a cost
 * pie, twelve months of shipment volume) and a 96.4% default on-time rate. The
 * page now empty-states, so this asserts that; seeded behaviour lives in
 * `LogisticsDashboardPage.money.test.tsx`.
 */

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
}));

import { render, screen } from '@/test/testUtils';
import { useGLStore } from '@/store/glStore';
import { useLogisticsStore } from '@/store/logisticsStore';
import { LogisticsDashboardPage } from '@/pages/sectors/LogisticsDashboardPage';

describe('sectors/LogisticsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useLogisticsStore.setState({ shipments: [], routeCosts: [] });
  });

  it('asks for data instead of rendering a fixture carrier', () => {
    render(<LogisticsDashboardPage />);
    expect(screen.getByText('No Logistics Data')).toBeInTheDocument();
    expect(screen.queryByText(/\$11\.77M/)).toBeNull();
    expect(screen.queryByText(/96\.4%/)).toBeNull();
  });

  it('renders the dashboard and charts once the ledger has activity', () => {
    useGLStore.setState({
      entries: [
        { id: '1', accountCode: '4000', accountName: 'Freight', debit: 0, credit: 1000 },
        { id: '2', accountCode: '5000', accountName: 'Fuel', debit: 400, credit: 0 },
      ] as never,
    });
    render(<LogisticsDashboardPage />);
    expect(screen.getByText(/Logistics Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });
});
