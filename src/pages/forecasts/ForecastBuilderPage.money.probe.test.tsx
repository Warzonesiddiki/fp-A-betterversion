import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useGLStore } from '@/store/glStore';
import { backtestForecastMethod } from '@/pages/forecasts/forecastBuilderData';
import { formatPercent } from '@/utils/financialFormatting';

/**
 * Anti-fabrication probe for the forecast builder.
 *
 * Seeded ledger: six posted months of revenue, flat at 100,000, so a flat
 * method backtests at exactly 0% MAPE and the prediction band collapses (no
 * residual dispersion to publish).
 */
const FLAT_LEDGER = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'].map(
  (period, i) => ({
    id: `r${i}`,
    accountCode: '4000',
    debit: 0,
    credit: 100000,
    period,
    date: `${period}-15`,
  })
);

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn(async () => {}) },
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="forecast-series" data-series={JSON.stringify(data)} />
  ),
  Area: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import ForecastBuilderPage from '@/pages/forecasts/ForecastBuilderPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/forecasts/builder']}>
      <ForecastBuilderPage />
    </MemoryRouter>
  );
}

describe('ForecastBuilderPage — accuracy is measured, not asserted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: FLAT_LEDGER as never });
  });

  it('publishes none of the literal accuracy statistics', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).not.toContain('4.2%');
    expect(text).not.toContain('$182K');
    expect(text).not.toContain('0.94');
    expect(text).not.toContain('-1.8%');
  });

  it('renders the MAPE the derivation actually measures', () => {
    // Cross-check against the model for the page's default settings (linear
    // method, 'standard' seasonality). Note this is NOT 0% even on a perfectly
    // flat series: the seasonality preset is an assumption imposed on the data,
    // and the backtest honestly charges the model for it.
    const expected = backtestForecastMethod(
      FLAT_LEDGER.map(() => 100000),
      'linear',
      'standard'
    );
    expect(expected.mapePercent).not.toBeNull();
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain(formatPercent(expected.mapePercent, 1));
    expect(text).toMatch(/walk-forward backtest/);
    expect(text).toContain('Backtest Samples');
    expect(text).toContain('3 periods');
  });

  it('forecasts from posted revenue, not from six invented months', () => {
    const { container } = renderPage();
    // 4,200,000 etc. were the invented actuals.
    expect(container.textContent).not.toContain('4,200,000');
    expect(container.textContent).not.toContain('4,600,000');
  });

  it('plots no forecast line over past periods', () => {
    const { container } = renderPage();
    const el = container.querySelector('[data-testid="forecast-series"]');
    const series = JSON.parse(el?.getAttribute('data-series') ?? '[]') as Array<{
      month: string;
      actual: number | null;
      forecast: number | null;
    }>;
    const past = series.filter((p) => p.actual !== null);
    expect(past.length).toBe(6);
    // The old page drew actual + 2% - 50,000 as a historical "forecast".
    for (const p of past) expect(p.forecast).toBeNull();
  });

  it('bands the forecast from measured residuals, and never by a fixed widening', () => {
    const { container } = renderPage();
    const el = container.querySelector('[data-testid="forecast-series"]');
    const series = JSON.parse(el?.getAttribute('data-series') ?? '[]') as Array<{
      forecast: number | null;
      low: number | null;
      high: number | null;
    }>;
    const projected = series.filter((p) => p.forecast !== null);
    expect(projected.length).toBeGreaterThan(0);

    const expected = backtestForecastMethod(
      FLAT_LEDGER.map(() => 100000),
      'linear',
      'standard'
    );
    const halfWidth = expected.residualStdDev! * 1.96;
    for (const p of projected) {
      expect(p.low).not.toBeNull();
      // The band is a constant width around each point — it does not fan out
      // by 1.5 points per period the way the old one did.
      expect(p.high! - p.low!).toBeCloseTo(halfWidth * 2, 0);
    }
    const widths = projected.map((p) => p.high! - p.low!);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);

    expect(container.textContent).not.toContain('±6%');
    expect(container.textContent).not.toContain('87%');
  });
});

describe('ForecastBuilderPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'ForecastBuilderPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('declares no invented history and no literal accuracy table', () => {
    expect(source).not.toMatch(/HISTORICAL_ACTUALS\s*=/);
    expect(source).not.toMatch(/value:\s*'4\.2%'/);
    expect(source).not.toMatch(/value:\s*'\$182K'/);
    expect(source).not.toMatch(/avgConfidence/);
  });

  it('does not widen a band by a fixed percentage per period', () => {
    expect(source).not.toMatch(/widenPct/);
    expect(source).not.toMatch(/0\.06\s*\+/);
  });

  it('does not synthesise a past forecast line', () => {
    expect(source).not.toMatch(/\*\s*0\.02\s*-\s*50000/);
  });

  it('reads the ledger through the shared derivation', () => {
    expect(source).toMatch(/from '@\/pages\/forecasts\/forecastBuilderData'/);
    expect(source).toMatch(/deriveMonthlyRevenue\(entries\)/);
    expect(source).toMatch(/backtestForecastMethod\(/);
  });
});
