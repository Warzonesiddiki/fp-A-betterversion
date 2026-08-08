import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsurancePage from '../../insurance/InsurancePage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [] }),
}));

vi.mock('@/store/insuranceStore', () => ({
  useInsuranceStore: () => ({ lossPicks: [] }),
}));

vi.mock('lucide-react', () => ({
  Shield: () => <svg data-testid="shield-icon" />,
  DollarSign: () => <svg />,
  Layers: () => <svg />,
  TrendingUp: () => <svg />,
}));

describe('InsurancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with no GL data', () => {
    render(<InsurancePage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('No Insurance Data')).toBeInTheDocument();
  });
});
