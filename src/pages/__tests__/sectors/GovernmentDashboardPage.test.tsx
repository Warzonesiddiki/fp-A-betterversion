import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Structural smoke test for the sectors government dashboard.
 *
 * This file previously rendered the page with an EMPTY government store and
 * asserted that departments, budgets and charts appeared — which only passed
 * because the page fell back to `mockDepartmentBudget` /
 * `mockRevenueByCategory` demo data for every empty workspace. The page now
 * empty-states instead, so this file asserts that, and the seeded behaviour
 * lives in `GovernmentDashboardPage.money.test.tsx`.
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

import { render, screen, fireEvent } from '@/test/testUtils';
import { useGLStore } from '@/store/glStore';
import { useGovernmentStore } from '@/store/governmentStore';
import { GovernmentDashboardPage } from '@/pages/sectors/GovernmentDashboardPage';

const SEEDED = [
  {
    id: '1',
    accountCode: '4100',
    accountName: 'Income Tax',
    debit: 0,
    credit: 500000,
    period: '2026-01',
  },
  {
    id: '2',
    accountCode: '6100',
    accountName: 'Education',
    debit: 200000,
    credit: 0,
    period: '2026-01',
  },
];

describe('sectors/GovernmentDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useGovernmentStore.setState({ budgetLines: [] });
  });

  it('asks for data instead of demonstrating a fictional jurisdiction', () => {
    render(<GovernmentDashboardPage />);
    expect(screen.getByText('No Government Data')).toBeInTheDocument();
    expect(screen.queryByText(/Infrastructure/)).toBeNull();
    expect(screen.queryByText(/93\.2%/)).toBeNull();
  });

  it('renders the dashboard once the ledger has activity', () => {
    useGLStore.setState({ entries: SEEDED as never });
    render(<GovernmentDashboardPage />);
    expect(screen.getByText(/Government Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Department/i).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });

  it('renders tabs and allows tab switching', () => {
    useGLStore.setState({ entries: SEEDED as never });
    render(<GovernmentDashboardPage />);
    const spendingTab = screen.getByText('Spending');
    fireEvent.click(spendingTab);
    expect(spendingTab).toBeInTheDocument();
  });
});
