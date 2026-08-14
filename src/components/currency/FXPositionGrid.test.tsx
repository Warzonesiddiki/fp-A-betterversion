import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { FXPositionGrid } from './FXPositionGrid';
import { useFxRateStore } from '@/store/fxRateStore';

// Rates for every SAMPLE_POSITIONS pair (entityCurrency is USD).
// Required since F-0001: positions without rates are excluded and reported,
// never silently valued at a fabricated rate.
const SEED_RATES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'].map((c, i) => ({
  id: `seed-${c}`,
  fromCurrency: 'USD',
  toCurrency: c,
  rate: 1.1 + i * 0.01,
  effectiveDate: '2026-06-30',
}));

describe('FXPositionGrid', () => {
  beforeEach(() => {
    useFxRateStore.setState({ rates: SEED_RATES });
  });

  it('renders without crashing', () => {
    const { container } = render(<FXPositionGrid />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('shows FX Position Grid heading', () => {
    render(<FXPositionGrid />);
    expect(screen.getByText('FX Position Grid')).toBeDefined();
  });

  it('shows position count', () => {
    render(<FXPositionGrid />);
    expect(screen.getByText(/positions across/)).toBeDefined();
  });

  it('shows concentration percentage', () => {
    render(<FXPositionGrid />);
    expect(screen.getByText(/%/)).toBeDefined();
  });
});

describe('FXPositionGrid — missing rate handling (F-0001)', () => {
  beforeEach(() => {
    useFxRateStore.setState({ rates: SEED_RATES });
  });

  it('excludes positions without rates and shows a visible alert instead of fabricating values', () => {
    useFxRateStore.setState({ rates: [] });
    render(<FXPositionGrid />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('excluded');
    expect(alert.textContent).toContain('USD→EUR');
  });

  it('shows no exclusion alert when all rates are loaded', () => {
    render(<FXPositionGrid />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
