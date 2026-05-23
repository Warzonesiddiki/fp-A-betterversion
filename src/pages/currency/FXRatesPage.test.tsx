import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/MultiCurrencyEngine', () => ({
  MultiCurrencyEngine: { calculateCrossRate: vi.fn(() => 1.1) },
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return { Plus: makeIcon(), Trash2: makeIcon(), RefreshCw: makeIcon(), AlertCircle: makeIcon() };
});

import FXRatesPage from '@/pages/currency/FXRatesPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/currency/fx-rates']}>
      <FXRatesPage />
    </MemoryRouter>
  );
}

describe('FXRatesPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays empty state when no entries', () => {
    renderPage();
    expect(screen.getByText('No Data')).toBeTruthy();
  });
});
