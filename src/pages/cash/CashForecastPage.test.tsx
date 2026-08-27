// =============================================================================
// CashForecastPage tests — K30 four-states
// -----------------------------------------------------------------------------
// The GL store is REAL (state seeded directly, no store-module mock): every
// figure on screen is derived synchronously by @/pages/cash/cashForecastModel
// from the posted entries. Only icons (shared lucide double, N-0001), charts
// and the export engine boundary are stubbed.
//
// Honesty rule (K30): the derivation is synchronous, so there is deliberately
// NO hydrate/loading skeleton — this suite asserts none appears. The empty
// state renders the shared EmptyState under the page-level h1 with an import
// CTA; no zeroed cash statement is invented without postings.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@/test/testUtils';
import CashForecastPage from '@/pages/cash/CashForecastPage';
import { useGLStore } from '@/store/glStore';

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('@/components/charts/SparklineChart', () => ({
  SparklineChart: ({ data }: { data: number[] }) => (
    <div data-testid="balance-sparkline">{JSON.stringify(data)}</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

/**
 * Seeded ledger (same hand computation as CashForecastPage.money.test.tsx):
 * receipts 105,000 · disbursements 100,000 · posted balance 5,000 across two
 * posted periods, cash accounts 1000 and 1100.
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

describe('CashForecastPage — K30 four-states (real GL store)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders the content state from posted cash activity under the page h1', () => {
    useGLStore.setState({ entries: LEDGER as never });
    render(<CashForecastPage />);
    expect(screen.getByRole('heading', { name: /cash position/i, level: 1 })).toBeInTheDocument();
    // Derived figures from the real model, not invented ones.
    expect(screen.getByText('$105,000')).toBeInTheDocument(); // receipts
    // Posted balance and the Unclassified counter-account row legitimately
    // share this figure (entry 8 carries no journal reference).
    expect(screen.getAllByText('$5,000').length).toBeGreaterThan(0);
  });

  it('K30: empty ledger renders the shared EmptyState under the page h1 with an import CTA', () => {
    const { container } = render(<CashForecastPage />);
    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(screen.getByRole('heading', { name: /cash position/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /no cash activity/i })).toBeInTheDocument();
    expect(screen.getByTestId('cash-empty-import')).toBeInTheDocument();
    // No zeroed cash statement is fabricated without postings.
    expect(container.textContent ?? '').not.toMatch(/\$\d/);
  });

  it('empty-states on a ledger with no cash-account postings, not just an empty one', () => {
    useGLStore.setState({
      entries: [
        { id: 'x', accountCode: '4000', debit: 0, credit: 900, period: '2026-01' },
      ] as never,
    });
    render(<CashForecastPage />);
    expect(screen.getByText('No Cash Activity')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /posted cash flow by period/i })
    ).not.toBeInTheDocument();
  });

  it('K30 honesty: no hydrate skeleton or busy region exists in any state (synchronous derivation)', () => {
    const { container } = render(<CashForecastPage />);
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('[data-testid*="skeleton"]')).toBeNull();

    useGLStore.setState({ entries: LEDGER as never });
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('[data-testid*="skeleton"]')).toBeNull();
  });

  it('declares what the general ledger cannot provide instead of inventing it', () => {
    useGLStore.setState({ entries: LEDGER as never });
    render(<CashForecastPage />);
    expect(
      screen.getByRole('heading', { name: /not derivable from the general ledger/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/forward 13-week cash forecast/i)).toBeInTheDocument();
  });
});
