import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useEducationStore } from '@/store/educationStore';

/**
 * Anti-fabrication probe for the education sector dashboard.
 *
 * The derivation and the formatter run for real; only recharts and icons are
 * stubbed. Seeded ledger and budget are the ones hand-computed in
 * `educationDashboardData.test.ts`:
 *   revenue 1,000,000 (Tuition 750,000 · Research Grant 250,000)
 *   expense   475,000 (Faculty Pay 400,000 · Facilities 75,000)
 *   budget    Tuition 700,000 · Faculty Pay 380,000
 */
const LEDGER = [
  { id: '1', accountCode: '4010', accountName: 'Tuition', debit: 0, credit: 800000 },
  { id: '2', accountCode: '4010', accountName: 'Tuition', debit: 50000, credit: 0 },
  { id: '3', accountCode: '4020', accountName: 'Research Grant', debit: 0, credit: 250000 },
  { id: '4', accountCode: '6010', accountName: 'Faculty Pay', debit: 400000, credit: 0 },
  { id: '5', accountCode: '6020', accountName: 'Facilities', debit: 100000, credit: 0 },
  { id: '6', accountCode: '6020', accountName: 'Facilities', debit: 0, credit: 25000 },
];

const BUDGET_LINES = [
  { id: 'b1', accountCode: '4010', accountName: 'Tuition', amount: 700000 },
  { id: 'b2', accountCode: '6010', accountName: 'Faculty Pay', amount: 380000 },
];

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="revenue-series" data-series={JSON.stringify(data)} />
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ data }: { data: unknown[] }) => (
    <div data-testid="expense-series" data-series={JSON.stringify(data)} />
  ),
  Cell: () => null,
}));

import { EducationDashboardPage } from '@/pages/sectors/EducationDashboardPage';

function seed(): void {
  useGLStore.setState({ entries: LEDGER as never });
  useBudgetStore.setState({ lineItems: BUDGET_LINES as never });
  useEducationStore.setState({ enrollmentTrends: [] });
}

describe('sectors/EducationDashboardPage — figures come from the ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seed();
  });

  it('renders posted totals, not the fictional university', () => {
    const text = render(<EducationDashboardPage />).container.textContent ?? '';
    expect(text).toContain('$1,000,000'); // posted revenue
    expect(text).toContain('$475,000'); // posted expense
    expect(text).toContain('$525,000'); // net result
  });

  it('renders none of the invented literals', () => {
    const text = render(<EducationDashboardPage />).container.textContent ?? '';
    for (const quote of ['$485.0M', '$18,240', '$105.0M', '$95.0M', '4.8%', '38,700', '15:1']) {
      expect(text).not.toContain(quote);
    }
  });

  it('names revenue sources from the chart of accounts, not invented buckets', () => {
    render(<EducationDashboardPage />);
    const series = JSON.parse(
      screen.getByTestId('revenue-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ accountName: string; value: number }>;
    expect(series).toEqual([
      { accountCode: '4010', accountName: 'Tuition', value: 750000, sharePercent: 75 },
      { accountCode: '4020', accountName: 'Research Grant', value: 250000, sharePercent: 25 },
    ]);
    const text = document.body.textContent ?? '';
    for (const invented of ['Donations', 'Admin', 'Student Services']) {
      expect(text).not.toContain(invented);
    }
  });

  it('distributes expense by posted account with real shares', () => {
    render(<EducationDashboardPage />);
    const series = JSON.parse(
      screen.getByTestId('expense-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ accountName: string; value: number; sharePercent: number }>;
    expect(series.map((s) => [s.accountName, s.value])).toEqual([
      ['Faculty Pay', 400000],
      ['Facilities', 75000],
    ]);
    expect(screen.getByText('84.2%')).toBeTruthy();
  });

  it('shows budget variance joined by account, with cost overruns unfavourable', () => {
    const { container } = render(<EducationDashboardPage />);
    const text = container.textContent ?? '';
    expect(text).toContain('$700,000');
    expect(text).toContain('$750,000');
    expect(text).toContain('7.1%'); // tuition favourable
    expect(text).toContain('5.3%'); // faculty pay overrun 20,000 / 380,000
    const overrun = screen.getByText('5.3%');
    expect(overrun.className).toContain('text-red-600');
  });

  it('discloses enrolment and endowment instead of inventing them', () => {
    const text = render(<EducationDashboardPage />).container.textContent ?? '';
    expect(text).toContain('Not derivable from the general ledger');
    expect(text).toMatch(/Student headcount is not a general-ledger fact/);
    expect(text).toContain('Endowment utilisation');
    expect(text).toContain('\u2014'); // cost per student em dash
  });

  it('uses recorded enrolment when the user has entered it', () => {
    useEducationStore.setState({
      enrollmentTrends: [{ semester: 'Fall 2025', undergraduate: 800, graduate: 200, total: 1000 }],
    });
    const text = render(<EducationDashboardPage />).container.textContent ?? '';
    expect(text).toContain('$475'); // 475,000 / 1,000 students
    expect(text).toContain('Fall 2025');
  });

  it('empty-states when the ledger posts no revenue or cost', () => {
    useGLStore.setState({ entries: [] });
    const { container } = render(<EducationDashboardPage />);
    expect(screen.getByText('No Education Data')).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('sectors/EducationDashboardPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'EducationDashboardPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('declares no hardcoded financial fixture', () => {
    expect(source).not.toMatch(/\d{2}_000_000/);
    expect(source).not.toMatch(/value:\s*'\$[\d.]+[kMB]?'/);
    expect(source).not.toMatch(/revenueBySource\s*=\s*\[/);
    expect(source).not.toMatch(/expenseDistribution\s*=\s*\[/);
    expect(source).not.toMatch(/enrollmentTrends\s*=\s*\[/);
    expect(source).not.toMatch(/budgetVsActual\s*=\s*\[/);
  });

  it('decides favourability from the account, not from a label substring', () => {
    expect(source).not.toMatch(/category\.includes\(/);
  });

  it('reads the ledger through the shared derivation', () => {
    expect(source).toMatch(/from '@\/pages\/sectors\/educationDashboardData'/);
    expect(source).toMatch(/deriveEducationDashboard\(entries, lineItems, enrollmentTrends\)/);
    expect(source).toMatch(/useGLStore/);
  });

  it('does no money arithmetic in the view', () => {
    expect(source).not.toMatch(/\w+\.value\s*\/\s*total/);
    expect(source).not.toMatch(/r\.actual\s*-\s*r\.budget/);
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });
});
