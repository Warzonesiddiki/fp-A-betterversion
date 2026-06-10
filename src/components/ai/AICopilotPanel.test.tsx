import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AICopilotPanel } from './AICopilotPanel';
import { FinanceCopilotEngine } from '@/engines/FinanceCopilotEngine';
import { AICopilotEngine } from '@/engines/AICopilotEngine';

// Mock engines
vi.mock('@/engines/FinanceCopilotEngine', () => ({
  FinanceCopilotEngine: {
    answer: vi.fn(),
  },
}));

vi.mock('@/engines/AICopilotEngine', () => ({
  AICopilotEngine: {
    suggestFormula: vi.fn(),
  },
}));

describe('AICopilotPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(FinanceCopilotEngine.answer).mockReturnValue({
      answer: 'Mocked answer',
      confidence: 0.95,
      sources: [],
    });
    vi.mocked(AICopilotEngine.suggestFormula).mockReturnValue({
      formula: 'SUM(A1:A10)',
      confidence: 0.9,
      description: '',
      alternatives: [],
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders and displays context suggestions', () => {
    render(<AICopilotPanel pathname="/dashboard" />);

    // Header should be visible
    expect(screen.getByText('AI Copilot')).toBeInTheDocument();
    // Context label for /dashboard
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Suggestion chips should be visible
    expect(screen.getByText(/Show me a revenue vs expense summary/)).toBeInTheDocument();
  });

  it('toggles collapse state on header click', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AICopilotPanel pathname="/dashboard" />);

    // Initially not collapsed, input should be visible
    expect(screen.getByPlaceholderText('Ask a financial question...')).toBeInTheDocument();

    // Click header to collapse
    const headerBtn = screen.getByRole('button', { expanded: true });
    await user.click(headerBtn);

    // Should be collapsed now
    expect(screen.queryByPlaceholderText('Ask a financial question...')).not.toBeInTheDocument();

    // Click to expand again
    const collapsedBtn = screen.getByRole('button', { expanded: false });
    await user.click(collapsedBtn);
    expect(screen.getByPlaceholderText('Ask a financial question...')).toBeInTheDocument();
  });

  it('sends message via suggestion chip', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AICopilotPanel pathname="/dashboard" />);

    // Click suggestion
    const chip = screen.getByText(/Show me a revenue vs expense summary/);
    await user.click(chip);

    // User message should appear
    expect(screen.getByText('Show me a revenue vs expense summary')).toBeInTheDocument();

    // Processing state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();

    // Advance timers
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Assistant response should appear
    expect(screen.getByText('Mocked answer')).toBeInTheDocument();
    expect(screen.getByText('95% confident')).toBeInTheDocument();
    expect(screen.getByText('SUM(A1:A10)')).toBeInTheDocument();
  });

  it('sends message via input and submit button', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AICopilotPanel pathname="/reports" />);

    const input = screen.getByPlaceholderText('Ask a financial question...');
    await user.type(input, 'Test query');

    const submitBtn = screen.getByLabelText('Send');
    await user.click(submitBtn);

    expect(screen.getByText('Test query')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('Mocked answer')).toBeInTheDocument();
    expect(FinanceCopilotEngine.answer).toHaveBeenCalledWith('Test query', {
      gl: undefined,
      budget: undefined,
    });
  });

  it('sends message via Enter key', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AICopilotPanel pathname="/analytics" />);

    const input = screen.getByPlaceholderText('Ask a financial question...');
    await user.type(input, 'Enter query{enter}');

    expect(screen.getByText('Enter query')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('Mocked answer')).toBeInTheDocument();
  });

  it('handles errors gracefully', async () => {
    vi.mocked(FinanceCopilotEngine.answer).mockImplementation(() => {
      throw new Error('Engine error');
    });

    const user = userEvent.setup({ delay: null });
    render(<AICopilotPanel pathname="/scenarios" />);

    const input = screen.getByPlaceholderText('Ask a financial question...');
    await user.type(input, 'Error query{enter}');

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('Could not process that query.')).toBeInTheDocument();
  });

  it('does not send empty message', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AICopilotPanel pathname="/" />);

    const input = screen.getByPlaceholderText('Ask a financial question...');
    await user.type(input, '   {enter}');

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Suggestion chips should still be there because no message sent
    expect(screen.getByText(/Help me write a financial formula/)).toBeInTheDocument();
  });
});
