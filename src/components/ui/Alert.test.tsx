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

  // Display-only (inline) usage: every page caller — the GL upload wizard's
  // import failures, BudgetCreatePage form errors, DataImportPage migration
  // errors — passes title/message/type WITHOUT dialog props. That shape must
  // render an in-page banner; a rejected source row is only honest if the user
  // can see its reason (FR-002).
  describe('inline (display-only) usage', () => {
    it('renders title and message when no dialog props are passed', () => {
      render(<Alert type="error" title="Import Error" message="row 26: missing accountCode" />);
      expect(screen.getByText('Import Error')).toBeInTheDocument();
      expect(screen.getByText('row 26: missing accountCode')).toBeInTheDocument();
    });

    it('exposes the banner to assistive tech as role="alert"', () => {
      render(<Alert type="error" title="Import Error" message="boom" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('applies the caller className (previously dropped)', () => {
      render(<Alert type="error" title="T" message="M" className="mt-4" />);
      expect(screen.getByRole('alert').className).toContain('mt-4');
    });

    it('does not render dialog confirm/cancel buttons', () => {
      render(<Alert type="error" title="Import Error" message="boom" />);
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });
});
