// =============================================================================
// ProfitLossPage — axe-core a11y regression (populated content state)
// -----------------------------------------------------------------------------
// Real glStore seeded via merge-setState so the CONTENT branch (the statement
// table) renders — an axe pass over a near-empty container proves nothing
// (measured rationale in src/__tests__/a11y/wcag-aa-populated.test.tsx).
// Bar: 0 critical, 0 serious (UI-07); moderate findings are tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';
import ProfitLossPage from './ProfitLossPage';

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

/** Posted actuals across two periods: revenue 190k · COGS 93k · OpEx 42k. */
function postedEntries(): GLEntry[] {
  return [
    makeEntry({ id: 'r1', accountId: 'acct-r', accountCode: '4000', credit: 90000, period: '2026-01', date: '2026-01-15' }),
    makeEntry({ id: 'r2', accountId: 'acct-r', accountCode: '4000', credit: 100000 }),
    makeEntry({ id: 'c1', accountId: 'acct-c', accountCode: '5000', debit: 45000, period: '2026-01', date: '2026-01-15' }),
    makeEntry({ id: 'c2', accountId: 'acct-c', accountCode: '5000', debit: 48000 }),
    makeEntry({ id: 'o1', accountId: 'acct-o', accountCode: '6000', debit: 20000, period: '2026-01', date: '2026-01-15' }),
    makeEntry({ id: 'o2', accountId: 'acct-o', accountCode: '6000', debit: 22000 }),
  ];
}

describe('ProfitLossPage a11y (axe-core, populated)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], trialBalance: [], importError: null });
  });

  it('renders no critical or serious violations with posted GL data', async () => {
    useGLStore.setState({ entries: postedEntries() });
    const { container } = render(<ProfitLossPage />);

    // Content branch is really on: the statement grid mounted.
    expect(screen.getByRole('grid', { name: 'Profit and Loss Report data' })).toBeInTheDocument();
    expectRenderedRealContent(container, 30);
    expectNoCriticalOrSerious(await axe(container));
  });
});
