/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
// Mock the uiStore before importing the component. The toast list is a
// mutable top-level binding so individual tests can drive severity mixes
// (Wave-7E single-region-policy coverage) without re-mocking the module.
type MockToast = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
};
let mockToasts: MockToast[] = [
  { id: 't1', type: 'success', title: 'Saved!', message: 'Data saved successfully.' },
  { id: 't2', type: 'error', title: 'Error!', message: 'Something went wrong.' },
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

const getViewport = (container: HTMLElement): HTMLElement => {
  const viewport = container.querySelector<HTMLElement>('[data-testid="toast-viewport"]');
  expect(viewport).not.toBeNull();
  return viewport!;
};

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToasts = [
      { id: 't1', type: 'success', title: 'Saved!', message: 'Data saved successfully.' },
      { id: 't2', type: 'error', title: 'Error!', message: 'Something went wrong.' },
    ];
  });

  // Rendering — Wave-7E: the container root is now a neutral positioning
  // wrapper; politeness lives in two SIBLING regions inside it.
  it('renders a polite status region for non-error toasts', () => {
    render(<ToastContainer />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders aria-live="polite" on the status region', () => {
    render(<ToastContainer />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders an assertive alert region as a SIBLING of the status region', () => {
    render(<ToastContainer />);
    const alertRegion = screen.getByRole('alert');
    expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
    // Never nested: neither region contains the other.
    const statusRegion = screen.getByRole('status');
    expect(statusRegion.contains(alertRegion)).toBe(false);
    expect(alertRegion.contains(statusRegion)).toBe(false);
  });

  it('renders both severity regions persistently even with no toasts', () => {
    mockToasts = [];
    render(<ToastContainer />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('routes success/info/warning toasts through the polite status region', () => {
    mockToasts = [
      { id: 'a', type: 'success', title: 'Saved!' },
      { id: 'b', type: 'info', title: 'Heads up' },
      { id: 'c', type: 'warning', title: 'Check this' },
    ];
    const { container } = render(<ToastContainer />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved!');
    expect(status).toHaveTextContent('Heads up');
    expect(status).toHaveTextContent('Check this');
    // No interruptive alert is mounted for any of them.
    expect(screen.queryByRole('alert')?.textContent ?? '').toBe('');
    expect(getViewport(container).querySelectorAll('[aria-live="assertive"] [role]')).toHaveLength(
      0
    );
  });

  it('routes error toasts through the sibling assertive alert region', () => {
    mockToasts = [{ id: 'e1', type: 'error', title: 'Export failed' }];
    render(<ToastContainer />);
    expect(screen.getByRole('alert')).toHaveTextContent('Export failed');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('never nests a live region inside another live region (toast cards stay neutral)', () => {
    render(<ToastContainer />);
    // Exactly one region per politeness — cards contribute no extra ones.
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    const status = screen.getByRole('status');
    const alert = screen.getByRole('alert');
    for (const region of [status, alert]) {
      expect(region.querySelectorAll('[aria-live]')).toHaveLength(0);
    }
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

  // Position variants — classes live on the viewport wrapper.
  it('applies top-right position by default', () => {
    const { container } = render(<ToastContainer />);
    const viewport = getViewport(container);
    expect(viewport.className).toContain('top-4');
    expect(viewport.className).toContain('right-4');
  });

  it('applies top-left position', () => {
    const { container } = render(<ToastContainer position="top-left" />);
    const viewport = getViewport(container);
    expect(viewport.className).toContain('top-4');
    expect(viewport.className).toContain('left-4');
  });

  it('applies bottom-right position', () => {
    const { container } = render(<ToastContainer position="bottom-right" />);
    const viewport = getViewport(container);
    expect(viewport.className).toContain('bottom-4');
    expect(viewport.className).toContain('right-4');
  });

  it('applies bottom-left position', () => {
    const { container } = render(<ToastContainer position="bottom-left" />);
    const viewport = getViewport(container);
    expect(viewport.className).toContain('bottom-4');
    expect(viewport.className).toContain('left-4');
  });

  it('has fixed positioning', () => {
    const { container } = render(<ToastContainer />);
    expect(getViewport(container).className).toContain('fixed');
  });

  it('has pointer-events-none on container', () => {
    const { container } = render(<ToastContainer />);
    expect(getViewport(container).className).toContain('pointer-events-none');
  });
});
