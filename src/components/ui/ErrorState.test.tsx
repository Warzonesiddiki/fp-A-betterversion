/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  // --- Renders ---
  it('renders with default title and message', () => {
    render(<ErrorState message="Network timeout" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorState title="Connection Failed" message="Check your internet" />);
    expect(screen.getByText('Connection Failed')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState message="Failed" onRetry={() => {}} />);
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is omitted', () => {
    render(<ErrorState message="Failed" />);
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it('renders custom retry label', () => {
    render(<ErrorState message="Failed" onRetry={() => {}} retryLabel="Reload" />);
    expect(screen.getByText('Reload')).toBeInTheDocument();
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  // --- Interaction ---
  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not crash when retry button clicked multiple times', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Failed" onRetry={onRetry} />);
    const btn = screen.getByText('Try again');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(3);
  });

  // --- Accessibility ---
  it('has role="alert"', () => {
    render(<ErrorState message="Error occurred" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<ErrorState message="Error occurred" />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  // --- Custom className ---
  it('applies custom className', () => {
    render(<ErrorState message="Error" className="custom-error" />);
    expect(screen.getByRole('alert').className).toContain('custom-error');
  });

  // --- Sad paths ---
  it('renders empty message without crashing', () => {
    render(<ErrorState message="" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders very long message without crashing', () => {
    const longMsg = 'E'.repeat(1000);
    render(<ErrorState message={longMsg} />);
    expect(screen.getByText(longMsg)).toBeInTheDocument();
  });

  it('renders with XSS-like content safely', () => {
    render(<ErrorState message={'<img src=x onerror=alert(1)>'} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders error icon (AlertTriangle)', () => {
    const { container } = render(<ErrorState message="Error" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders RefreshCw icon inside retry button', () => {
    render(<ErrorState message="Error" onRetry={() => {}} />);
    const button = screen.getByText('Try again');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});
