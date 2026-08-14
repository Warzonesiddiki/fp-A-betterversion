import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FindReplaceDialog } from './FindReplaceDialog';

describe('FindReplaceDialog', () => {
  it('renders the dialog when open', () => {
    render(<FindReplaceDialog gridApi={null} isOpen onClose={vi.fn()} />);
    // Closed, this returns null — the old container assertion passed on an empty
    // DOM. Assert the open state exposes a real dialog.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <FindReplaceDialog gridApi={null} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });
});
