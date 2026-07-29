import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], isLoading: false, importError: null })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ count }: { count?: number }) => <div data-testid="skeleton">{count} skeletons</div>,
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
    Scale: makeIcon(),
    FileText: makeIcon(),
    Table: makeIcon(),
    Download: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
  };
});

import BalanceSheetPage from '@/pages/reports/BalanceSheetPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reports/balance-sheet']}>
      <BalanceSheetPage />
    </MemoryRouter>
  );
}

describe('BalanceSheetPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No Data/i)).toBeTruthy();
  });
});
