import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from './Sparkline';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="line-chart">{children}</svg>
  ),
  Line: () => <line data-testid="line" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="area-chart">{children}</svg>
  ),
  Area: () => <path data-testid="area" />,
}));

describe('Sparkline', () => {
  it('renders placeholder for empty data', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('renders placeholder for single-point data', () => {
    const { container } = render(<Sparkline data={[42]} />);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('accepts data array and renders chart', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('applies width from props', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} width={200} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('200px');
  });

  it('applies height from props', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} height={50} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.height).toBe('50px');
  });

  it('renders with showArea prop', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} showArea />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
