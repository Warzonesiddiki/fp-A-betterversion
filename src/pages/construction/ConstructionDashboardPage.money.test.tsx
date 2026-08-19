import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useConstructionStore } from '@/store/constructionStore';

/**
 * Source guard + DOM probe for the construction dashboard rewrite
 * (session 024). The pre-session-024 page read NO store: it rendered a
 * fictional backlog trend, five invented projects with budgets and margins,
 * hardcoded KPIs and a 42/58 labor split. The derivation now runs for real
 * against `constructionStore`; only recharts and icons are stubbed.
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
    <div data-testid="breakdown-series" data-series={JSON.stringify(data)} />
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import ConstructionDashboardPage from '@/pages/construction/ConstructionDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/construction/dashboard']}>
      <ConstructionDashboardPage />
    </MemoryRouter>
  );
}

const EMPTY = { costBreakdown: [], changeOrders: [], costLedger: [] };

describe('ConstructionDashboardPage — source guards', () => {
  const pageSrc = stripComments(
    fs.readFileSync(path.resolve(__dirname, './ConstructionDashboardPage.tsx'), 'utf8')
  );

  it('no module-level fixture datasets survive', () => {
    expect(pageSrc).not.toMatch(/backlogTrend/);
    expect(pageSrc).not.toMatch(/projectStatus/);
  });

  it('no literal KPI values in the page body', () => {
    expect(pageSrc).not.toMatch(/\$142\.5M/);
    expect(pageSrc).not.toMatch(/\$74\.2M/);
    expect(pageSrc).not.toMatch(/11\.8%/);
  });

  it('reads the construction store', () => {
    expect(pageSrc).toMatch(/useConstructionStore/);
  });
});

describe('ConstructionDashboardPage — figures come from the store', () => {
  beforeEach(() => {
    useConstructionStore.setState({
      costBreakdown: [
        { name: 'Concrete', budget: 500000, actual: 460000 },
        { name: 'Steel', budget: 300000, actual: 330000 },
      ],
      changeOrders: [
        {
          id: 'co1',
          project: 'Downtown Plaza',
          description: 'Scope increase',
          amount: '$25,000',
          status: 'Approved',
        },
      ],
      costLedger: [],
    });
  });

  afterEach(() => {
    useConstructionStore.setState(EMPTY);
  });

  it('renders recorded totals, not the fictional contractor', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('$800,000'); // total budget
    expect(text).toContain('$790,000'); // actual cost
    expect(text).toContain('$10,000'); // variance, budget − actual
    expect(text).toContain('$25,000'); // approved change orders
  });

  it('feeds the recorded breakdown into the chart series', () => {
    const { container } = renderPage();
    const series = container.querySelector('[data-testid="breakdown-series"]');
    expect(series).toBeTruthy();
    const parsed = JSON.parse(series!.getAttribute('data-series') ?? '[]') as {
      name?: string;
      variance?: number;
    }[];
    const steel = parsed.find((p) => p.name === 'Steel');
    expect(steel?.variance).toBe(-30000); // per-row, not one aggregate stamped on all rows
  });

  it('empty-states with an h1 when nothing is recorded', () => {
    useConstructionStore.setState(EMPTY);
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /No Construction Data/i })).toBeTruthy();
  });
});
