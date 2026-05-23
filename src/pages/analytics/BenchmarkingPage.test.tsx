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
    BarChart3: makeIcon(),
  };
});

import BenchmarkingPage from '@/pages/analytics/BenchmarkingPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/analytics/benchmarking']}>
      <Routes>
        <Route path="/analytics/benchmarking" element={<BenchmarkingPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BenchmarkingPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });

  it('displays the no data empty state when entries are empty', () => {
    renderPage();
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
  });

  it('displays the import data button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
  });
});
