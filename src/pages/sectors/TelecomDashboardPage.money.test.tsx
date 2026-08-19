import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useTelecomStore } from '@/store/telecomStore';

/**
 * Source guard + DOM probe for the telecom dashboard rewrite (session 024).
 *
 * The pre-session-024 page shipped module fixtures (segment revenue in $B,
 * a CapEx pie, six quarters of subscriber growth) and five literal KPIs
 * (churn rate, network CapEx, EBITDA margin, coverage, CAC) that rendered
 * for every tenant regardless of recorded data. The derivation runs for
 * real here against the live store; only recharts and icons are stubbed.
 */

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
}

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="bar-chart" data-series={JSON.stringify(data)} />
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import { TelecomDashboardPage } from '@/pages/sectors/TelecomDashboardPage';

const SUBSCRIBERS = [
  { id: 's1', plan: 'Core', monthlyRevenue: 50, churnRisk: 'Low', status: 'Active' },
  { id: 's2', plan: 'Plus', monthlyRevenue: 60.25, churnRisk: 'Medium', status: 'Active' },
  { id: 's3', plan: 'Basic', monthlyRevenue: 40, churnRisk: 'High', status: 'Active' },
  { id: 's4', plan: 'Core', monthlyRevenue: 100, churnRisk: 'Low', status: 'Suspended' },
];

describe('TelecomDashboardPage — source guards', () => {
  const pageSrc = stripComments(
    fs.readFileSync(path.resolve(__dirname, './TelecomDashboardPage.tsx'), 'utf8')
  );
  const dataSrc = stripComments(
    fs.readFileSync(path.resolve(__dirname, './telecomDashboardData.ts'), 'utf8')
  );

  it('no module-level fixture datasets survive', () => {
    expect(pageSrc).not.toMatch(/revenueBySegment/);
    expect(pageSrc).not.toMatch(/capexDistribution/);
    expect(pageSrc).not.toMatch(/subscriberGrowth/);
  });

  it('no literal KPI values in the page body', () => {
    // The pre-024 KPI strip's invented figures must not reappear anywhere.
    expect(pageSrc).not.toMatch(/1\.4%/);
    expect(pageSrc).not.toMatch(/\$4\.8B/);
    expect(pageSrc).not.toMatch(/36\.2/);
    expect(pageSrc).not.toMatch(/78\.5/);
    expect(pageSrc).not.toMatch(/\$142/);
  });

  it('ARPU is aggregated through @/utils/money', () => {
    expect(dataSrc).toMatch(/from '@\/utils\/money'/);
    expect(dataSrc).toMatch(/sumMoney/);
    expect(dataSrc).toMatch(/divideMoney/);
  });
});

describe('TelecomDashboardPage — figures come from the store', () => {
  beforeEach(() => {
    useTelecomStore.setState({
      subscribers: SUBSCRIBERS as never,
      networkMetrics: [],
      arpuTrends: [{ month: '2025-01', arpu: 48.2, subscribers: 3 }],
    });
  });

  afterEach(() => {
    useTelecomStore.setState({ subscribers: [], networkMetrics: [], arpuTrends: [] });
  });

  it('renders recorded ARPU and subscriber counts, not literals', () => {
    const text = render(<TelecomDashboardPage />).container.textContent ?? '';
    // (50 + 60.25 + 40) / 3 over the three ACTIVE subscribers.
    expect(text).toContain('$50.08');
    expect(text).toContain('3'); // active subscribers
  });

  it('feeds the recorded ARPU trend into the chart series', () => {
    const { container } = render(<TelecomDashboardPage />);
    const series = container.querySelector('[data-testid="bar-chart"]');
    expect(series).toBeTruthy();
    const parsed = JSON.parse(series!.getAttribute('data-series') ?? '[]') as {
      arpu?: number;
    }[];
    expect(parsed.some((p) => p.arpu === 48.2)).toBe(true);
  });

  it('discloses the metrics this workspace does not record', () => {
    const text = render(<TelecomDashboardPage />).container.textContent ?? '';
    expect(text).toContain('Not shown on this dashboard');
  });

  it('empty-states with an h1 when nothing is recorded', () => {
    useTelecomStore.setState({ subscribers: [], networkMetrics: [], arpuTrends: [] });
    render(<TelecomDashboardPage />);
    expect(screen.getByRole('heading', { level: 1, name: /No Telecom Data/i })).toBeTruthy();
  });
});
