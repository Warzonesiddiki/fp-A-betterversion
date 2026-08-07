import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NLQChat } from './NLQChat';
import { useGLStore } from '@/store/glStore';
import { NLQEngine } from '@/engines/NLQEngine';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(),
}));

vi.mock('@/engines/NLQEngine', () => ({
  NLQEngine: {
    parseQuery: vi.fn(),
    executeQuery: vi.fn(),
  },
}));

describe('NLQChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useGLStore as any).mockReturnValue({ entries: [] });
  });

  const renderComponent = (initialEntries = ['/dashboard']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <NLQChat />
      </MemoryRouter>
    );
  };

  it('renders correctly with no data', () => {
    renderComponent();
    expect(screen.getByText('NLQ Chat')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(
      screen.getByText('Ask questions about your financial data in plain English')
    ).toBeInTheDocument();
  });

  it('renders correctly with data', () => {
    (useGLStore as any).mockReturnValue({ entries: [{ id: '1' }] });
    renderComponent();
    expect(screen.getByText('1 entries')).toBeInTheDocument();
  });

  it('handles clicking a suggestion', async () => {
    (useGLStore as any).mockReturnValue({ entries: [{ id: '1' }] });
    (NLQEngine.parseQuery as any).mockReturnValue({
      intent: 'test',
      confidence: 0.9,
      dimensions: [],
      metrics: [],
      filters: [],
    });
    (NLQEngine.executeQuery as any).mockReturnValue({
      query: { intent: 'test', confidence: 0.9 },
      data: [{ label: 'Q1', value: 100 }],
      summary: 'Summary result',
    });

    renderComponent(['/dashboard']);

    const suggestionBtn = screen.getByRole('button', {
      name: /Show revenue by department/i,
    });
    expect(suggestionBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(suggestionBtn);
    });

    expect(NLQEngine.parseQuery).toHaveBeenCalledWith('Show revenue by department');
    expect(screen.getByText('Summary result')).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('handles form submit query with low confidence', async () => {
    (useGLStore as any).mockReturnValue({ entries: [{ id: '1' }] });
    (NLQEngine.parseQuery as any).mockReturnValue({
      intent: 'test',
      confidence: 0.5,
      dimensions: [],
      metrics: [],
      filters: [],
    });
    (NLQEngine.executeQuery as any).mockReturnValue({
      query: { intent: 'test', confidence: 0.5 },
      data: [{ label: 'Q1', value: 100 }],
      summary: 'Summary result',
    });

    renderComponent(['/dashboard']);

    const input = screen.getByPlaceholderText('Ask about your data...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'My custom query' } });
      fireEvent.submit(screen.getByRole('textbox')); // Actually submit button is nearby
    });

    // Alternatively, fire event on the form by pressing enter or clicking submit
    const sendBtn = screen.getByRole('button', { name: /Send/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    expect(NLQEngine.parseQuery).toHaveBeenCalledWith('My custom query');
    expect(screen.getByText(/Low confidence 50%/i)).toBeInTheDocument();
  });

  it('handles enter key press', async () => {
    (useGLStore as any).mockReturnValue({ entries: [{ id: '1' }] });
    (NLQEngine.parseQuery as any).mockReturnValue({
      intent: 'test',
      confidence: 0.9,
      dimensions: [],
      metrics: [],
      filters: [],
    });
    (NLQEngine.executeQuery as any).mockReturnValue({
      query: { intent: 'test', confidence: 0.9 },
      data: [],
      summary: 'Empty result',
    });

    renderComponent(['/budgets']);

    const input = screen.getByPlaceholderText('Ask about your data...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Query with empty data' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });
    });

    expect(
      screen.getByText(
        (content) =>
          content.includes('Empty result') &&
          content.includes('Try rephrasing or check if GL data is loaded.')
      )
    ).toBeInTheDocument();
  });

  it('handles query error', async () => {
    (useGLStore as any).mockReturnValue({ entries: [{ id: '1' }] });
    (NLQEngine.parseQuery as any).mockImplementation(() => {
      throw new Error('Parse error');
    });

    renderComponent(['/reports']);

    const input = screen.getByPlaceholderText('Ask about your data...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Invalid query' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });
    });

    expect(screen.getByText(/Could not understand that query/i)).toBeInTheDocument();
  });

  it('displays more items logic', async () => {
    (useGLStore as any).mockReturnValue({ entries: [{ id: '1' }] });
    (NLQEngine.parseQuery as any).mockReturnValue({
      intent: 'test',
      confidence: 0.9,
      dimensions: [],
      metrics: [],
      filters: [],
    });

    const mockData = Array.from({ length: 8 }).map((_, i) => ({ label: `Val${i}`, value: 10 * i }));
    (NLQEngine.executeQuery as any).mockReturnValue({
      query: { intent: 'test', confidence: 0.9 },
      data: mockData,
      summary: 'Long list',
    });

    renderComponent(['/unknown-route']);

    const input = screen.getByPlaceholderText('Ask about your data...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Long list query' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });
    });

    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });
});
