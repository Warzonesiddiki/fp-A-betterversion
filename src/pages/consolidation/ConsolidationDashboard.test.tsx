import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/ConsolidationEngine', () => ({
  ConsolidationEngine: { consolidate: vi.fn(() => null) },
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
    Plus: makeIcon(),
    Trash2: makeIcon(),
    Edit2: makeIcon(),
    LayoutGrid: makeIcon(),
    List: makeIcon(),
  };
});

import ConsolidationDashboard from '@/pages/consolidation/ConsolidationDashboard';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/consolidation']}>
      <ConsolidationDashboard />
    </MemoryRouter>
  );
}

describe('ConsolidationDashboard smoke test', () => {
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
  it('displays Legal Entity Consolidation heading', () => {
    renderPage();
    expect(screen.getByText('Legal Entity Consolidation')).toBeTruthy();
  });
});
