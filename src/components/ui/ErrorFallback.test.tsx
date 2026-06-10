import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { ErrorFallback } from './ErrorFallback';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

describe('ErrorFallback', () => {
  const testError = new Error('Test error message');

  it('renders error message', () => {
    render(<ErrorFallback error={testError} />);
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('renders Try Again button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorFallback error={testError} onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders title and description', () => {
    render(<ErrorFallback error={testError} />);
    expect(screen.getAllByText(/Something went wrong/i)[0]).toBeInTheDocument();
  });
});
