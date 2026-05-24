import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ChatMessage } from './ChatMessage';
import type { NLQResult } from '@/engines/NLQEngine';

const userMessage = {
  id: '1',
  role: 'user' as const,
  content: 'Show me the revenue',
  timestamp: new Date('2024-01-15T10:00:00'),
};

const assistantMessage = {
  id: '2',
  role: 'assistant' as const,
  content: 'Here is the revenue data',
  timestamp: new Date('2024-01-15T10:00:01'),
  result: {
    query: {
      raw: 'Show me the revenue data',
      intent: 'chart',
      entities: {
        metrics: ['revenue'],
        dimensions: [],
        timePeriod: null,
        filters: [],
        aggregation: 'sum',
      },
      chartType: 'bar',
      confidence: 0.95,
    },
    data: [{ label: 'Q1', value: 100_000 }],
    summary: 'Revenue data summary',
    chartConfig: null,
  } satisfies NLQResult,
};

describe('ChatMessage', () => {
  it('renders user message', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText('Show me the revenue')).toBeInTheDocument();
  });

  it('renders assistant message', () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText('Here is the revenue data')).toBeInTheDocument();
  });
});
