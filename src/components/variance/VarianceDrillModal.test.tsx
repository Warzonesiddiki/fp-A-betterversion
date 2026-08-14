import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VarianceDrillModal } from './VarianceDrillModal';

describe('VarianceDrillModal', () => {
  const props = {
    onClose: vi.fn(),
    accountLabel: 'Marketing',
    accountPrefix: '6000',
    variance: -12_500,
    budget: 100_000,
    actual: 112_500,
  };

  it('renders the account under analysis when open', () => {
    render(<VarianceDrillModal isOpen {...props} />);
    expect(screen.getAllByText(/Marketing/).length).toBeGreaterThan(0);
  });

  it('renders nothing when closed', () => {
    const { container } = render(<VarianceDrillModal isOpen={false} {...props} />);
    expect(container.innerHTML).toBe('');
  });
});
