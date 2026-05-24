import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { WaterfallChart } from '../WaterfallChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
}));

describe('WaterfallChart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders with data', () => {
    const data = [
      { name: 'Revenue', value: 500000 },
      { name: 'COGS', value: -200000 },
    ];
    render(<WaterfallChart data={data} />);
    expect(screen.getByTestId('waterfall-chart')).toBeTruthy();
  });

  it('shows total', () => {
    const data = [
      { name: 'Revenue', value: 500000 },
      { name: 'COGS', value: -200000 },
    ];
    render(<WaterfallChart data={data} />);
    expect(screen.getByText(/Total:/)).toBeTruthy();
  });
});
