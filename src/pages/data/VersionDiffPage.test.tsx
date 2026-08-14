import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn((selector: any) => {
    const state = { entries: [] };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn((selector: any) => {
    const state = { lineItems: [] };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/engines/VersionControlEngine', () => {
  class MockVersionControlEngine {
    createBranch = vi.fn(() => ({ id: 'b1', name: 'main' }));
    commit = vi.fn();
    diff = vi.fn(() => ({ changes: [] }));
    listBranches = vi.fn(() => [{ id: 'b1', name: 'main' }]);
    getBranch = vi.fn(() => ({ id: 'b1', name: 'main' }));
    getBranchCommits = vi.fn(() => []);
  }
  return { VersionControlEngine: MockVersionControlEngine };
});

vi.mock('@/components/ui/VersionDiffViewer', () => ({
  VersionDiffViewer: () => <div data-testid="version-diff-viewer" />,
}));

import VersionDiffPage from '@/pages/data/VersionDiffPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/version-diff']}>
      <VersionDiffPage />
    </MemoryRouter>
  );
}

describe('VersionDiffPage smoke test', () => {
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
  it('displays empty state when no data', () => {
    renderPage();
    expect(screen.getByText('No Data to Compare')).toBeTruthy();
  });
});
