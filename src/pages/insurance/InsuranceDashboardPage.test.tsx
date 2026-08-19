/**
 * InsuranceDashboardPage — DOM probe against the REAL engine.
 *
 * The previous version of this file mocked `@/engines` (a barrel the page does
 * not import, so the mock never applied) and asserted only that a heading
 * rendered — while every number on the page was a hand-typed literal. It ran
 * green for the entire life of the fabrication.
 *
 * Here `InsuranceEngine` and `insuranceDashboardData` run for real against a
 * known-answer ledger seeded into `glStore`. Only presentational leaves
 * (recharts, lucide) are stubbed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ data }: { data?: unknown[] }) => (
    <div data-testid="area-chart">{data?.length ?? 0} points</div>
  ),
  Area: () => <div />,
  BarChart: ({ data }: { data?: unknown[] }) => (
    <div data-testid="bar-chart">{data?.length ?? 0} bars</div>
  ),
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: ({ data }: { data: number[] }) => <div data-testid="sparkline">{data.join(',')}</div>,
}));

import InsuranceDashboardPage from '@/pages/insurance/InsuranceDashboardPage';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

function entry(
  accountCode: string,
  debit: number,
  credit: number,
  period: string,
  accountName = 'Account'
): GLEntry {
  return {
    id: `${accountCode}-${period}-${String(debit)}-${String(credit)}`,
    accountId: accountCode,
    accountCode,
    accountName,
    period,
    periodName: period,
    debit,
    credit,
    netChange: debit - credit,
    date: `${period}-15`,
    amount: debit - credit,
    description: accountName,
    reference: 'TEST',
  };
}

/** Same ledger as `insuranceDashboardData.test.ts`: combined 65.00%, loss 50.00%. */
function ledger(): GLEntry[] {
  const out: GLEntry[] = [];
  for (const [period, loss] of [
    ['2026-01', 300000],
    ['2026-02', 500000],
  ] as const) {
    out.push(entry('4101', 0, 600000, period, 'Auto written premium'));
    out.push(entry('4104', 0, 400000, period, 'Commercial written premium'));
    out.push(entry('4201', 0, 500000, period, 'Auto earned premium'));
    out.push(entry('4204', 0, 300000, period, 'Commercial earned premium'));
    out.push(entry('4301', 150000, 0, period, 'Reinsurance ceded'));
    out.push(entry('5100', loss, 0, period, 'Loss and LAE'));
    out.push(entry('5200', 100000, 0, period, 'Commission expense'));
    out.push(entry('5300', 50000, 0, period, 'Underwriting expense'));
  }
  return out;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/insurance/dashboard']}>
      <InsuranceDashboardPage />
    </MemoryRouter>
  );
}

describe('InsuranceDashboardPage — empty ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders an honest empty state, not a demo dashboard', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Insurance Dashboard');
    expect(screen.getByText(/No underwriting activity is posted/i)).toBeInTheDocument();
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('shows none of the figures the fabricated page shipped', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    for (const literal of ['84.7', '$51.7M', '58.9', '142,800', '$12.4M', 'Improving']) {
      expect(text).not.toContain(literal);
    }
  });

  it('a non-insurance ledger is still an empty state', () => {
    useGLStore.setState({ entries: [entry('6000', 5000, 0, '2026-01', 'Rent')] });
    renderPage();
    expect(screen.getByText(/No underwriting activity is posted/i)).toBeInTheDocument();
  });
});

