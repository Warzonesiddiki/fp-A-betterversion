/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { VarianceChart } from '../VarianceChart';

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
  Legend: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
}));

describe('VarianceChart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders with data', () => {
    const data = [{ name: 'Revenue', budget: 400000, actual: 450000 }];
    render(<VarianceChart data={data} />);
    expect(screen.getByTestId('variance-chart')).toBeTruthy();
  });
});
