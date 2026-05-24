import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { SparklineChart } from '../SparklineChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
}));

describe('SparklineChart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders with data', () => {
    render(<SparklineChart data={[10, 20, 15, 30, 25]} />);
    expect(screen.getByTestId('sparkline-chart')).toBeTruthy();
  });
});
