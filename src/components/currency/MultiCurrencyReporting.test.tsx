import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MultiCurrencyReporting } from './MultiCurrencyReporting';
import { useFxRateStore } from '@/store/fxRateStore';

describe('MultiCurrencyReporting', () => {
  beforeEach(() => {
    useFxRateStore.setState({ rates: [] });
  });

  it('renders without crashing', () => {
    const { container } = render(<MultiCurrencyReporting />);
    expect(container).toBeDefined();
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
