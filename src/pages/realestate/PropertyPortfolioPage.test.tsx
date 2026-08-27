import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import PropertyPortfolioPage from './PropertyPortfolioPage';
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
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
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

const portfolioEntries: GLEntry[] = [
  // Property A: cost 1M, appraised 1.2M, rental 80k, opex 30k → NOI 50k
  gl('a-cost', 'prop-a', '1501', 'Warehouse Acquisition', 1_000_000, 0),
  gl('a-value', 'prop-a', '1601', 'Warehouse Appraisal', 1_200_000, 0),
  gl('a-rent', 'prop-a', '4001', 'Rental Income', 0, 80_000),
  gl('a-opex', 'prop-a', '5001', 'Property Operating Expense', 30_000, 0),
  // Property B: cost 2M, no appraisal, no income
  gl('b-cost', 'prop-b', '1501', 'Tower Acquisition', 2_000_000, 0),
  // Portfolio debt
  gl('debt', 'prop-a', '2501', 'Mortgage Draw', 0, 600_000),
];

describe('PropertyPortfolioPage (real-store, vertical truthfulness)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('shows the honest empty state when nothing is posted', () => {
    render(
      <MemoryRouter>
        <PropertyPortfolioPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No Portfolio Data/i)).toBeTruthy();
  });

  it('renders measured KPIs and per-property rows from the GL', () => {
    useGLStore.setState({ entries: portfolioEntries });
    render(
      <MemoryRouter>
        <PropertyPortfolioPage />
      </MemoryRouter>
    );

    // Properties = entities posting 15xx/16xx balances
    expect(screen.getByText('2')).toBeTruthy();
    // LTV = 600k debt ÷ 1.2M appraised = 50.0%
    expect(screen.getByText('50.0%')).toBeTruthy();
    // Weighted cap rate = NOI 50k ÷ value 1.2M = 4.17%
    expect(screen.getByText('4.17%')).toBeInTheDocument();
    // Two property rows in the inventory table
    expect(screen.getByTestId('data-table').textContent).toContain('2 rows');
  });

  it('never renders the removed fabrications', () => {
    useGLStore.setState({ entries: portfolioEntries });
    const { container } = render(
      <MemoryRouter>
        <PropertyPortfolioPage />
      </MemoryRouter>
    );
    const text = container.textContent ?? '';
    // Invented deltas and narratives removed:
    expect(text).not.toContain('acquisitions in Q1');
    expect(text).not.toContain('since inception');
    expect(text).not.toContain('Deleveraging');
    expect(text).not.toContain('Metro Plaza');
    expect(text).not.toContain('42% complete');
    // Engine mocks must not surface as facts:
    expect(text).not.toContain('4.2 Yrs');
    expect(text).not.toContain('TBD');
    expect(text).not.toContain('6.2%');
    // Hard-coded strategy mix removed:
    expect(text).not.toContain('65%');
  });
});
