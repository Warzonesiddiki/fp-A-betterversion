import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Structural smoke test for the sectors education dashboard.
 *
 * This file previously asserted `Tuition Revenue`, `Financial Aid Disbursed`
 * and `Research Funding` — the labels of a hardcoded KPI list for a fictional
 * university ($485.0M tuition, 38,700 students). It also mocked
 * `useEducationStore` as returning a `kpis` array, a shape that store has never
 * had, so the mock proved nothing. The page now derives from the general
 * ledger, so this file asserts the empty state, and the seeded-ledger
 * behaviour is covered by `EducationDashboardPage.money.test.tsx`.
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
import { EducationDashboardPage } from '@/pages/sectors/EducationDashboardPage';

describe('sectors/EducationDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders the education dashboard shell', () => {
    render(<EducationDashboardPage />);
    expect(screen.getByRole('main', { name: /Education Sector Dashboard/i })).toBeInTheDocument();
  });

  it('asks for ledger data instead of displaying an invented university', () => {
    render(<EducationDashboardPage />);
    expect(screen.getByText('No Education Data')).toBeInTheDocument();
    expect(screen.queryByText(/\$485\.0M/)).toBeNull();
    expect(screen.queryByText(/38,700/)).toBeNull();
  });

  it('renders charts once the ledger has activity', () => {
    useGLStore.setState({
      entries: [
        { id: '1', accountCode: '4010', accountName: 'Tuition', debit: 0, credit: 1000 },
        { id: '2', accountCode: '6010', accountName: 'Faculty Pay', debit: 400, credit: 0 },
      ] as never,
    });
    render(<EducationDashboardPage />);
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });
});
