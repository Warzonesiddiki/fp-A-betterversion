import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/utils/formatters', () => ({
  formatCurrency: vi.fn((n: number) => `$${n}`),
  formatNumber: vi.fn((n: number) => `${n}`),
  formatCompactNumber: vi.fn((n: number) => `${n}`),
}));

import EducationPage from '@/pages/education/EducationPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/education']}>
      <EducationPage />
    </MemoryRouter>
  );
}

describe('EducationPage smoke test', () => {
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
    expect(screen.getByText('No Education Data')).toBeTruthy();
  });
});
