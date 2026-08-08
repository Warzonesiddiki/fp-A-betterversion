import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgricultureDashboardPage from '../../sector/AgricultureDashboardPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [] }),
}));

vi.mock('lucide-react', () => ({
  Wheat: () => <svg data-testid="wheat-icon" />,
}));

describe('AgricultureDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with no GL data', () => {
    render(<AgricultureDashboardPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Agriculture — No Data')).toBeInTheDocument();
  });
});
