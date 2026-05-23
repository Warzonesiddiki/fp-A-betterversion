/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaseSchedule } from './LeaseSchedule';

vi.mock('@/components/ui/ComboChart', () => ({
  ComboChart: ({ data, xKey }: { data: unknown[]; xKey: string }) => (
    <div data-testid="combo-chart" data-xkey={xKey} data-length={data.length}>
      ComboChart Mock
    </div>
  ),
}));

describe('LeaseSchedule', () => {
  it('renders without crashing', () => {
    const { container } = render(<LeaseSchedule />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ComboChart child component', () => {
    render(<LeaseSchedule />);
    expect(screen.getByTestId('combo-chart')).toBeInTheDocument();
  });

  it('passes empty data array to ComboChart', () => {
    render(<LeaseSchedule />);
    const chart = screen.getByTestId('combo-chart');
    expect(chart.getAttribute('data-length')).toBe('0');
  });

  it('uses period as xKey', () => {
    render(<LeaseSchedule />);
    const chart = screen.getByTestId('combo-chart');
    expect(chart.getAttribute('data-xkey')).toBe('period');
  });

  it('applies container height class', () => {
    const { container } = render(<LeaseSchedule />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
  });
});
