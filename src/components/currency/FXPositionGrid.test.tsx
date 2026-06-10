import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { FXPositionGrid } from './FXPositionGrid';
import { useFxRateStore } from '@/store/fxRateStore';

describe('FXPositionGrid', () => {
  beforeEach(() => {
    useFxRateStore.setState({ rates: [] });
  });

  it('renders without crashing', () => {
    const { container } = render(<FXPositionGrid />);
    expect(container).toBeDefined();
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
