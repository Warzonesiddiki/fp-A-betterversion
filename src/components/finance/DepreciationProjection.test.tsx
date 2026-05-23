/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DepreciationProjection } from './DepreciationProjection';

vi.mock('@/components/ui/ComboChart', () => ({
  ComboChart: ({ data, xKey }: { data: unknown[]; xKey: string }) => (
    <div data-testid="combo-chart" data-xkey={xKey} data-length={data.length}>
      ComboChart Mock
    </div>
  ),
}));

describe('DepreciationProjection', () => {
  it('renders without crashing', () => {
    const { container } = render(<DepreciationProjection />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders ComboChart child component', () => {
    render(<DepreciationProjection />);
    expect(screen.getByTestId('combo-chart')).toBeInTheDocument();
  });

  it('passes empty data array to ComboChart', () => {
    render(<DepreciationProjection />);
    const chart = screen.getByTestId('combo-chart');
    expect(chart.getAttribute('data-length')).toBe('0');
  });

  it('uses year as xKey', () => {
    render(<DepreciationProjection />);
    const chart = screen.getByTestId('combo-chart');
    expect(chart.getAttribute('data-xkey')).toBe('year');
  });

  it('applies container height class', () => {
    const { container } = render(<DepreciationProjection />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
  });
});
