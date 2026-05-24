import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="mock-icon" />,
  Clock: () => <span data-testid="mock-icon" />,
  AlertTriangle: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
}));

import { render, screen } from '@/test/testUtils';
import { BudgetApproval } from '@/pages/budgets/BudgetApproval';

describe('BudgetApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<BudgetApproval />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<BudgetApproval />);
    expect(screen.getByText(/No Budget Approval Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to view budget approvals/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL data/i })).toBeInTheDocument();
  });
});
