/**
 * UI-06 contract: money display follows the reporting-currency selector.
 *
 * The regression these tests exist to prevent: a GBP entity rendering as
 * dollars because a component hardcoded `currency: 'USD'`.
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useCurrencyFormatter, useReportingCurrency } from './useCurrencyFormatter';
import { useFinancialContextStore } from '@/store/financialContextStore';

function setCurrency(code: string): void {
  act(() => {
    useFinancialContextStore.getState().setContext({ currency: { code } });
  });
}

afterEach(() => {
  act(() => {
    useFinancialContextStore.getState().resetContext();
  });
});

function Probe(): JSX.Element {
  const fmt = useCurrencyFormatter();
  return (
    <div>
      <span data-testid="code">{fmt.currencyCode}</span>
      <span data-testid="currency">{fmt.currency(1234.56)}</span>
      <span data-testid="currency0">{fmt.currency0(1234.56)}</span>
      <span data-testid="compact">{fmt.compact(2_500_000)}</span>
      <span data-testid="negative">{fmt.currency0(-500)}</span>
      <span data-testid="null">{fmt.currency(null)}</span>
    </div>
  );
}

describe('useCurrencyFormatter', () => {
  it('defaults to the context default currency (USD)', () => {
    render(<Probe />);
    expect(screen.getByTestId('code')).toHaveTextContent('USD');
    expect(screen.getByTestId('currency').textContent).toContain('$');
  });

  it('re-renders in the selected currency when the context changes', () => {
    render(<Probe />);
    expect(screen.getByTestId('currency').textContent).toContain('$');

    setCurrency('GBP');

    expect(screen.getByTestId('code')).toHaveTextContent('GBP');
    // The bug this guards: amounts kept rendering as USD after switching.
    expect(screen.getByTestId('currency').textContent).toContain('£');
    expect(screen.getByTestId('currency').textContent).not.toContain('$');
  });

  it('applies the reporting currency to every formatter, not just one', () => {
    render(<Probe />);
    setCurrency('EUR');

    expect(screen.getByTestId('currency').textContent).toContain('€');
    expect(screen.getByTestId('currency0').textContent).toContain('€');
    // formatCompact previously hardcoded '$' even when given a currency.
    expect(screen.getByTestId('compact').textContent).toContain('€');
    expect(screen.getByTestId('compact').textContent).not.toContain('$');
  });

  it('renders whole-unit currency without decimals', () => {
    render(<Probe />);
    expect(screen.getByTestId('currency0').textContent).not.toContain('.56');
  });

  it('renders negatives in parentheses, the accounting convention', () => {
    render(<Probe />);
    expect(screen.getByTestId('negative').textContent).toMatch(/^\(.*\)$/);
  });

  it('renders null as an em dash rather than $0 or NaN', () => {
    render(<Probe />);
    expect(screen.getByTestId('null')).toHaveTextContent('—');
  });

  it('exposes the raw reporting currency code', () => {
    function CodeOnly(): JSX.Element {
      return <span data-testid="raw">{useReportingCurrency()}</span>;
    }
    render(<CodeOnly />);
    expect(screen.getByTestId('raw')).toHaveTextContent('USD');

    setCurrency('INR');
    expect(screen.getByTestId('raw')).toHaveTextContent('INR');
  });

  it('keeps formatter identity stable while the currency is unchanged', () => {
    const seen: unknown[] = [];
    function Identity(): JSX.Element {
      seen.push(useCurrencyFormatter());
      return <span />;
    }
    const { rerender } = render(<Identity />);
    rerender(<Identity />);
    expect(seen[0]).toBe(seen[1]);
  });

  /**
   * `custom()` covers the option shapes the named members do not: sign display,
   * asymmetric digits and compact-with-precision. It exists so the ~81
   * hand-rolled `new Intl.NumberFormat(...)` sites could be migrated without
   * also changing how they render zeroes and negatives.
   */
  describe('custom()', () => {
    it('follows the reporting currency like the named formatters do', () => {
      function CustomProbe(): JSX.Element {
        const fmt = useCurrencyFormatter();
        return <span data-testid="v">{fmt.custom({ decimals: 0 })(1234.56)}</span>;
      }
      render(<CustomProbe />);
      expect(screen.getByTestId('v')).toHaveTextContent('$1,235');

      setCurrency('GBP');
      expect(screen.getByTestId('v')).toHaveTextContent('£1,235');
      expect(screen.getByTestId('v').textContent).not.toContain('$');
    });

    it('preserves native Intl semantics for zero and negatives', () => {
      function Semantics(): JSX.Element {
        const format = useCurrencyFormatter().custom({ decimals: 0 });
        return (
          <div>
            <span data-testid="zero">{format(0)}</span>
            <span data-testid="neg">{format(-1234)}</span>
          </div>
        );
      }
      render(<Semantics />);
      // Deliberately NOT the em dash / parentheses treatment of currency0:
      // migrating a call site must not change its rendering, only its currency.
      expect(screen.getByTestId('zero')).toHaveTextContent('$0');
      expect(screen.getByTestId('neg')).toHaveTextContent('-$1,234');
    });

    it('honours signDisplay and compact notation', () => {
      function Shapes(): JSX.Element {
        const fmt = useCurrencyFormatter();
        return (
          <div>
            <span data-testid="sign">
              {fmt.custom({ signDisplay: 'always', maxDecimals: 0 })(1234)}
            </span>
            <span data-testid="compact">
              {fmt.custom({ compact: true, maxDecimals: 1 })(2_500_000)}
            </span>
          </div>
        );
      }
      render(<Shapes />);
      expect(screen.getByTestId('sign')).toHaveTextContent('+$1,234');
      expect(screen.getByTestId('compact')).toHaveTextContent('$2.5M');
    });

    it('returns a cached formatter for an identical option shape', () => {
      const seen: Array<(v: number | null | undefined) => string> = [];
      function Cached(): JSX.Element {
        const fmt = useCurrencyFormatter();
        seen.push(fmt.custom({ decimals: 0 }));
        seen.push(fmt.custom({ decimals: 0 }));
        seen.push(fmt.custom({ decimals: 2 }));
        return <span />;
      }
      render(<Cached />);
      expect(seen[0]).toBe(seen[1]);
      expect(seen[0]).not.toBe(seen[2]);
    });

    it('does not serve a stale formatter after the currency changes', () => {
      const seen: Array<(v: number | null | undefined) => string> = [];
      function Stale(): JSX.Element {
        const format = useCurrencyFormatter().custom({ decimals: 0 });
        seen.push(format);
        return <span data-testid="v">{format(1000)}</span>;
      }
      render(<Stale />);
      expect(screen.getByTestId('v')).toHaveTextContent('$1,000');

      setCurrency('EUR');
      expect(screen.getByTestId('v')).toHaveTextContent('€1,000');
      expect(seen[seen.length - 1]).not.toBe(seen[0]);
    });
  });
});
