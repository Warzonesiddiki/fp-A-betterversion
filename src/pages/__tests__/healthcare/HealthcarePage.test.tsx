import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthcarePage from '../../healthcare/HealthcarePage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: (sel?: (s: any) => any) => (sel ? sel({ entries: [] }) : { entries: [] }),
}));

vi.mock('@/store/healthcareStore', () => ({
  useHealthcareStore: () => ({ programs: [] }),
}));

vi.mock('lucide-react', () => ({
  Heart: () => <svg data-testid="heart-icon" />,
  DollarSign: () => <svg />,
  Layers: () => <svg />,
  TrendingUp: () => <svg />,
}));

describe('HealthcarePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with no GL data', () => {
    render(<HealthcarePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('No Healthcare Data')).toBeInTheDocument();
  });
});
