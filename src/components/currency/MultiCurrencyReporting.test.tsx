import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MultiCurrencyReporting } from './MultiCurrencyReporting';
import { useFxRateStore } from '@/store/fxRateStore';

// Rates for every ENTITIES currency -> USD (the default reporting currency).
// Required since F-0001: entities without rates are excluded and reported,
// never silently translated at a fabricated 1.0 rate.
const SEED_RATES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'].map((c, i) => ({
  id: `seed-${c}`,
  fromCurrency: c,
  toCurrency: 'USD',
  rate: 1.05 + i * 0.01,
  effectiveDate: '2026-06-30',
}));

describe('MultiCurrencyReporting', () => {
  beforeEach(() => {
    useFxRateStore.setState({ rates: SEED_RATES });
  });

  it('renders without crashing', () => {
    const { container } = render(<MultiCurrencyReporting />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('shows Multi-Currency Reporting heading', () => {
    render(<MultiCurrencyReporting />);
    expect(screen.getByText('Multi-Currency Reporting')).toBeDefined();
  });

  it('shows entity count', () => {
    render(<MultiCurrencyReporting />);
    expect(screen.getByText(/entities/)).toBeDefined();
  });
});

describe('MultiCurrencyReporting — missing rate handling (F-0001)', () => {
  beforeEach(() => {
    useFxRateStore.setState({ rates: SEED_RATES });
  });

  it('excludes entities without rates and shows a blocking alert naming them', () => {
    useFxRateStore.setState({ rates: [] });
    render(<MultiCurrencyReporting />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Consolidation incomplete');
    expect(alert.textContent).toContain('excluded');
    expect(alert.textContent).toContain('EUR→USD');
  });

  it('shows no exclusion alert when all rates are loaded', () => {
    render(<MultiCurrencyReporting />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
