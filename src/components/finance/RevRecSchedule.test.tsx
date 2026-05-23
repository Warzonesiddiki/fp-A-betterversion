/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevRecSchedule } from './RevRecSchedule';

vi.mock('@/components/ui/ComboChart', () => ({
  ComboChart: ({ data, xKey }: { data: unknown[]; xKey: string }) => (
    <div data-testid="combo-chart" data-xkey={xKey} data-length={data.length}>
      ComboChart Mock
    </div>
  ),
}));

describe('RevRecSchedule', () => {
  it('renders without crashing', () => {
    const { container } = render(<RevRecSchedule />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ComboChart child component', () => {
    render(<RevRecSchedule />);
    expect(screen.getByTestId('combo-chart')).toBeInTheDocument();
  });

  it('passes empty data array to ComboChart', () => {
    render(<RevRecSchedule />);
    const chart = screen.getByTestId('combo-chart');
    expect(chart.getAttribute('data-length')).toBe('0');
  });

  it('uses period as xKey', () => {
    render(<RevRecSchedule />);
    const chart = screen.getByTestId('combo-chart');
    expect(chart.getAttribute('data-xkey')).toBe('period');
  });

  it('applies container height class', () => {
    const { container } = render(<RevRecSchedule />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
  });
});
