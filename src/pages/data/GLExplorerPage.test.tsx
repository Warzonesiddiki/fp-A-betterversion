import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// The mock must behave like zustand's selector hook: the page reads
// `quarantinedEntries` through a selector (LedgerQuarantineNotice), and a mock
// that ignores the selector hands a selector a whole state object.
vi.mock('@/store/glStore', () => {
  const state = { entries: [], accounts: [], quarantinedEntries: [] };
  return {
    useGLStore: vi.fn((selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state
    ),
  };
});

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return { Database: makeIcon(), Search: makeIcon(), Filter: makeIcon() };
});

import GLExplorerPage from '@/pages/data/GLExplorerPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/gl-explorer']}>
      <GLExplorerPage />
    </MemoryRouter>
  );
}

describe('GLExplorerPage smoke test', () => {
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
  it('displays empty state', () => {
    renderPage();
    expect(screen.getByText('No GL Data')).toBeTruthy();
  });
});
