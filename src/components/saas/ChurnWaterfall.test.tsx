import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChurnWaterfall } from './ChurnWaterfall';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
  LabelList: () => <div data-testid="label-list" />,
}));

describe('ChurnWaterfall', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChurnWaterfall />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the waterfall chart', () => {
    const { container } = render(<ChurnWaterfall />);
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeTruthy();
  });

  it('renders chart bars', () => {
    const { container } = render(<ChurnWaterfall />);
    expect(container.querySelector('[data-testid="bar"]')).toBeTruthy();
  });

  it('has the correct container styling', () => {
    const { container } = render(<ChurnWaterfall />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
    expect(wrapper.className).toContain('rounded-xl');
  });

  it('renders the responsive container', () => {
    const { container } = render(<ChurnWaterfall />);
    expect(container.querySelector('[data-testid="responsive-container"]')).toBeTruthy();
  });
});
