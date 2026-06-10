/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulletChart } from './BulletChart';

const defaultProps = {
  actual: 75,
  target: 80,
};

describe('BulletChart', () => {
  // Rendering
  it('renders without crashing', () => {
    render(<BulletChart {...defaultProps} />);
    expect(screen.getByText(/75/)).toBeInTheDocument();
    expect(screen.getByText(/Target:.*80/)).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<BulletChart {...defaultProps} label="Revenue" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    const { container } = render(<BulletChart {...defaultProps} />);
    expect(container.querySelector('.font-medium')).not.toBeInTheDocument();
  });

  // Loading state
  it('renders loading spinner when loading is true', () => {
    const { container } = render(<BulletChart {...defaultProps} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Error state
  it('renders error message when error is provided', () => {
    render(<BulletChart {...defaultProps} error="Load failed" />);
    expect(screen.getAllByText(/Load failed/i)[0]).toBeInTheDocument();
  });

  // Invalid data
  it('renders invalid data message when actual is NaN', () => {
    render(<BulletChart actual={NaN} target={80} />);
    expect(screen.getByText('Invalid data')).toBeInTheDocument();
  });

  it('renders invalid data message when target is NaN', () => {
    render(<BulletChart actual={75} target={NaN} />);
    expect(screen.getByText('Invalid data')).toBeInTheDocument();
  });

  // Custom format
  it('uses custom format function', () => {
    const format = (v: number) => `$${v}M`;
    render(<BulletChart {...defaultProps} format={format} />);
    expect(screen.getByText('$75M')).toBeInTheDocument();
    expect(screen.getByText(/Target:.*\$80M/)).toBeInTheDocument();
  });

  // Click handler
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<BulletChart {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText(/75/).closest('div')!);
    expect(onClick).toHaveBeenCalled();
  });

  // Keyboard accessibility
  it('supports keyboard interaction when onClick is provided', () => {
    const onClick = vi.fn();
    render(<BulletChart {...defaultProps} onClick={onClick} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('supports space key interaction when onClick is provided', () => {
    const onClick = vi.fn();
    render(<BulletChart {...defaultProps} onClick={onClick} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  // Default ranges
  it('renders with default ranges', () => {
    const { container } = render(<BulletChart {...defaultProps} />);
    // Range bars are rendered
    expect(container.querySelector('.bg-gray-100')).toBeInTheDocument();
  });

  // Custom ranges
  it('renders with custom ranges', () => {
    const ranges = [
      { min: 0, max: 50, color: '#fecaca' },
      { min: 50, max: 100, color: '#d1fae5' },
    ];
    const { container } = render(<BulletChart {...defaultProps} ranges={ranges} />);
    expect(container.querySelector('.bg-gray-100')).toBeInTheDocument();
  });
});
