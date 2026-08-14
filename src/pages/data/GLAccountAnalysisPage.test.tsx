import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    accountAnalysis: null,
    isLoading: false,
    analyzeAccount: vi.fn(),
  })),
}));

import GLAccountAnalysisPage from '@/pages/data/GLAccountAnalysisPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/gl-analysis']}>
      <GLAccountAnalysisPage />
    </MemoryRouter>
  );
}

describe('GLAccountAnalysisPage smoke test', () => {
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
    expect(screen.getByText('No GL Data')).toBeTruthy();
  });
});
