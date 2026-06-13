import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CopilotSidebar } from './CopilotSidebar';

const mockTrack = vi.fn();
vi.mock('@/hooks/useAIAnalytics', () => ({
  useAIAnalytics: () => ({
    track: mockTrack,
    trackAsync: vi.fn(),
    getStats: vi.fn(() => ({ events: [], byEngine: {}, totalEvents: 0 })),
    clearStats: vi.fn(),
    getRecentEvents: vi.fn(() => []),
  }),
}));

vi.mock('@/engines/AICopilotEngine', () => ({
  AICopilotEngine: {
    suggestFormula: vi.fn((text: string) => {
      if (text.toLowerCase().includes('sum')) {
        return { formula: 'SUM(A1:A10)', description: 'Sum', confidence: 0.85, alternatives: [] };
      }
      return { formula: '', description: '', confidence: 0, alternatives: [] };
    }),
  },
}));

vi.mock('@/engines/FinanceCopilotEngine', () => ({
  FinanceCopilotEngine: {
    answer: vi.fn(() => ({
      answer: 'Total revenue: $100K',
      confidence: 0.9,
      sources: ['GL Entries'],
      chartType: 'bar',
    })),
  },
}));

describe('CopilotSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <CopilotSidebar />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });

  it('tracks AI engine usage when messages are sent', async () => {
    render(
      <MemoryRouter>
        <CopilotSidebar />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/Ask the AI copilot/i);
    fireEvent.change(input, { target: { value: 'sum of revenue' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should track both AICopilotEngine and FinanceCopilotEngine
    expect(mockTrack).toHaveBeenCalledWith(expect.objectContaining({ engine: 'AICopilotEngine' }));
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ engine: 'FinanceCopilotEngine' })
    );
  });

  it('does not track when input is empty', async () => {
    render(
      <MemoryRouter>
        <CopilotSidebar />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/Ask the AI copilot/i);
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockTrack).not.toHaveBeenCalled();
  });
});
