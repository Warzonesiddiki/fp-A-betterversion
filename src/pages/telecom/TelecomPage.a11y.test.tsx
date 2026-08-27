// =============================================================================
// TelecomPage — axe-core a11y regression (posted-ledger content state)
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): glStore entries drive the KPI grid and
// the account-breakdown grid so the CONTENT branch renders. Bar: 0 critical,
// 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

import TelecomPage from './TelecomPage';

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
    accountName: 'Carrier Revenue',
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

function telecomLedger(): GLEntry[] {
  return [
    makeEntry({
      id: 'gl-1',
      accountId: 'acct-4001',
      accountCode: '4001',
      credit: 250000,
      netChange: -250000,
    }),
    makeEntry({
      id: 'gl-2',
      accountId: 'acct-4002',
      accountCode: '4002',
      accountName: 'Data Plans',
      credit: 180000,
      netChange: -180000,
    }),
    makeEntry({
      id: 'gl-3',
      accountId: 'acct-5001',
      accountCode: '5001',
      accountName: 'Network Costs',
      debit: 90000,
      amount: 90000,
      netChange: 90000,
    }),
  ];
}

describe('TelecomPage a11y (axe-core, posted ledger)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('renders no critical or serious violations with a posted ledger', async () => {
    useGLStore.setState({ entries: telecomLedger() });
    const { container } = render(<TelecomPage />);

    // Content branch is really on: page h1, the four-KPI section and the
    // account-breakdown grid are mounted before the scan.
    expect(screen.getByRole('heading', { name: /^telecom$/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText('Telecom KPIs')).toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: /account breakdown data table for telecom sector/i })
    ).toBeInTheDocument();
    expectRenderedRealContent(container, 60);
    expectNoCriticalOrSerious(await axe(container));
  });
});
