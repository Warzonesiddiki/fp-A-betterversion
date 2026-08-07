import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/entityStore', () => ({
  useEntityStore: vi.fn((selector: any) => {
    const state = { entities: [], isLoading: false };
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
    ChevronRight: makeIcon(),
    ChevronDown: makeIcon(),
    Building2: makeIcon(),
    Globe: makeIcon(),
  };
});

import OwnershipTreePage from '@/pages/consolidation/OwnershipTreePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/consolidation/ownership']}>
      <OwnershipTreePage />
    </MemoryRouter>
  );
}

describe('OwnershipTreePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays Ownership Structure heading', () => {
    renderPage();
    expect(screen.getByText('Ownership Structure')).toBeTruthy();
  });
});
