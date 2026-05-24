import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { HeatmapChart } from '../HeatmapChart';

describe('HeatmapChart', () => {
  beforeEach(() => vi.clearAllMocks());

  const data = [
    { x: 'Jan', y: 'Revenue', value: 100 },
    { x: 'Feb', y: 'Revenue', value: 120 },
    { x: 'Jan', y: 'Expenses', value: 80 },
  ];

  it('renders heatmap data', () => {
    render(<HeatmapChart data={data} />);
    expect(screen.getByTestId('heatmap-chart')).toBeTruthy();
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Feb')).toBeTruthy();
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('Expenses')).toBeTruthy();
  });
});
