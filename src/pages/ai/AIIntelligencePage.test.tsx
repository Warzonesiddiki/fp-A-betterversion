import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/AIEngine', () => ({
  AIEngine: { init: vi.fn(), detectAnomalies: vi.fn() },
}));

import AIIntelligencePage from '@/pages/ai/AIIntelligencePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ai']}>
      <AIIntelligencePage />
    </MemoryRouter>
  );
}

describe('AIIntelligencePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays AI Intelligence Center heading', () => {
    renderPage();
    expect(screen.getByText('AI Intelligence Center')).toBeTruthy();
  });
});
