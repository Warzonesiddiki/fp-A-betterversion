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

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(),
    exportToExcel: vi.fn(async () => {}),
  },
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
    Download: makeIcon(),
    BarChart3: makeIcon(),
    DollarSign: makeIcon(),
    FileText: makeIcon(),
    Table: makeIcon(),
  };
});

import ProfitLossPage from '@/pages/reports/ProfitLossPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports/profit-loss']}>
      <Routes>
        <Route path="/reports/profit-loss" element={<ProfitLossPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProfitLossPage smoke test', () => {
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

  it('shows the no data state when entries are empty', () => {
    renderPage();
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
  });

  it('shows import data button when entries are empty', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
  });
});
