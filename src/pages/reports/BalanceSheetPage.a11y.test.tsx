// =============================================================================
// BalanceSheetPage — axe-core a11y regression (populated content state)
// -----------------------------------------------------------------------------
// Real glStore seeded via merge-setState so the CONTENT branch (the statement
// table + balance status) renders. Bar: 0 critical, 0 serious (UI-07);
// moderate findings are tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';
import BalanceSheetPage from './BalanceSheetPage';

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

/**
 * Small balanced ledger: assets 11xx cash 65k · liabilities 21xx AP 9.5k;
 * equity arrives as posted capital (3xxx retained) so Assets = L + E holds.
 */
function balancedLedger(): GLEntry[] {
  return [
    makeEntry({ id: 'cash', accountId: 'acct-cash', accountCode: '1100', debit: 65000 }),
    makeEntry({ id: 'ap', accountId: 'acct-ap', accountCode: '2100', credit: 9500 }),
    makeEntry({ id: 'rev', accountId: 'acct-rev', accountCode: '4000', credit: 100000 }),
    makeEntry({ id: 'cogs', accountId: 'acct-cogs', accountCode: '5000', debit: 48000 }),
    makeEntry({ id: 'opex', accountId: 'acct-opex', accountCode: '6000', debit: 22000 }),
    makeEntry({ id: 'cap', accountId: 'acct-cap', accountCode: '3000', credit: 114500 }),
  ];
}

describe('BalanceSheetPage a11y (axe-core, populated)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], trialBalance: [], importError: null });
  });

  it('renders no critical or serious violations with a posted ledger', async () => {
    useGLStore.setState({ entries: balancedLedger() });
    const { container } = render(<BalanceSheetPage />);

    // Content branch is really on: the statement grid mounted.
    expect(screen.getByRole('grid', { name: 'Balance Sheet Report data' })).toBeInTheDocument();
    expectRenderedRealContent(container, 30);
    expectNoCriticalOrSerious(await axe(container));
  });
});
