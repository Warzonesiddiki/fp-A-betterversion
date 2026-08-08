import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ManufacturingPage from '../../manufacturing/ManufacturingPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [] }),
}));

vi.mock('lucide-react', () => ({
  Factory: () => <svg data-testid="factory-icon" />,
  DollarSign: () => <svg />,
  Layers: () => <svg />,
  TrendingUp: () => <svg />,
}));

describe('ManufacturingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with no GL data', () => {
    render(<ManufacturingPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('No Manufacturing Data')).toBeInTheDocument();
  });
});
