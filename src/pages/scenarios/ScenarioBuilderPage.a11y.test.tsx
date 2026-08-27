// =============================================================================
// ScenarioBuilderPage — axe-core a11y regression (posted-base content state)
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): glStore entries drive the posted base
// so the CONTENT branch (KPIs, Monte Carlo card, assumption sliders) renders.
// Only the Monte-Carlo worker boundary is mocked, exactly like the sibling
// suite. Bar: 0 critical, 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useScenarioStore } from '@/store/scenarioStore';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

vi.mock('@/workers', () => ({
  runMonteCarlo: vi.fn(),
}));

import ScenarioBuilderPage from './ScenarioBuilderPage';

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
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

/** Posted actuals: revenue 100,000 · COGS 40,000 · OpEx 30,000 (real base). */
function postedBaseEntries(): GLEntry[] {
  return [
    makeEntry({ id: 'r1', accountId: 'acct-r', accountCode: '4000', credit: 100000 }),
    makeEntry({ id: 'c1', accountId: 'acct-c', accountCode: '5000', debit: 40000 }),
    makeEntry({ id: 'o1', accountId: 'acct-o', accountCode: '6000', debit: 30000 }),
  ];
}

describe('ScenarioBuilderPage a11y (axe-core, posted base)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], trialBalance: [] });
    useScenarioStore.setState({ scenarios: [], isLoading: false, error: null });
  });

  it('renders no critical or serious violations with a posted GL base', async () => {
    useGLStore.setState({ entries: postedBaseEntries() });
    const { container } = render(<ScenarioBuilderPage />);

    // Content branch is really on: KPIs and the builder cards mounted.
    expect(screen.getByTestId('scenario-kpis')).toBeInTheDocument();
    expect(screen.getByTestId('monte-carlo-card')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /scenario builder/i, level: 1 })
    ).toBeInTheDocument();
    expectRenderedRealContent(container, 50);
    expectNoCriticalOrSerious(await axe(container));
  });
});
