import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], accounts: [], trialBalance: [] })),
}));

import GLReportingPage from '@/pages/data/GLReportingPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/gl-reporting']}>
      <GLReportingPage />
    </MemoryRouter>
  );
}

describe('GLReportingPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays empty state when no data', () => {
    renderPage();
    expect(screen.getByText('No GL Data')).toBeTruthy();
  });
});
