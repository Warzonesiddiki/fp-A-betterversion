import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
    Repeat: makeIcon(),
    ArrowRight: makeIcon(),
    TrendingUp: makeIcon(),
    TrendingDown: makeIcon(),
  };
});

import TranslationResultPage from '@/pages/currency/TranslationResultPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/currency/translation']}>
      <TranslationResultPage />
    </MemoryRouter>
  );
}

describe('TranslationResultPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays empty state when no data', () => {
    renderPage();
    expect(screen.getByText(/No Data to Translate/)).toBeTruthy();
  });
});
