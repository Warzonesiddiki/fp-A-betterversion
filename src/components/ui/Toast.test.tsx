import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from './Toast';

const createToast = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-1',
  type: 'success' as const,
  title: 'Success!',
  message: 'Operation completed.',
  ...overrides,
});

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders title text', () => {
    render(<Toast toast={createToast()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders message text', () => {
    render(<Toast toast={createToast()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Operation completed.')).toBeInTheDocument();
  });

  it('renders with success variant', () => {
    render(<Toast toast={createToast({ type: 'success' })} onDismiss={vi.fn()} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders with error variant', () => {
    render(<Toast toast={createToast({ type: 'error', title: 'Error!' })} onDismiss={vi.fn()} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('renders with warning variant', () => {
    render(
      <Toast toast={createToast({ type: 'warning', title: 'Warning!' })} onDismiss={vi.fn()} />
    );
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('renders with info variant', () => {
    render(<Toast toast={createToast({ type: 'info', title: 'Info' })} onDismiss={vi.fn()} />);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={createToast()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledWith('test-1');
  });

  it('automatically dismisses after duration', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={createToast({ duration: 3000 })} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(onDismiss).toHaveBeenCalledWith('test-1');
  });

  it('does not render message when not provided', () => {
    render(<Toast toast={createToast({ message: undefined })} onDismiss={vi.fn()} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  // Wave-7E a11y: the card used to carry role="alert" + aria-live="assertive"
  // while nested inside the container's polite status region — every toast
  // interrupted. Politeness is now owned exclusively by the container's
  // sibling regions; the card itself must stay live-region-neutral.
  it('carries no own live-region semantics for any severity', () => {
    const { container } = render(
      <Toast toast={createToast({ type: 'error', title: 'Error!' })} onDismiss={vi.fn()} />
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('aria-live');
  });
});
