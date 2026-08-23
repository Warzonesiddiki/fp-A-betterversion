// =============================================================================
// ARRDashboard — axe-core a11y regression (posted-ledger content state)
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): glStore 41xx postings drive the KPI
// branch so the CONTENT state renders — KPI cards with a ledger-derived
// month-over-month delta, the not-derivable disclosure cards and the
// waterfall explanation. Bar: 0 critical, 0 serious (UI-07); moderate
// findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

import ARRDashboard from './ARRDashboard';

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
    accountCode: '4100',
    accountName: 'Subscription Revenue',
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

/** Two posted months of 41xx revenue so the derived MoM delta can render. */
function subscriptionLedger(): GLEntry[] {
  return [
    makeEntry({
      id: 'gl-jan',
      accountId: 'acct-4100',
      period: '2026-01',
      date: '2026-01-20',
      credit: 100000,
    }),
    makeEntry({
      id: 'gl-feb',
      accountId: 'acct-4100',
      period: '2026-02',
      date: '2026-02-20',
      credit: 110000,
    }),
  ];
}

describe('ARRDashboard a11y (axe-core, posted ledger)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('renders no critical or serious violations with posted subscription revenue', async () => {
    useGLStore.setState({ entries: subscriptionLedger() });
    const { container } = render(<ARRDashboard />);

    // Content branch is really on: page h1, the four-cell KPI grid (two
    // ledger-derived KPICards + two not-derivable disclosures) and the
    // waterfall explanation are mounted before the scan.
    expect(screen.getByRole('heading', { name: /arr dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('arr-kpis')).toBeInTheDocument();
    expect(screen.getByText(/Monthly Recurring Revenue/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Net Revenue Retention|Quick Ratio/i).length).toBe(2);
    expect(
      screen.getByText(/requires\s+a\s+subscription\s+\/\s+cohort\s+feed/i)
    ).toBeInTheDocument();
    expectRenderedRealContent(container, 60);
    expectNoCriticalOrSerious(await axe(container));
  });
});
