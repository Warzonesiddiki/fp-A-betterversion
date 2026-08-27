import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));
vi.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="mock-icon" />,
  AlertTriangle: () => <span data-testid="mock-icon" />,
  Clock: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
}));

import { render, screen } from '@/test/testUtils';
import { BankReconciliation } from '@/pages/banking/BankReconciliation';

describe('BankReconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<BankReconciliation />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<BankReconciliation />);
    expect(screen.getByText(/No Bank Reconciliation Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to view bank reconciliation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL data/i })).toBeInTheDocument();
  });
});
