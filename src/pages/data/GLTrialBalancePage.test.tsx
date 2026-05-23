import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    trialBalance: [],
    isLoading: false,
    generateTrialBalance: vi.fn(),
  })),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return { Scale: makeIcon(), RefreshCw: makeIcon(), Download: makeIcon() };
});

import GLTrialBalancePage from '@/pages/data/GLTrialBalancePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/trial-balance']}>
      <GLTrialBalancePage />
    </MemoryRouter>
  );
}

describe('GLTrialBalancePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays Trial Balance heading', () => {
    renderPage();
    const heading = screen.queryByText(/Trial Balance/i);
    expect(heading).toBeTruthy();
  });
});
