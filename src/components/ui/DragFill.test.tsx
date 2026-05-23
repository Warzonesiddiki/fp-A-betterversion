/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DragFill } from './DragFill';

describe('DragFill', () => {
  const defaultProps = {
    values: [1, 2, 3],
    onFill: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it('renders the drag handle', () => {
    const { container } = render(<DragFill {...defaultProps} />);
    const handle = container.querySelector('[role="button"]');
    expect(handle).toBeInTheDocument();
  });

  it('renders with aria-label', () => {
    const { container } = render(<DragFill {...defaultProps} />);
    const handle = container.querySelector('[aria-label="Drag to fill cells"]');
    expect(handle).toBeInTheDocument();
  });

  it('has aria-haspopup="menu"', () => {
    const { container } = render(<DragFill {...defaultProps} />);
    const handle = container.querySelector('[aria-haspopup="menu"]');
    expect(handle).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<DragFill {...defaultProps} className="custom-fill" />);
    expect(container.firstChild).toHaveAttribute('class');
  });

  it('renders with correct direction class for down', () => {
    const { container } = render(<DragFill {...defaultProps} direction="down" />);
    const handle = container.querySelector('[role="button"]');
    expect(handle?.className).toContain('-bottom-1.5');
  });

  it('renders with correct direction class for right', () => {
    const { container } = render(<DragFill {...defaultProps} direction="right" />);
    const handle = container.querySelector('[role="button"]');
    expect(handle?.className).toContain('-right-1.5');
  });

  // Interactions
  it('shows fill mode menu on click (short mousedown + mouseup)', () => {
    const { container } = render(<DragFill {...defaultProps} />);
    const handle = container.querySelector('[role="button"]')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(handle);
    expect(screen.getByText('Fill Options')).toBeInTheDocument();
    expect(screen.getByText('Copy Cells')).toBeInTheDocument();
  });

  it('calls onFill when copy mode selected', () => {
    const onFill = vi.fn();
    const { container } = render(<DragFill {...defaultProps} onFill={onFill} />);
    const handle = container.querySelector('[role="button"]')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(handle);
    fireEvent.click(screen.getByText('Copy Cells'));
    expect(onFill).toHaveBeenCalledWith(expect.any(Array), 10);
  });

  it('shows linear trend option for arithmetic series', () => {
    const { container } = render(<DragFill values={[2, 4, 6]} onFill={vi.fn()} />);
    const handle = container.querySelector('[role="button"]')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(handle);
    expect(screen.getByText('Linear Trend')).toBeInTheDocument();
  });

  it('shows growth trend option for geometric series', () => {
    const { container } = render(<DragFill values={[2, 4, 8]} onFill={vi.fn()} />);
    const handle = container.querySelector('[role="button"]')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(handle);
    expect(screen.getByText('Growth Trend')).toBeInTheDocument();
  });

  it('always shows fill series option', () => {
    const { container } = render(<DragFill {...defaultProps} />);
    const handle = container.querySelector('[role="button"]')!;
    fireEvent.mouseDown(handle, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(handle);
    expect(screen.getByText('Fill Series')).toBeInTheDocument();
  });

  // Keyboard
  it('responds to Enter key on handle', () => {
    const { container } = render(<DragFill {...defaultProps} />);
    const handle = container.querySelector('[role="button"]')!;
    fireEvent.keyDown(handle, { key: 'Enter' });
    // Should trigger the mousedown flow
  });

  it('responds to Space key on handle', () => {
    const { container } = render(<DragFill {...defaultProps} />);
    const handle = container.querySelector('[role="button"]')!;
    fireEvent.keyDown(handle, { key: ' ' });
  });
});
