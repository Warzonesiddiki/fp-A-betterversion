import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HospitalityDashboardPage from '../../sector/HospitalityDashboardPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [] }),
}));

vi.mock('lucide-react', () => ({
  Hotel: () => <svg data-testid="hotel-icon" />,
}));

describe('HospitalityDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with no GL data', () => {
    render(<HospitalityDashboardPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Hospitality — No Data')).toBeInTheDocument();
  });
});
