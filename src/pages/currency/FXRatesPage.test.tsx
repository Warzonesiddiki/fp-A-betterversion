// =============================================================================
// FXRatesPage tests — K30 four-states
// -----------------------------------------------------------------------------
// Real stores (no store-module mocks): fxRateStore drives the rate table and
// glStore drives the translate gate. lucide-react is already mocked globally
// in src/test/setup.ts. There is deliberately NO loading-skeleton spec: both
// stores are synchronous Zustand reads, so the page invents no asynchrony.
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@/test/testUtils';
import FXRatesPage from '@/pages/currency/FXRatesPage';
import { actAs, signOut } from '@/test/rbacFixtures';
import { useFxRateStore } from '@/store/fxRateStore';
import { useGLStore } from '@/store/glStore';
import type { ExchangeRate, GLEntry } from '@/types';

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
const enteredRates = (): ExchangeRate[] => [
  makeRate({ id: 'fx-1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 }),
  makeRate({ id: 'fx-2', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79 }),
];

function postedLedger(): GLEntry[] {
  return [
    makeEntry({ id: 'gl-1', accountCode: '4000', credit: 1500, description: 'Invoice 42' }),
    makeEntry({ id: 'gl-2', accountCode: '1000', debit: 1500, description: 'Receipt 42' }),
  ];
}

function resetStores() {
  useFxRateStore.setState({ rates: [] });
  useGLStore.setState({ entries: [], trialBalance: [] });
  signOut();
}

beforeEach(() => {
  resetStores();
});

describe('FXRatesPage', () => {
  it('renders the rate table from real fxRateStore entries (content state)', () => {
    useGLStore.setState({ entries: postedLedger() });
    useFxRateStore.setState({ rates: enteredRates() });
    render(<FXRatesPage />);
    expect(screen.getByRole('heading', { name: /fx rates/i, level: 1 })).toBeInTheDocument();
    // Purpose line counts only user-entered store rows.
    expect(screen.getByText('2 rates configured')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /fx rates by currency pair/i })).toBeInTheDocument();
    expect(screen.getByText('0.9200')).toBeInTheDocument();
    expect(screen.getByText('0.7900')).toBeInTheDocument();
  });

  it('K30: with no ledger data the shared EmptyState renders under the page h1 with an import CTA', () => {
    useGLStore.setState({ entries: [] });
    render(<FXRatesPage />);
    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(screen.getByRole('heading', { name: /fx rates/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no data to translate/i)).toBeInTheDocument();
    expect(screen.getByTestId('fx-empty-import')).toBeInTheDocument();
  });

  it('K30: with a ledger but an empty rate book, EmptyState offers Add Rate (no invented quotes)', () => {
    useGLStore.setState({ entries: postedLedger() });
    useFxRateStore.setState({ rates: [] });
    render(<FXRatesPage />);
    expect(screen.getByRole('heading', { name: /fx rates/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no exchange rates configured/i)).toBeInTheDocument();
    // Anti-fabrication: none of the previously hardcoded INITIAL_RATES values
    // may appear when the real store is empty.
    expect(screen.queryByText('0.9200')).not.toBeInTheDocument();
    expect(screen.queryByText('0.7900')).not.toBeInTheDocument();
    expect(screen.queryByText('149.5000')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('fx-empty-add'));
    expect(screen.getByText(/add exchange rate/i)).toBeInTheDocument();
  });

  it('adds a rate through the REAL fxRateStore action and closes the form', () => {
    actAs('Admin');
    useGLStore.setState({ entries: postedLedger() });
    useFxRateStore.setState({ rates: enteredRates() });
    render(<FXRatesPage />);
    fireEvent.click(screen.getByTestId('fx-add-rate'));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('From Currency'), {
      target: { value: 'USD' },
    });
    fireEvent.change(within(dialog).getByLabelText('To Currency'), {
      target: { value: 'JPY' },
    });
    fireEvent.change(within(dialog).getByLabelText('Rate'), { target: { value: '149.5' } });
    fireEvent.change(within(dialog).getByLabelText('Effective Date'), {
      target: { value: '2026-02-01' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Rate' }));
    const rates = useFxRateStore.getState().rates;
    expect(rates).toHaveLength(3);
    expect(rates[2]).toMatchObject({
      fromCurrency: 'USD',
      toCurrency: 'JPY',
      rate: 149.5,
      effectiveDate: '2026-02-01',
      source: 'manual',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('K30: a permission-denied add renders ErrorState (role=alert) whose retry succeeds', async () => {
    actAs('Viewer'); // read-only role: forecast:create is withheld upstream
    useGLStore.setState({ entries: postedLedger() });
    render(<FXRatesPage />);
    fireEvent.click(screen.getByTestId('fx-add-rate'));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Rate'), { target: { value: '1.25' } });
    fireEvent.change(within(dialog).getByLabelText('Effective Date'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Rate' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not add exchange rate/i);
    expect(alert).toHaveTextContent(/forecast:create/);
    expect(useFxRateStore.getState().rates).toHaveLength(0);

    // Retry runs the exact failed action once the role allows it.
    actAs('Admin');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /retry add/i }));
    await waitFor(() => {
      expect(useFxRateStore.getState().rates).toHaveLength(1);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes a rate through the REAL fxRateStore action after confirmation', async () => {
    actAs('Admin');
    useGLStore.setState({ entries: postedLedger() });
    useFxRateStore.setState({ rates: enteredRates() });
    render(<FXRatesPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete usd\/eur rate/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/delete rate/i);
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(useFxRateStore.getState().rates).toHaveLength(1);
    });
    expect(useFxRateStore.getState().rates[0]?.toCurrency).toBe('GBP');
    expect(screen.queryByText('0.9200')).not.toBeInTheDocument();
  });
});
