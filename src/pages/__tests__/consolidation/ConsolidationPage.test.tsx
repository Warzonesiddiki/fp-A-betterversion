import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('lucide-react', () => ({
  Layers: () => <span data-testid="mock-icon" />,
  DollarSign: () => <span data-testid="mock-icon" />,
  Building: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
}));

import { render, screen } from '@/test/testUtils';
import { ConsolidationPage } from '@/pages/consolidation/ConsolidationPage';

describe('ConsolidationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ConsolidationPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<ConsolidationPage />);
    expect(screen.getByText(/No Consolidation Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to view consolidation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL data/i })).toBeInTheDocument();
  });
});
