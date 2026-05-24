import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ChatChart } from './ChatChart';
import type { NLQResult } from '@/engines/NLQEngine';

const mockResult: NLQResult = {
  query: {
    raw: 'show revenue by month',
    intent: 'trend',
    entities: {
      metrics: ['revenue'],
      dimensions: ['month'],
      timePeriod: null,
      filters: [],
      aggregation: 'sum',
    },
    chartType: 'bar',
    confidence: 1,
  },
  data: [
    { label: 'Jan', value: 1000 },
    { label: 'Feb', value: 1500 },
  ],
  summary: 'Revenue increasing trend',
  chartConfig: {
    type: 'bar',
    dataKey: 'value',
    labelKey: 'label',
    title: 'Revenue by Month',
  },
};

describe('ChatChart', () => {
  it('renders chart title', () => {
    render(<ChatChart result={mockResult} />);
    expect(screen.getByText('Revenue by Month')).toBeInTheDocument();
  });

  it('returns null when chartConfig is null', () => {
    const { container } = render(<ChatChart result={{ ...mockResult, chartConfig: null }} />);
    expect(container.innerHTML).toBe('');
  });
});
