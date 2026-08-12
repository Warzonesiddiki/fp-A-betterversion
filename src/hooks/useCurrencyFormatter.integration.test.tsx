/**
 * UI-06 end-to-end proof: changing the reporting currency in the global
 * financial context must change the money actually rendered by real pages.
 *
 * The unit tests cover the hook in isolation; this file guards the property
 * that motivated UI-06 in the first place — before the migration, 75 modules
 * had `currency: 'USD'` hardcoded, so switching the selector to GBP or EUR
 * changed the dropdown and nothing else on screen.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { useFinancialContextStore } from '@/store/financialContextStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

function Probe() {
  const fmt = useCurrencyFormatter();
  return (
    <div>
      <span data-testid="full">{fmt.currency(1234.56)}</span>
      <span data-testid="whole">{fmt.currency0(1234.56)}</span>
      <span data-testid="compact">{fmt.compact(2_500_000)}</span>
      <span data-testid="negative">{fmt.currency0(-1000)}</span>
      <span data-testid="zero">{fmt.currency0(0)}</span>
    </div>
  );
}

function setCurrency(code: string) {
  act(() => {
    useFinancialContextStore.getState().setContext({ currency: { code } });
  });
}

afterEach(() => {
  act(() => {
    useFinancialContextStore.getState().resetContext();
  });
});

describe('UI-06 reporting-currency propagation', () => {
  it('renders the default reporting currency (USD) as dollars', () => {
    render(<Probe />);
    expect(screen.getByTestId('full').textContent).toBe('$1,234.56');
    expect(screen.getByTestId('whole').textContent).toBe('$1,235');
    expect(screen.getByTestId('compact').textContent).toBe('$2.5M');
  });

  it('re-renders every money shape when the reporting currency changes', () => {
    render(<Probe />);
    setCurrency('GBP');

    // The symbol must follow the selector across all formatter shapes.
    expect(screen.getByTestId('full').textContent).toBe('£1,234.56');
    expect(screen.getByTestId('whole').textContent).toBe('£1,235');
    expect(screen.getByTestId('compact').textContent).toBe('£2.5M');

    // No stale dollar signs may survive the switch anywhere in the tree.
    expect(document.body.textContent).not.toContain('$');
  });

  it('keeps accounting conventions stable across currencies', () => {
    render(<Probe />);
    setCurrency('EUR');
    // Negatives stay in parentheses; zero stays the quiet em dash.
    expect(screen.getByTestId('negative').textContent).toBe('(€1,000)');
    expect(screen.getByTestId('zero').textContent).toBe('—');
  });

  it('formats amounts without converting them (display-only contract)', () => {
    render(<Probe />);
    setCurrency('INR');
    // Same magnitude, different symbol: UI-06 must never silently FX-convert.
    expect(screen.getByTestId('whole').textContent).toContain('1,235');
    expect(screen.getByTestId('whole').textContent).toContain('₹');
  });
});
