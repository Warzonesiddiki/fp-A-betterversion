import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// Lane R34 (W-A11Y-002 M5): hoisted-mutable store ref so specs can drive the
// page into its loading branch without re-importing modules.
const glState = vi.hoisted(() => ({
  value: {
    entries: [] as unknown[],
    accounts: [] as unknown[],
    trialBalance: [] as unknown[],
    accountAnalysis: null as unknown,
    columnMappings: [] as unknown[],
    isLoading: false,
    importResult: null as unknown,
    importError: null as string | null,
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    ...glState.value,
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

// W-A11Y-002 M5 announce-once (lane R34): the hoisted-mutable glStore ref
// drives the hydrate gate; the skeleton must own exactly ONE polite status
// announcement with all bars aria-hidden.
describe('ProfitLossPage — loading branch announce-once', () => {
  beforeEach(() => {
    glState.value.isLoading = false;
  });

  it('loading skeleton announces exactly once via srLabel, bars decorative', () => {
    // Branch order on this page: importError → hydrate skeleton
    // (isLoading || populated-but-underivable) → entries-empty ("No Data").
    // Seeding an entry keeps this spec robust to either gate ordering.
    glState.value.entries = [
      { id: 'pl-1', accountCode: '4000', debit: 0, credit: 100, period: '2026-01' },
    ];
    glState.value.isLoading = true;
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true');
    expect(statuses[0]).toHaveTextContent('Loading profit & loss…');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
