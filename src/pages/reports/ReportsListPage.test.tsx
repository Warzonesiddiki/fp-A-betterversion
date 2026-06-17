/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

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
    FileText: makeIcon(),
    BarChart3: makeIcon(),
    DollarSign: makeIcon(),
    TrendingUp: makeIcon(),
    Layers: makeIcon(),
    Search: makeIcon(),
    Download: makeIcon(),
    Scale: makeIcon(),
  };
});

import ReportsListPage from '@/pages/reports/ReportsListPage';

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ReportsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage(ReportsListPage, '/reports', '/reports');
    expect(container).toBeTruthy();
  });

  it('displays the empty state when no GL entries exist', () => {
    renderPage(ReportsListPage, '/reports', '/reports');
    expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
  });
});
