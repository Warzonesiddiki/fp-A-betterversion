import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CellEditor } from './CellEditor';

describe('CellEditor', () => {
  const props = {
    value: '42',
    field: 'amount',
    rowIndex: 0,
    onCommit: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders an editable input seeded with the cell value when open', () => {
    render(<CellEditor {...props} isOpen />);
    expect(screen.getByDisplayValue('42')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CellEditor {...props} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });
});
