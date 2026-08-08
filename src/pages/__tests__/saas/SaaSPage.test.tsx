import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SaaSPage from '../../saas/SaaSPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [] }),
}));

vi.mock('lucide-react', () => ({
  Cloud: () => <svg data-testid="cloud-icon" />,
  DollarSign: () => <svg />,
  Layers: () => <svg />,
  TrendingUp: () => <svg />,
}));

describe('SaaSPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with no GL data', () => {
    render(<SaaSPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('No SaaS Data')).toBeInTheDocument();
  });
});
