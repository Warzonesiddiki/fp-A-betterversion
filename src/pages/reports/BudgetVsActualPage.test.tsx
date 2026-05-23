import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], isLoading: false, importError: null })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn() },
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ count }: { count?: number }) => <div data-testid="skeleton">{count} skeletons</div>,
}));

vi.mock('./components/BudgetVsActualHeader', () => ({
  BudgetVsActualHeader: () => <div data-testid="budget-vs-actual-header" />,
}));

vi.mock('./components/BudgetVsActualSummary', () => ({
  BudgetVsActualSummary: () => <div data-testid="budget-vs-actual-summary" />,
}));

vi.mock('./components/BudgetVsActualTable', () => ({
  BudgetVsActualTable: () => <div data-testid="budget-vs-actual-table" />,
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
    AlertCircle: makeIcon(), Database: makeIcon(),
    ArrowUpRight: makeIcon(), ArrowDownRight: makeIcon(), Minus: makeIcon(),
  };
});

import BudgetVsActualPage from '@/pages/reports/BudgetVsActualPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports/budget-vs-actual']}>
      <BudgetVsActualPage />
    </MemoryRouter>
  );
}

describe('BudgetVsActualPage smoke test', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No data yet/i)).toBeTruthy();
  });
});
