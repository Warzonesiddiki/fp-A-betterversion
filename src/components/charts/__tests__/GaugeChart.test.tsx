import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { GaugeChart } from '../GaugeChart';

describe('GaugeChart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders with value and label', () => {
    render(<GaugeChart value={75} max={100} label="Revenue" />);
    expect(screen.getByTestId('gauge-chart')).toBeTruthy();
    expect(screen.getByText('Revenue')).toBeTruthy();
  });

  it('renders with custom format', () => {
    render(
      <GaugeChart value={500000} max={1000000} formatValue={(v) => `$${(v / 1000).toFixed(0)}k`} />
    );
    expect(screen.getByText('$500k')).toBeTruthy();
  });
});
