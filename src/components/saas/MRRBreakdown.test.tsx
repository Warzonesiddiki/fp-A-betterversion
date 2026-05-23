import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MRRBreakdown } from './MRRBreakdown';

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

describe('MRRBreakdown', () => {
  it('renders without crashing', () => {
    const { container } = render(<MRRBreakdown />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows empty data state', () => {
    render(<MRRBreakdown />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('has the correct container styling', () => {
    const { container } = render(<MRRBreakdown />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
    expect(wrapper.className).toContain('rounded-xl');
  });

  it('does not render chart when data is empty', () => {
    const { container } = render(<MRRBreakdown />);
    // ComboChart receives empty data, so it shows "No data" instead of the chart
    expect(container.querySelector('[data-testid="responsive-container"]')).toBeNull();
    expect(container.querySelector('[data-testid="composed-chart"]')).toBeNull();
  });
});
