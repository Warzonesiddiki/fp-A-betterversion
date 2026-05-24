import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  Calendar: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
}));

import { render, screen } from '@/test/testUtils';
import { BankStatements } from '@/pages/banking/BankStatements';

describe('BankStatements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<BankStatements />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<BankStatements />);
    expect(screen.getByText(/No Bank Statement Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to view bank statements/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL data/i })).toBeInTheDocument();
  });
});
