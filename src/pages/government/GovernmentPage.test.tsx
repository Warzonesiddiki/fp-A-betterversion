import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (n: number) => `$${n}`,
  formatNumber: (n: number) => `${n}`,
  formatCompactNumber: (n: number) => `$${n}`,
  formatPercent: (n: number) => `${n}%`,
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Landmark: makeIcon(),
    FileText: makeIcon(),
    Users: makeIcon(),
    DollarSign: makeIcon(),
  };
});

import GovernmentPage from '@/pages/government/GovernmentPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/government']}>
      <GovernmentPage />
    </MemoryRouter>
  );
}

describe('GovernmentPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No Government Data/i)).toBeTruthy();
  });
});
