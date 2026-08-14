import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/entityStore', () => ({
  useEntityStore: vi.fn((selector: any) => {
    const state = { entities: [], isLoading: false };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn((selector: any) => {
    const state = { entries: [] };
    return selector ? selector(state) : state;
  }),
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
    GitCompare: makeIcon(),
    CheckCircle2: makeIcon(),
    AlertCircle: makeIcon(),
    Wand2: makeIcon(),
    Building2: makeIcon(),
  };
});

import ICEliminationPage from '@/pages/consolidation/ICEliminationPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/consolidation/ic-elimination']}>
      <ICEliminationPage />
    </MemoryRouter>
  );
}

describe('ICEliminationPage smoke test', () => {
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
  it('displays Intercompany Elimination heading', () => {
    renderPage();
    expect(screen.getByText('Intercompany Elimination')).toBeTruthy();
  });
});
