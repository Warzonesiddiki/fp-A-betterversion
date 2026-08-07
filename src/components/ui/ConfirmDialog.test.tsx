import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/testUtils';
import { ConfirmDialog, useConfirmStore } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  beforeEach(() => {
    useConfirmStore.setState({ isOpen: false, options: null, resolve: null });
  });

  it('renders nothing when not open', () => {
    const { container } = render(<ConfirmDialog />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', async () => {
    render(<ConfirmDialog />);
    useConfirmStore.getState().open({
      title: 'Confirm Delete',
      message: 'Are you sure?',
    });
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', async () => {
    render(<ConfirmDialog />);
    useConfirmStore.getState().open({
      title: 'Test',
      message: 'Proceed?',
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders custom button labels', async () => {
    render(<ConfirmDialog />);
    useConfirmStore.getState().open({
      title: 'Test',
      message: 'Go?',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'No, keep',
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /no, keep/i })).toBeInTheDocument();
  });
});
