/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
// Mock the uiStore before importing the component
const mockToasts = [
  { id: 't1', type: 'success' as const, title: 'Saved!', message: 'Data saved successfully.' },
  { id: 't2', type: 'error' as const, title: 'Error!', message: 'Something went wrong.' },
];
const mockRemoveToast = vi.fn();

vi.mock('@/store/uiStore', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      toasts: mockToasts,
      removeToast: mockRemoveToast,
    };
    return selector(state);
  },
}));

import { ToastContainer } from './ToastContainer';

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it('renders toast container with role="status"', () => {
    render(<ToastContainer />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders aria-live="polite"', () => {
    render(<ToastContainer />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders toasts from store', () => {
    render(<ToastContainer />);
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('renders toast messages', () => {
    render(<ToastContainer />);
    expect(screen.getByText('Data saved successfully.')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  // Position variants
  it('applies top-right position by default', () => {
    render(<ToastContainer />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('top-4');
    expect(container.className).toContain('right-4');
  });

  it('applies top-left position', () => {
    render(<ToastContainer position="top-left" />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('top-4');
    expect(container.className).toContain('left-4');
  });

  it('applies bottom-right position', () => {
    render(<ToastContainer position="bottom-right" />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('bottom-4');
    expect(container.className).toContain('right-4');
  });

  it('applies bottom-left position', () => {
    render(<ToastContainer position="bottom-left" />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('bottom-4');
    expect(container.className).toContain('left-4');
  });

  it('has fixed positioning', () => {
    render(<ToastContainer />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('fixed');
  });

  it('has pointer-events-none on container', () => {
    render(<ToastContainer />);
    const container = screen.getByRole('status');
    expect(container.className).toContain('pointer-events-none');
  });
});
