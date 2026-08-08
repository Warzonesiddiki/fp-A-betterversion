import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TechnologyDashboardPage from '../../sector/TechnologyDashboardPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [] }),
}));

vi.mock('lucide-react', () => ({
  Cpu: () => <svg data-testid="cpu-icon" />,
}));

describe('TechnologyDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with no GL data', () => {
    render(<TechnologyDashboardPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Technology — No Data')).toBeInTheDocument();
  });
});
