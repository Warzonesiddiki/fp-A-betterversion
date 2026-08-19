import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useGLStore } from '@/store/glStore';
import { useLogisticsStore } from '@/store/logisticsStore';

/**
 * Anti-fabrication probe for the logistics sector dashboard.
 *
 * Seeded (see logisticsDashboardData.test.ts): revenue 1,000,000, cost 500,000,
 * 5 shipments (3 delivered, 1 delayed), lane LAX-DFW 60,000 over 400 loads.
 */
const LEDGER = [
  { id: '1', accountCode: '4000', accountName: 'Freight Revenue', debit: 0, credit: 900000 },
  { id: '2', accountCode: '4100', accountName: 'Accessorials', debit: 0, credit: 100000 },
  { id: '3', accountCode: '5000', accountName: 'Fuel', debit: 300000, credit: 0 },
  { id: '4', accountCode: '6000', accountName: 'Driver Labour', debit: 200000, credit: 0 },
];

const SHIPMENTS = [
  { id: '1', origin: 'A', destination: 'B', carrier: 'C', status: 'Delivered', cost: 100, eta: '' },
  { id: '2', origin: 'A', destination: 'B', carrier: 'C', status: 'Delivered', cost: 100, eta: '' },
  { id: '3', origin: 'A', destination: 'B', carrier: 'C', status: 'Delivered', cost: 100, eta: '' },
  { id: '4', origin: 'A', destination: 'B', carrier: 'C', status: 'Delayed', cost: 100, eta: '' },
  {
    id: '5',
    origin: 'A',
    destination: 'B',
    carrier: 'C',
    status: 'In Transit',
    cost: 100,
    eta: '',
  },
];

const ROUTES = [{ route: 'LAX-DFW', cost: 60000, volume: 400 }];

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
    <div data-testid="cost-series" data-series={JSON.stringify(data)} />
  ),
  Cell: () => null,
}));

import { LogisticsDashboardPage } from '@/pages/sectors/LogisticsDashboardPage';

describe('sectors/LogisticsDashboardPage — figures come from the data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: LEDGER as never });
    useLogisticsStore.setState({ shipments: SHIPMENTS as never, routeCosts: ROUTES });
  });

  it('renders posted revenue and cost', () => {
    const text = render(<LogisticsDashboardPage />).container.textContent ?? '';
    expect(text).toContain('$1,000,000');
    expect(text).toContain('$500,000');
  });

  it('renders none of the hardcoded KPI literals', () => {
    const text = render(<LogisticsDashboardPage />).container.textContent ?? '';
    for (const quote of ['$11.77M', '$842', '82.6%', '78.3%', '$2.84', '3.2']) {
      expect(text).not.toContain(quote);
    }
  });

  it('computes the on-time rate and never falls back to 96.4%', () => {
    const text = render(<LogisticsDashboardPage />).container.textContent ?? '';
    expect(text).toContain('75.0%');
    expect(text).not.toContain('96.4%');
  });

  it('blanks the on-time rate rather than defaulting it when nothing is recorded', () => {
    useLogisticsStore.setState({ shipments: [], routeCosts: ROUTES });
    const text = render(<LogisticsDashboardPage />).container.textContent ?? '';
    expect(text).not.toContain('96.4%');
    expect(text).toContain('On-time delivery rate');
  });

  it('charts revenue and cost from posted accounts, not typed fixtures', () => {
    render(<LogisticsDashboardPage />);
    const revenue = JSON.parse(
      screen.getByTestId('revenue-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ name: string; value: number }>;
    const cost = JSON.parse(
      screen.getByTestId('cost-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ name: string; value: number }>;
    expect(revenue.map((r) => r.name)).toEqual(['Freight Revenue', 'Accessorials']);
    expect(cost.map((c) => c.name)).toEqual(['Fuel', 'Driver Labour']);
    // Assert on the SERIES, not the page text: the disclosure legitimately
    // names FTL / LTL / 3PL to explain why a service-line split is missing,
    // and a guard that reads its own disclosure is the session-011 mistake.
    const names = [...revenue, ...cost].map((r) => r.name);
    for (const invented of ['FTL', 'LTL', '3PL', 'Last-Mile', 'Warehousing']) {
      expect(names).not.toContain(invented);
    }
    expect(revenue.map((r) => r.value)).not.toContain(4820000);
  });

  it('labels lane economics as cost, with cost per load', () => {
    const text = render(<LogisticsDashboardPage />).container.textContent ?? '';
    expect(text).toContain('Route Costs by Lane');
    expect(text).toContain('LAX-DFW');
    expect(text).toContain('$60,000');
    expect(text).toContain('$150/load');
  });

  it('empty-states when nothing is loaded', () => {
    useGLStore.setState({ entries: [] });
    useLogisticsStore.setState({ shipments: [], routeCosts: [] });
    const { container } = render(<LogisticsDashboardPage />);
    expect(screen.getByText('No Logistics Data')).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('sectors/LogisticsDashboardPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'LogisticsDashboardPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('carries no module-level fixture', () => {
    expect(source).not.toMatch(/revenueByServiceLine\s*=/);
    expect(source).not.toMatch(/costDistribution\s*=\s*\[/);
    expect(source).not.toMatch(/monthlyVolume\s*=/);
    expect(source).not.toMatch(/shipments:\s*\d/);
  });

  it('has no literal KPI value and no default service level', () => {
    expect(source).not.toMatch(/value:\s*'\$[\d.]+[kMB]?'/);
    expect(source).not.toMatch(/'96\.4%'/);
    expect(source).not.toMatch(/change:\s*-?[\d.]+,/);
  });

  it('never calls a route cost a revenue', () => {
    expect(source).not.toMatch(/revenue:\s*rc\.cost/);
    expect(source).not.toMatch(/lane\.revenue/);
  });

  it('derives everything through the shared model', () => {
    expect(source).toMatch(/from '@\/pages\/sectors\/logisticsDashboardData'/);
    expect(source).toMatch(/deriveLogisticsDashboard\(entries, shipments, routeCosts\)/);
  });
});
