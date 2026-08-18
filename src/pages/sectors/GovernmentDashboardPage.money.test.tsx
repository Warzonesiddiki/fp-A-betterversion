import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useGLStore } from '@/store/glStore';
import { useGovernmentStore } from '@/store/governmentStore';

/**
 * Anti-fabrication probe for the government sector dashboard.
 *
 * Seeded ledger (see governmentDashboardData.test.ts):
 *   posted revenue 1,600,000 · expenditure 800,000 · surplus 800,000
 *   FY2025 → FY2026 revenue 600,000 → 1,000,000
 *   appropriations Education 800,000/700,000 · Public Safety 200,000/100,000
 */
const LEDGER = [
  {
    id: '1',
    accountCode: '4100',
    accountName: 'Income Tax',
    debit: 0,
    credit: 600000,
    period: '2025-06',
  },
  {
    id: '2',
    accountCode: '6100',
    accountName: 'Education',
    debit: 300000,
    credit: 0,
    period: '2025-06',
  },
  {
    id: '3',
    accountCode: '4100',
    accountName: 'Income Tax',
    debit: 0,
    credit: 800000,
    period: '2026-03',
  },
  {
    id: '4',
    accountCode: '4200',
    accountName: 'Grants',
    debit: 0,
    credit: 200000,
    period: '2026-03',
  },
  {
    id: '5',
    accountCode: '6100',
    accountName: 'Education',
    debit: 400000,
    credit: 0,
    period: '2026-03',
  },
  {
    id: '6',
    accountCode: '6200',
    accountName: 'Public Safety',
    debit: 100000,
    credit: 0,
    period: '2026-03',
  },
];

const BUDGET_LINES = [
  { category: 'Education', budgeted: 800000, actual: 700000 },
  { category: 'Public Safety', budgeted: 200000, actual: 100000 },
];

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="bar-series" data-series={JSON.stringify(data)} />
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ data }: { data: unknown[] }) => (
    <div data-testid="pie-series" data-series={JSON.stringify(data)} />
  ),
  Cell: () => null,
}));

import { GovernmentDashboardPage } from '@/pages/sectors/GovernmentDashboardPage';

describe('sectors/GovernmentDashboardPage — figures come from the ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: LEDGER as never });
    useGovernmentStore.setState({ budgetLines: BUDGET_LINES });
  });

  it('renders posted revenue, expenditure and surplus', () => {
    const text = render(<GovernmentDashboardPage />).container.textContent ?? '';
    expect(text).toContain('$1,600,000');
    expect(text).toContain('$800,000');
  });

  it('renders none of the hardcoded KPI literals', () => {
    const text = render(<GovernmentDashboardPage />).container.textContent ?? '';
    for (const quote of ['$11.8B', '$8.95B', '$800M', '1.48x', '$1.9B', '87.3%', '$342']) {
      expect(text).not.toContain(quote);
    }
  });

  it('separates revenue categories from spending categories', () => {
    render(<GovernmentDashboardPage />);
    const bar = JSON.parse(screen.getByTestId('bar-series').getAttribute('data-series') ?? '[]');
    const pie = JSON.parse(screen.getByTestId('pie-series').getAttribute('data-series') ?? '[]');
    expect(bar).toEqual([
      { name: 'Income Tax', value: 1400000 },
      { name: 'Grants', value: 200000 },
    ]);
    expect(pie).toEqual([
      { name: 'Education', value: 700000 },
      { name: 'Public Safety', value: 100000 },
    ]);
  });

  it('shows budget execution from posted appropriations', () => {
    const text = render(<GovernmentDashboardPage />).container.textContent ?? '';
    expect(text).toContain('87.5%'); // Education 700,000 / 800,000
    expect(text).toContain('50.0%'); // Public Safety 100,000 / 200,000
    expect(text).not.toContain('93.2%');
  });

  it('labels fiscal years from the data, not FY2024/FY2025 literals', () => {
    const text = render(<GovernmentDashboardPage />).container.textContent ?? '';
    expect(text).toContain('FY 2025');
    expect(text).toContain('FY 2026');
    expect(text).toContain('66.7%'); // revenue 600,000 -> 1,000,000
  });

  it('discloses what a ledger cannot answer', () => {
    const text = render(<GovernmentDashboardPage />).container.textContent ?? '';
    expect(text).toContain('Not derivable from the general ledger');
    expect(text).toContain('Debt service ratio');
    expect(text).toContain('Programme effectiveness and cost per citizen');
  });

  it('empty-states instead of showing demo departments', () => {
    useGLStore.setState({ entries: [] });
    useGovernmentStore.setState({ budgetLines: [] });
    const { container } = render(<GovernmentDashboardPage />);
    expect(screen.getByText('No Government Data')).toBeTruthy();
    const text = container.textContent ?? '';
    expect(text).not.toContain('Infrastructure');
    expect(text).not.toContain('Social Services');
    expect(text).not.toMatch(/\$\d/);
  });
});

describe('sectors/GovernmentDashboardPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'GovernmentDashboardPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('carries no demo fixture and no fallback to one', () => {
    expect(source).not.toMatch(/mockDepartmentBudget/);
    expect(source).not.toMatch(/mockRevenueByCategory/);
    expect(source).not.toMatch(/mockSpendingDistribution/);
    expect(source).not.toMatch(/budgetLines\.length\s*\?/);
  });

  it('declares no hardcoded KPI strip or fiscal-year table', () => {
    expect(source).not.toMatch(/value:\s*'\$[\d.]+[MB]?'/);
    expect(source).not.toMatch(/fy2024|fy2025/);
    expect(source).not.toMatch(/change:\s*-?[\d.]+,/);
  });

  it('reads both the ledger and the government store through the derivation', () => {
    expect(source).toMatch(/from '@\/pages\/sectors\/governmentDashboardData'/);
    expect(source).toMatch(/deriveGovernmentDashboard\(entries, budgetLines\)/);
  });

  it('does no money arithmetic in the view', () => {
    expect(source).not.toMatch(/l\.actual\s*\/\s*l\.budgeted/);
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });
});
