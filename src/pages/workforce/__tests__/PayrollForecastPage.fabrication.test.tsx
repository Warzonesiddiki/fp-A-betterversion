/**
 * Fabrication regression lock for PayrollForecastPage (gap report #4,
 * zero-fabrication honesty charter).
 *
 * The pre-remediation page rendered genuine per-department payroll next to
 * three invented exhibits: a hand-typed Jan-to-Dec `monthlyForecast` array
 * (basePay $1.8M-$1.9M, benefits $540k-$570k, bonus spikes of $120k/$250k/
 * $500k), a hand-typed Jan-to-Dec `headcountTrend` array (158-170 heads at
 * $14.5k-$17.5k cost per head), and the bar/line/area charts fed by them.
 * No store carries a payroll calendar, scheduled raises/bonus events, or
 * monthly headcount plans, so a month-by-month projection cannot exist.
 * This lock pins the post-remediation contract: department rows derive from
 * workforceStore active employees, the posted-payroll figure derives from GL
 * entries, and the retired exhibits can neither render nor return.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  LineChart: () => <div />,
  Line: () => <div />,
  AreaChart: () => <div />,
  Area: () => <div />,
}));

vi.mock('lucide-react', () => ({
  Download: () => <span />,
  Users: () => <span />,
  DollarSign: () => <span />,
  TrendingUp: () => <span />,
  Percent: () => <span />,
  Search: () => <span />,
  AlertCircle: () => <span />,
  ChevronUp: () => <span />,
  ChevronDown: () => <span />,
}));

import PayrollForecastPage from '../PayrollForecastPage';
import { useGLStore } from '@/store/glStore';
import { useWorkforceStore } from '@/store/workforceStore';

const seededEntries = [
  {
    id: 'pf1',
    accountCode: '7100',
    accountName: 'Salaries & Wages',
    period: '2026-01',
    debit: 50000,
    credit: 0,
    description: 'salary run',
  },
  {
    id: 'pf2',
    accountCode: '4000',
    accountName: 'Revenue',
    period: '2026-01',
    debit: 0,
    credit: 900000,
    description: 'product sales',
  },
];

const seededDepartments = [{ id: 'd1', name: 'Engineering', budget: 0, managerId: 'm1' }];

const seededEmployees = [
  {
    id: 'e1',
    name: 'Alice',
    department: 'Engineering',
    position: 'Engineer',
    salary: 120000,
    startDate: '2024-01-01',
    status: 'active' as const,
  },
  {
    id: 'e2',
    name: 'Bob',
    department: 'Engineering',
    position: 'Engineer',
    salary: 80000,
    startDate: '2024-02-01',
    status: 'active' as const,
  },
];

beforeEach(() => {
  useGLStore.setState({ entries: [] });
  useWorkforceStore.setState({ departments: [], employees: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <PayrollForecastPage />
    </MemoryRouter>
  );
}

describe('PayrollForecastPage (fabrication regression lock)', () => {
  const retiredExhibits = [
    'Monthly Payroll Forecast',
    'Headcount vs Cost per Employee',
    'Benefits Cost Projection',
  ];

  it('renders no retired forecast exhibits', () => {
    useGLStore.setState({ entries: seededEntries as never });
    useWorkforceStore.setState({
      departments: seededDepartments,
      employees: seededEmployees,
    });
    renderPage();
    for (const title of retiredExhibits) {
      expect(screen.queryByText(title)).toBeNull();
    }
  });

  it('discloses that monthly projection inputs are not recorded', () => {
    useGLStore.setState({ entries: seededEntries as never });
    useWorkforceStore.setState({
      departments: seededDepartments,
      employees: seededEmployees,
    });
    renderPage();
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/not recorded/i);
    expect(text).toMatch(/payroll calendar/i);
    expect(text).toMatch(/headcount plan/i);
  });

  it('shows no invented month literals anywhere in rendered output', () => {
    useGLStore.setState({ entries: seededEntries as never });
    useWorkforceStore.setState({
      departments: seededDepartments,
      employees: seededEmployees,
    });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    // Hand-typed base-pay / benefits / totals and cost-per-head figures from
    // the retired arrays — none may appear in any rendered form.
    for (const literal of [
      '$1,800,000',
      '$1,820,000',
      '$1,840,000',
      '$1,860,000',
      '$1,880,000',
      '$1,900,000',
      '$540,000',
      '$552,000',
      '$570,000',
      '$2,340,000',
      '$2,486,000',
      '$2,642,000',
      '$2,970,000',
      '$14,810',
      '$14,625',
      '$15,345',
      '$17,471',
    ]) {
      expect(text).not.toContain(literal);
    }
  });

  it('derives department rows and posted payroll from the stores', () => {
    useGLStore.setState({ entries: seededEntries as never });
    useWorkforceStore.setState({
      departments: seededDepartments,
      employees: seededEmployees,
    });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('Engineering');
    // 120000 + 80000 via sumMoney, headcount 2, cost per head 100000.
    expect(text).toContain('$200,000');
    expect(text).toContain('$100,000');
    // GL-derived posted payroll: only the 71xx posting counts, revenue does not.
    expect(text).toContain('$50,000');
  });

  it('source guard: the retired arrays may not return', () => {
    const source = readFileSync(path.resolve(__dirname, '../PayrollForecastPage.tsx'), 'utf8');
    // Structural pins: the retired array declarations and any chart fed from
    // them may not return. (The remediation header documents the removal by
    // name, so bare-word matching would false-positive on prose.)
    expect(source).not.toMatch(/const\s+monthlyForecast/);
    expect(source).not.toMatch(/const\s+headcountTrend/);
    expect(source).not.toMatch(/data=\{\s*(monthlyForecast|headcountTrend)\s*\}/);
    expect(source).not.toMatch(/'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'/);
    expect(source).not.toMatch(/\b(LineChart|AreaChart)\b/);
    for (const amount of [
      '1800000',
      '1820000',
      '1840000',
      '1860000',
      '1880000',
      '1900000',
      '540000',
      '546000',
      '552000',
      '558000',
      '564000',
      '570000',
      '120000,',
      '250000,',
      '500000,',
      '2340000',
      '2366000',
      '2392000',
      '2418000',
      '2444000',
      '2470000',
      '2486000',
      '2642000',
      '2970000',
      '14810',
      '14625',
      '15345',
      '14605',
      '14585',
      '16110',
      '14566',
      '14548',
      '17471',
    ]) {
      expect(source).not.toContain(amount);
    }
  });
});
