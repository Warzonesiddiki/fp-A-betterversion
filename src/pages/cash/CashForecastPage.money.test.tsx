import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useGLStore } from '@/store/glStore';

/**
 * Money / anti-fabrication probe for the cash position page.
 *
 * The derivation (`cashForecastModel`) and the formatter run for real; only
 * charts and icons are stubbed, and the chart stub captures the exact series.
 *
 * Seeded ledger (see cashForecastModel.test.ts for the hand computation):
 *   receipts 105,000 · disbursements 100,000 · posted balance 5,000
 *   Revenue 100,000 in · OpEx 70,000 out · Cost of Sales 30,000 out
 *   Unclassified 5,000 in · 97.56% attributed
 */
const LEDGER = [
  { id: '1', accountCode: '1000', debit: 100000, credit: 0, period: '2026-01', journalId: 'J1' },
  { id: '2', accountCode: '4000', debit: 0, credit: 100000, period: '2026-01', journalId: 'J1' },
  { id: '3', accountCode: '6000', debit: 60000, credit: 0, period: '2026-02', journalId: 'J2' },
  { id: '4', accountCode: '1000', debit: 0, credit: 60000, period: '2026-02', journalId: 'J2' },
  { id: '5', accountCode: '5000', debit: 30000, credit: 0, period: '2026-02', journalId: 'J3' },
  { id: '6', accountCode: '6000', debit: 10000, credit: 0, period: '2026-02', journalId: 'J3' },
  { id: '7', accountCode: '1000', debit: 0, credit: 40000, period: '2026-02', journalId: 'J3' },
  { id: '8', accountCode: '1100', debit: 5000, credit: 0, period: '2026-02' },
];

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn(async () => {}) },
}));
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('@/components/charts/SparklineChart', () => ({
  SparklineChart: ({ data }: { data: number[] }) => (
    <div data-testid="balance-sparkline">{JSON.stringify(data)}</div>
  ),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ data, children }: { data: unknown[]; children?: React.ReactNode }) => (
    <div data-testid="cash-series" data-series={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import CashForecastPage from '@/pages/cash/CashForecastPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/cash/forecast']}>
      <CashForecastPage />
    </MemoryRouter>
  );
}

describe('CashForecastPage — cash figures come from cash accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: LEDGER as never });
  });

  it('renders posted cash totals, not whole-ledger debit movement', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('$105,000'); // receipts
    expect(text).toContain('$100,000'); // disbursements
    expect(text).toContain('$5,000'); // posted balance
    // The old page summed every entry: inflows would have been 205,000.
    expect(text).not.toContain('$205,000');
  });

  it('shows the average over posted periods, not outflows / 4', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('$2,500'); // 5,000 net over 2 posted periods
    expect(text).not.toContain('$25,000'); // 100,000 / 4
  });

  it('names the cash accounts it used', () => {
    expect(renderPage().container.textContent).toMatch(/accounts 1000, 1100/);
  });

  it('charts posted periods, not thirteen invented weeks', () => {
    renderPage();
    const series = JSON.parse(
      screen.getByTestId('cash-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ period: string; receipts: number; disbursements: number; runningBalance: number }>;
    expect(series).toHaveLength(2);
    expect(series.map((p) => p.period)).toEqual(['2026-01', '2026-02']);
    expect(series[1]!.runningBalance).toBe(5000);
    // No W1..W13 labels anywhere.
    expect(renderPage().container.textContent).not.toMatch(/\bW1\b/);
  });

  it('draws the sparkline from the posted running balance', () => {
    renderPage();
    expect(JSON.parse(screen.getByTestId('balance-sparkline').textContent ?? '[]')).toEqual([
      100000, 5000,
    ]);
  });

  it('attributes categories by counter-account and never invents the old six', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Revenue');
    expect(text).toContain('Operating Expenses');
    expect(text).toContain('Cost of Sales');
    expect(text).toContain('Unclassified');
    for (const invented of ['Other Income', 'Payroll', 'Capital Expenditures', 'Debt Service']) {
      expect(text).not.toContain(invented);
    }
    expect(text).toMatch(/97\.56% of cash movement carried an identifiable counter-line/);
  });

  it('declares the forward forecast unavailable instead of drawing one', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Not derivable from the general ledger');
    expect(text).toContain('Forward 13-week cash forecast');
    expect(text).toMatch(/A\/R and A\/P aging/);
  });

  it('empty-states when no cash account is posted', () => {
    useGLStore.setState({
      entries: [
        { id: 'x', accountCode: '4000', debit: 0, credit: 900, period: '2026-01' },
      ] as never,
    });
    const { container } = renderPage();
    expect(screen.getByText('No Cash Activity')).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('CashForecastPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'CashForecastPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('declares no hardcoded category weights', () => {
    expect(source).not.toMatch(/multiplyMoney\([^)]*0\.(7|4|35|15)\)/);
    expect(source).not.toMatch(/0\.7\b|0\.35\b|0\.15\b/);
  });

  it('synthesises no weekly profile', () => {
    expect(source).not.toMatch(/length:\s*13/);
    expect(source).not.toMatch(/%\s*40\)\s*\*\s*0\.01/);
    expect(source).not.toMatch(/inflows\s*\/\s*13/);
  });

  it('does not divide outflows by a hardcoded period count', () => {
    expect(source).not.toMatch(/divideMoney\(\s*outflows,\s*4\s*\)/);
    expect(source).not.toMatch(/burnRateMonthly/);
  });

  it('derives everything through the shared model', () => {
    expect(source).toMatch(/from '@\/pages\/cash\/cashForecastModel'/);
    expect(source).toMatch(/deriveCashPosition\(entries\)/);
  });

  it('does no money arithmetic in the view', () => {
    expect(source).not.toMatch(/data\.\w+\s*[+\-*/]\s*data\.\w+/);
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });
});
