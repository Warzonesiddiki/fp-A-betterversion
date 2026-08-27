// =============================================================================
// FXRatesPage — axe-core a11y regression (entered-rates content state)
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): fxRateStore rates drive the table so
// the CONTENT branch (rate table with per-pair delete actions) renders.
// Bar: 0 critical, 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useFxRateStore } from '@/store/fxRateStore';
import { useGLStore } from '@/store/glStore';
import type { ExchangeRate, GLEntry } from '@/types';

import FXRatesPage from './FXRatesPage';

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(blocking).toEqual([]);
};

/** Guards against a silent fallback to an empty state. */
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

function makeRate(overrides: Partial<ExchangeRate> & Pick<ExchangeRate, 'id'>): ExchangeRate {
  return {
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    rate: 1,
    effectiveDate: '2026-01-01',
    source: 'manual',
    ...overrides,
  };
}

/** User-entered rates for the content state — nothing is seeded by the page. */
function enteredRates(): ExchangeRate[] {
  return [
    makeRate({ id: 'fx-1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 }),
    makeRate({ id: 'fx-2', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79 }),
  ];
}

describe('FXRatesPage a11y (axe-core, entered rates)', () => {
  beforeEach(() => {
    useFxRateStore.setState({ rates: [] });
    useGLStore.setState({ entries: [], trialBalance: [] });
  });

  it('renders no critical or serious violations with entered rates', async () => {
    // A posted ledger is required for the page to leave its import gate.
    useGLStore.setState({
      entries: [makeEntry({ id: 'gl-1', accountCode: '4000', credit: 1500 })],
    });
    useFxRateStore.setState({ rates: enteredRates() });
    const { container } = render(<FXRatesPage />);

    // Content branch is really on: header and the rate table are mounted
    // before the scan.
    expect(screen.getByRole('heading', { name: /fx rates/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /fx rates by currency pair/i })).toBeInTheDocument();
    expect(screen.getByText('2 rates configured')).toBeInTheDocument();
    expectRenderedRealContent(container, 30);
    expectNoCriticalOrSerious(await axe(container));
  });

  it('renders no critical or serious violations with a ledger but an empty rate book', async () => {
    // K30 empty-rates branch: h1 stays mounted above the shared EmptyState
    // whose CTA opens the add-rate form — assert both before the scan.
    useGLStore.setState({
      entries: [makeEntry({ id: 'gl-1', accountCode: '4000', credit: 1500 })],
    });
    useFxRateStore.setState({ rates: [] });
    const { container } = render(<FXRatesPage />);

    expect(screen.getByRole('heading', { name: /fx rates/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no exchange rates configured/i)).toBeInTheDocument();
    expect(screen.getByTestId('fx-empty-add')).toBeInTheDocument();
    expectRenderedRealContent(container, 12);

    expectNoCriticalOrSerious(await axe(container));
  });

  it('renders no critical or serious violations in the no-ledger translate gate', async () => {
    // K30 no-data branch: h1 mounted above EmptyState with the import CTA.
    useGLStore.setState({ entries: [] });
    useFxRateStore.setState({ rates: [] });
    const { container } = render(<FXRatesPage />);

    expect(screen.getByRole('heading', { name: /fx rates/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no data to translate/i)).toBeInTheDocument();
    expect(screen.getByTestId('fx-empty-import')).toBeInTheDocument();
    expectRenderedRealContent(container, 12);

    expectNoCriticalOrSerious(await axe(container));
  });
});
