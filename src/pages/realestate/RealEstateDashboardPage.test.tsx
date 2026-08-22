import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import RealEstateDashboardPage from './RealEstateDashboardPage';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
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
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

function gl(
  id: string,
  entityId: string,
  accountCode: string,
  accountName: string,
  debit: number,
  credit: number
): GLEntry {
  return {
    id,
    accountId: accountCode,
    accountCode,
    accountName,
    period: 'P01',
    periodName: 'January',
    debit,
    credit,
    netChange: debit - credit,
    date: '2026-01-15',
    amount: Math.abs(debit - credit),
    description: accountName,
    reference: id,
    entityId,
    currency: 'USD',
  };
}

const dashboardEntries: GLEntry[] = [
  // Property A: cost 1M, appraised 1.2M, rental 80k, opex 30k → NOI 50k
  gl('a-cost', 'prop-a', '1501', 'Warehouse Acquisition', 1_000_000, 0),
  gl('a-value', 'prop-a', '1601', 'Warehouse Appraisal', 1_200_000, 0),
  gl('a-rent', 'prop-a', '4001', 'Rental Income', 0, 80_000),
  gl('a-opex', 'prop-a', '5001', 'Property Operating Expense', 30_000, 0),
  // Property B: cost 2M only
  gl('b-cost', 'prop-b', '1501', 'Tower Acquisition', 2_000_000, 0),
];

describe('RealEstateDashboardPage (real-store, vertical truthfulness)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('shows the honest empty state when nothing is posted', () => {
    render(
      <MemoryRouter>
        <RealEstateDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No Real Estate Data/i)).toBeTruthy();
  });

  it('renders measured portfolio KPIs from the GL', () => {
    useGLStore.setState({ entries: dashboardEntries });
    render(
      <MemoryRouter>
        <RealEstateDashboardPage />
      </MemoryRouter>
    );

    // Weighted cap rate = NOI 50k ÷ appraised 1.2M = 4.17%
    expect(screen.getByText('4.17%')).toBeInTheDocument();
    // NOI tile carries its derivation basis (rental income less property opex)
    expect(screen.getByText('rental income less property opex')).toBeInTheDocument();
    // One table row per posting property
    expect(screen.getByTestId('data-table').textContent).toContain('2 rows');
    // The occupancy KPI is gone entirely — occupancy is not a ledger fact.
    expect(screen.queryByText(/Portfolio Occupancy/i)).toBeNull();
  });

  it('never renders the removed fabrications', () => {
    useGLStore.setState({ entries: dashboardEntries });
    const { container } = render(
      <MemoryRouter>
        <RealEstateDashboardPage />
      </MemoryRouter>
    );
    const text = container.textContent ?? '';
    // Mocked engine constant + fake deltas + sparklines removed:
    expect(text).not.toContain('94.8');
    expect(text).not.toContain('valuation update Q1');
    expect(text).not.toContain('OpEx reduction');
    expect(text).not.toContain('compression in prime');
    // Invented charts removed:
    expect(text).not.toContain('Occupancy Rate Trends');
    expect(text).not.toContain('Geographic Split');
    expect(text).not.toContain('North America');
    expect(text).not.toContain('Office');
  });
});
