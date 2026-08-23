// =============================================================================
// GLJournalsPage — axe-core a11y regression (posted-ledger content state)
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): glStore entries drive the journal
// table so the CONTENT branch (filters card, entries table, money totals)
// renders. Bar: 0 critical, 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

import GLJournalsPage from './GLJournalsPage';

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
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-08',
    periodName: 'August 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-08-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

/** Balanced posted actuals: debits 2,500 = credits 2,500 across two accounts. */
function balancedLedger(): GLEntry[] {
  return [
    makeEntry({
      id: 'gl-1',
      accountId: 'acct-cash',
      accountCode: '1000',
      accountName: 'Cash',
      debit: 1500,
      description: 'Receipt 42',
      reference: 'R-42',
    }),
    makeEntry({
      id: 'gl-2',
      accountId: 'acct-rev',
      accountCode: '4000',
      accountName: 'Revenue',
      credit: 1500,
      description: 'Invoice 42',
      reference: 'I-42',
    }),
    makeEntry({
      id: 'gl-3',
      accountId: 'acct-bank',
      accountCode: '1010',
      accountName: 'Bank',
      debit: 1000,
      description: 'Transfer 7',
      reference: 'T-7',
    }),
  ];
}

describe('GLJournalsPage a11y (axe-core, posted ledger)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], trialBalance: [] });
  });

  it('renders no critical or serious violations with a posted ledger', async () => {
    useGLStore.setState({ entries: balancedLedger() });
    const { container } = render(<GLJournalsPage />);

    // Content branch is really on: header, filter controls and the entries
    // table are mounted before the scan.
    expect(screen.getByRole('heading', { name: /general journal/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /gl journal entries/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expectRenderedRealContent(container, 60);
    expectNoCriticalOrSerious(await axe(container));
  });

  it('renders no critical or serious violations in the honest-empty state', async () => {
    // K30 empty branch: PageHeader h1 stays mounted above the shared
    // EmptyState with its import CTA — assert both before the scan.
    useGLStore.setState({ entries: [] });
    const { container } = render(<GLJournalsPage />);

    expect(screen.getByRole('heading', { name: /general journal/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no journal entries/i)).toBeInTheDocument();
    expect(screen.getByTestId('journals-empty-import')).toBeInTheDocument();
    expectRenderedRealContent(container, 12);

    expectNoCriticalOrSerious(await axe(container));
  });
});
