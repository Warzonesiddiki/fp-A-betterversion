// =============================================================================
// StoreDashboardPage — axe-core a11y regression (posted-ledger content state)
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): glStore entries tagged with entityIds
// drive the per-store branch so the CONTENT state renders — KPI grid, the
// revenue-by-store chart region and the engine-derived P&L grid. Bar:
// 0 critical, 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

import StoreDashboardPage from './StoreDashboardPage';

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(blocking).toEqual([]);
};

/** Guards against a silent fallback to the empty state. */
const expectRenderedRealContent = (container: HTMLElement, minElements: number) => {
  const elementCount = container.querySelectorAll('*').length;
  expect(
    elementCount,
    `expected populated content (>= ${minElements} elements) but rendered ${elementCount}`
  ).toBeGreaterThanOrEqual(minElements);
};

function makeEntry(overrides: Partial<GLEntry> & { id: string }): GLEntry {
  return {
    accountId: 'acct-1',
    accountCode: '4001',
    accountName: 'Store Sales',
    period: '2026-08',
    periodName: 'August 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-08-15',
    amount: 0,
    description: '',
    reference: '',
    entityId: 'S-01',
    ...overrides,
  };
}

/**
 * Two entity-tagged stores with full P&L postings. Amounts are signed
 * debit-normal (revenue and cost post positive), matching both the page's
 * signed totals and RetailEngine's per-store grouping.
 */
function storeLedger(): GLEntry[] {
  return [
    makeEntry({
      id: 'gl-1',
      accountCode: '4001',
      debit: 500000,
      amount: 500000,
      netChange: 500000,
    }),
    makeEntry({
      id: 'gl-2',
      accountId: 'acct-cogs',
      accountCode: '5001',
      accountName: 'COGS',
      debit: 200000,
      amount: 200000,
      netChange: 200000,
    }),
    makeEntry({
      id: 'gl-3',
      accountId: 'acct-labor',
      accountCode: '5101',
      accountName: 'Labor',
      debit: 100000,
      amount: 100000,
      netChange: 100000,
    }),
    makeEntry({ id: 'gl-4', accountCode: '4001', entityId: 'S-02', debit: 300000, amount: 300000 }),
    makeEntry({
      id: 'gl-5',
      accountId: 'acct-cogs',
      accountCode: '5001',
      accountName: 'COGS',
      entityId: 'S-02',
      debit: 120000,
      amount: 120000,
    }),
  ];
}

describe('StoreDashboardPage a11y (axe-core, posted ledger)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('renders no critical or serious violations with store-tagged postings', async () => {
    useGLStore.setState({ entries: storeLedger() });
    const { container } = render(<StoreDashboardPage />);

    // Content branch is really on: page h1, the KPI grid, both tagged stores
    // in the P&L grid, and the POS-feeds disclosure card.
    expect(screen.getByRole('heading', { name: /store dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('store-dashboard-kpis')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: /store p&l data table for retail dashboard/i }));
    expect(screen.getByText(/require POS transaction history/i)).toBeInTheDocument();
    expectRenderedRealContent(container, 80);
    expectNoCriticalOrSerious(await axe(container));
  });
});
