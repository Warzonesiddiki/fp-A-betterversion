import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  const defaultProps = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    title: 'Confirm Delete',
    message: 'Are you sure?',
  };

  it('renders title and message', () => {
    render(<Alert {...defaultProps} />);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons with default text', () => {
    render(<Alert {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders custom button text', () => {
    render(<Alert {...defaultProps} confirmText="Yes, Delete" cancelText="No, Keep" />);
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
    expect(screen.getByText('No, Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(<Alert {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<Alert {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('applies default variant styles', () => {
    render(<Alert {...defaultProps} />);
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.className).toContain('bg-[var(--action-fill)]');
  });

  it('applies destructive variant styles', () => {
    render(<Alert {...defaultProps} variant="destructive" />);
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.className).toContain('bg-[var(--danger-fill)]');
  });

  it('does not render content when open is false', () => {
    render(<Alert {...defaultProps} open={false} />);
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
  });
});
