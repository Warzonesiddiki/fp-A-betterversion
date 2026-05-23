import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaterfallChart } from './WaterfallChart';

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

describe('WaterfallChart', () => {
  const data = [
    { label: 'Revenue', value: 500000 },
    { label: 'COGS', value: -200000 },
    { label: 'OpEx', value: -150000 },
    { label: 'Net Income', value: 150000, isTotal: true },
  ];

  it('renders chart with data', () => {
    const { container } = render(<WaterfallChart data={data} />);
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeTruthy();
  });

  it('shows title when provided', () => {
    render(<WaterfallChart data={data} title="P&L Waterfall" />);
    expect(screen.getByText('P&L Waterfall')).toBeInTheDocument();
  });

  it('renders bars for each item', () => {
    const { container } = render(<WaterfallChart data={data} />);
    expect(container.querySelector('[data-testid="bar"]')).toBeTruthy();
  });

  it('renders total bar', () => {
    const { container } = render(<WaterfallChart data={data} />);
    expect(container.querySelector('[data-testid="bar"]')).toBeTruthy();
  });

  it('handles empty data', () => {
    const { container } = render(<WaterfallChart data={[]} />);
    expect(container.textContent).toContain('No data');
  });

  it('accepts custom height', () => {
    const { container } = render(<WaterfallChart data={data} height={500} />);
    expect(container.querySelector('[data-testid="responsive-container"]')).toBeTruthy();
  });
});
