import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], accounts: [] })),
}));

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
    expect(container).toBeTruthy();
  });
  it('displays empty state', () => {
    renderPage();
    expect(screen.getByText('No GL Data')).toBeTruthy();
  });
});
