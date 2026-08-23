// =============================================================================
// CashFlowPage — axe-core a11y regression (populated content state)
// -----------------------------------------------------------------------------
// Real glStore seeded via merge-setState across two periods so the CONTENT
// branch (statement grid + prior-data banner) renders. Bar: 0 critical,
// 0 serious (UI-07); moderate findings are tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';
import CashFlowPage from './CashFlowPage';

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(blocking).toEqual([]);
};

/** Guards against a silent fallback to the empty/skeleton state. */
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
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-02',
    periodName: 'February 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-02-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

/** Two posted periods with cash, AR, AP and PP&E movement plus P&L activity. */
function twoPeriodLedger(): GLEntry[] {
  return [
    makeEntry({ id: 'cash1', accountId: 'acct-cash', accountCode: '1100', debit: 50000, period: '2026-01', date: '2026-01-15' }),
    makeEntry({ id: 'cash2', accountId: 'acct-cash', accountCode: '1100', debit: 65000 }),
    makeEntry({ id: 'ar1', accountId: 'acct-ar', accountCode: '1200', debit: 20000, period: '2026-01', date: '2026-01-15' }),
    makeEntry({ id: 'ar2', accountId: 'acct-ar', accountCode: '1200', debit: 18000 }),
    makeEntry({ id: 'ppe2', accountId: 'acct-ppe', accountCode: '1500', debit: 30000 }),
    makeEntry({ id: 'ap1', accountId: 'acct-ap', accountCode: '2100', credit: 8000, period: '2026-01', date: '2026-01-15' }),
    makeEntry({ id: 'ap2', accountId: 'acct-ap', accountCode: '2100', credit: 9500 }),
    makeEntry({ id: 'rev1', accountId: 'acct-rev', accountCode: '4000', credit: 90000, period: '2026-01', date: '2026-01-15' }),
    makeEntry({ id: 'rev2', accountId: 'acct-rev', accountCode: '4000', credit: 100000 }),
    makeEntry({ id: 'cogs2', accountId: 'acct-cogs', accountCode: '5000', debit: 48000 }),
    makeEntry({ id: 'dep2', accountId: 'acct-dep', accountCode: '6000', debit: 2000, description: 'Depreciation expense' }),
    makeEntry({ id: 'opex2', accountId: 'acct-opex', accountCode: '6000', debit: 22000 }),
  ];
}

describe('CashFlowPage a11y (axe-core, populated)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], trialBalance: [], importError: null });
  });

  it('renders no critical or serious violations with a two-period ledger', async () => {
    useGLStore.setState({ entries: twoPeriodLedger() });
    const { container } = render(<CashFlowPage />);

    // Content branch is really on: the statement grid mounted.
    expect(screen.getByRole('grid', { name: 'Cash Flow Statement data' })).toBeInTheDocument();
    expectRenderedRealContent(container, 40);
    expectNoCriticalOrSerious(await axe(container));
  });
});
