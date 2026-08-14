import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    columnMappings: [],
    isLoading: false,
    importResult: null,
    setEntries: vi.fn(),
    setAccounts: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
    setColumnMappings: vi.fn(),
    importData: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
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
  return {
    Target: makeIcon(),
  };
});

import GoalSeekPage from '@/pages/analytics/GoalSeekPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/analytics/goal-seek']}>
      <Routes>
        <Route path="/analytics/goal-seek" element={<GoalSeekPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GoalSeekPage smoke test', () => {
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

  it('displays the Financial Modeling heading', () => {
    renderPage();
    expect(screen.getByText(/Financial Modeling/i)).toBeInTheDocument();
  });

  it('displays the Break-Even mode button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Break-Even/i })).toBeInTheDocument();
  });

  it('displays the Calculate button for break-even mode', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Calculate/i })).toBeInTheDocument();
  });
});