describe('InsuranceDashboardPage — derived from a posted ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: ledger() });
  });

  it('renders the engine-derived combined and loss ratios', () => {
    renderPage();
    // 800,000 loss / 1,600,000 earned = 50.00% · 300,000 expense / 2,000,000 written = 15.00%
    expect(
      within(screen.getByRole('region', { name: 'Combined Ratio' })).getByText('65.00%')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Loss Ratio' })).getByText('50.00%')
    ).toBeInTheDocument();
  });

  it('renders gross and net written premium from postings, not a 0.85 factor', () => {
    renderPage();
    expect(
      within(screen.getByRole('region', { name: 'Gross Written Premium' })).getByText('$2,000,000')
    ).toBeInTheDocument();
    // 2,000,000 gross − 300,000 posted cessions. 0.85 × gross would be 1,700,000
    // as well, so the no-cession case below is what pins the difference.
    expect(
      within(screen.getByRole('region', { name: 'Net Written Premium' })).getByText('$1,700,000')
    ).toBeInTheDocument();
  });

  it('net written premium is a dash, with a reason, when no cession is posted', () => {
    useGLStore.setState({ entries: ledger().filter((e) => !e.accountCode.startsWith('43')) });
    renderPage();
    const tile = screen.getByRole('region', { name: 'Net Written Premium' });
    expect(within(tile).getByText('—')).toBeInTheDocument();
    expect(within(tile).getByText(/Requires posted reinsurance cessions/i)).toBeInTheDocument();
  });

  it('quotes the prior period rather than an invented delta', () => {
    renderPage();
    expect(
      within(screen.getByRole('region', { name: 'Combined Ratio' })).getByText(
        /Prior period 2026-01: 52\.50%/
      )
    ).toBeInTheDocument();
  });

  it('plots one trend point per posting period and one bar row per line', () => {
    renderPage();
    expect(screen.getByTestId('area-chart').textContent).toBe('2 points');
    expect(screen.getByTestId('bar-chart').textContent).toBe('2 bars');
  });

  it('sparklines carry the derived series, not a decorative shape', () => {
    renderPage();
    expect(
      within(screen.getByRole('region', { name: 'Combined Ratio' })).getByTestId('sparkline')
        .textContent
    ).toBe('52.5,77.5');
    expect(
      within(screen.getByRole('region', { name: 'Loss Ratio' })).getByTestId('sparkline')
        .textContent
    ).toBe('37.5,62.5');
  });

  it('lists only the lines the ledger carries, with premium and the difference', () => {
    renderPage();
    const table = screen.getByRole('grid', { name: /Underwriting results/i });
    const body = within(table).getAllByRole('row').slice(1);
    expect(body).toHaveLength(2);
    expect(within(body[0]!).getByText('Auto')).toBeInTheDocument();
    expect(within(body[0]!).getByText('$1,200,000')).toBeInTheDocument();
    expect(within(body[0]!).getByText('$1,000,000')).toBeInTheDocument();
    expect(within(body[1]!).getByText('Commercial')).toBeInTheDocument();
    // No line carries a loss ratio, a combined ratio or a trend word.
    for (const word of ['Improving', 'Stable', 'Worsening']) {
      expect(within(table).queryByText(word)).not.toBeInTheDocument();
    }
  });

  it('discloses policy count and per-line ratios as not derivable', () => {
    renderPage();
    const note = screen.getByRole('heading', {
      name: /Not derivable from this ledger/i,
    }).parentElement;
    expect(note?.textContent).toMatch(/Policy count/);
    expect(note?.textContent).toMatch(/per line of business/);
    // And no policy-count tile pretending otherwise.
    expect(screen.queryByRole('region', { name: 'Policy Count' })).not.toBeInTheDocument();
  });

  it('exports the derived figures, marking the ones that are absent', async () => {
    const spy = vi.spyOn(ExportEngine, 'exportToExcel').mockResolvedValue(undefined as never);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Export Report/i }));
    expect(spy).toHaveBeenCalledTimes(1);
    const rows = (spy.mock.calls[0]![0] as { rows: (string | number)[][] }).rows;
    expect(rows).toContainEqual(['Gross written premium', 2000000]);
    expect(rows).toContainEqual(['Combined ratio %', 65]);
    expect(rows).toContainEqual(['Policy count', 'not derivable from a general ledger']);
  });
});
