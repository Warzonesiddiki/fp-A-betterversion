/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcuts } from './KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it('renders when isOpen is true', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<KeyboardShortcuts {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders search input', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search shortcuts...')).toBeInTheDocument();
  });

  it('renders shortcut categories', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Editing')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('Formatting')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('renders shortcut descriptions', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders kbd elements for keys', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    const kbds = screen.getAllByText('Ctrl');
    expect(kbds.length).toBeGreaterThan(0);
  });

  it('renders footer with toggle hint', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    expect(screen.getByText(/to toggle this overlay/)).toBeInTheDocument();
  });

  // Interactions
  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<KeyboardShortcuts {...defaultProps} onClose={onClose} />);
    // The close button is inside the header, find by the X icon's parent
    const closeBtn = container.querySelector('button')!;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcuts {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<KeyboardShortcuts {...defaultProps} onClose={onClose} />);
    // The backdrop is the outermost fixed div with onClick=onClose
    const backdrop = container.querySelector('.fixed.inset-0.z-50')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  // Search/filter
  it('filters shortcuts by search text', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search shortcuts...');
    fireEvent.change(input, { target: { value: 'undo' } });
    expect(screen.getByText('Undo')).toBeInTheDocument();
    // Non-matching should be filtered out
    expect(screen.queryByText('Open command palette')).not.toBeInTheDocument();
  });

  it('filters by category name', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search shortcuts...');
    fireEvent.change(input, { target: { value: 'Navigation' } });
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
  });

  it('shows all shortcuts when search is empty', () => {
    render(<KeyboardShortcuts {...defaultProps} />);
    expect(screen.getByText('Open command palette')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });
});
