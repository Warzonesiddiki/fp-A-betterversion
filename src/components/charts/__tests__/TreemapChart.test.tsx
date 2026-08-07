import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { TreemapChart } from '../TreemapChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Treemap: ({ children }: any) => <div data-testid="treemap-recharts">{children}</div>,
  Tooltip: () => null,
}));

describe('TreemapChart', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders with data', () => {
    const data = [
      { name: 'Tech', size: 50 },
      { name: 'Health', size: 30 },
    ];
    render(<TreemapChart data={data} />);
    expect(screen.getByTestId('treemap-chart')).toBeTruthy();
  });
});
