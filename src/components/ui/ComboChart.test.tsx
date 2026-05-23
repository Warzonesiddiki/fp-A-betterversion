import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComboChart } from './ComboChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('ComboChart', () => {
  const bars = [{ key: 'revenue', name: 'Revenue' }];
  const lines = [{ key: 'target', name: 'Target' }];
  const data = [
    { month: 'Jan', revenue: 100, target: 90 },
    { month: 'Feb', revenue: 200, target: 180 },
  ];

  it('renders chart container', () => {
    const { container } = render(
      <ComboChart data={data} bars={bars} lines={lines} xAxisKey="month" />
    );
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('renders title when provided', () => {
    render(
      <ComboChart
        data={data}
        bars={bars}
        lines={lines}
        xAxisKey="month"
        title="Revenue vs Target"
      />
    );
    expect(screen.getByText('Revenue vs Target')).toBeInTheDocument();
  });

  it('renders with data and shows chart elements', () => {
    const { container } = render(
      <ComboChart data={data} bars={bars} lines={lines} xAxisKey="month" />
    );
    expect(container.querySelector('[data-testid="composed-chart"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="bar"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="line"]')).toBeTruthy();
  });

  it('handles empty data without crashing', () => {
    render(<ComboChart data={[]} bars={bars} lines={lines} xAxisKey="month" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('accepts custom height', () => {
    const { container } = render(
      <ComboChart data={data} bars={bars} lines={lines} xAxisKey="month" height={500} />
    );
    expect(container.querySelector('div')).toBeTruthy();
  });
});
