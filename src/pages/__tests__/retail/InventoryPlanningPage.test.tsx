import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// W-FAB remediation pins. This page previously rendered invented department
// economics ($3.2M Apparel / $4.8M Electronics … with turnover and margin
// strings), two invented SKUs ('SKU-4401' Denim Jacket / 'SKU-2180' Wireless
// Earbuds) with an 'Optimal'/'Overstock' status, fabricated KPI deltas and
// sparklines, and a hardcoded stockouts series (4 per month). The GL-derived
// KPIs remain; SKU/category views now come from user-recorded products only.
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));
vi.mock('@/store/retailStore', () => ({
  useRetailStore: vi.fn(() => ({ stores: [], inventory: [], products: [] })),
}));
vi.mock('@/engines/InventoryEngine', () => ({
  InventoryEngine: {
    analyze: vi.fn(() => ({})),
    calculateGLInventoryStats: vi.fn(() => ({
      totalValue: 0,
      turnover: 0,
      daysOnHand: 0,
      outOfStockCount: 0,
      stockouts: 4, // placeholder in the real engine; must NOT be displayed
    })),
  },
}));
vi.mock('lucide-react', () => ({
  Package: () => <span data-testid="mock-icon" />,
  BarChart3: () => <span data-testid="mock-icon" />,
  Download: () => <span data-testid="mock-icon" />,
  Truck: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  // PeriodPicker / EmptyState chain (rendered by the remediated page).
  Calendar: () => <span data-testid="mock-icon" />,
  ChevronDown: () => <span data-testid="mock-icon" />,
  ChevronUp: () => <span data-testid="mock-icon" />,
  Check: () => <span data-testid="mock-icon" />,
  Inbox: () => <span data-testid="mock-icon" />,
  Search: () => <span data-testid="mock-icon" />,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  ComposedChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import { render, screen } from '@/test/testUtils';
import InventoryPlanningPage from '@/pages/retail/InventoryPlanningPage';

const glEntry = {
  id: '1',
  accountId: 'a1',
  accountCode: '1210',
  accountName: 'Inventory',
  period: '2024-01',
  periodName: 'Jan 2024',
  debit: 50000,
  credit: 0,
  netChange: 50000,
  date: '2024-01-01',
  amount: 50000,
  description: '',
  reference: '',
};

describe('InventoryPlanningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<InventoryPlanningPage />);
    expect(screen.getByText(/No Inventory Data/i)).toBeInTheDocument();
  });

  it('renders dashboard heading when entries exist', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: [glEntry] });
    render(<InventoryPlanningPage />);
    expect(screen.getByRole('heading', { name: /Inventory Planning/i })).toBeInTheDocument();
  });

  it('never renders the removed invented SKUs or department economics', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: [glEntry] });
    render(<InventoryPlanningPage />);
    for (const invented of ['Denim Jacket', 'Wireless Earbuds', 'SKU-4401', 'SKU-2180']) {
      expect(screen.queryByText(invented)).toBeNull();
    }
    for (const dept of ['Apparel', 'Electronics', 'Home Goods', 'Food & Bev', 'Beauty']) {
      expect(screen.queryByText(dept)).toBeNull();
    }
    // The old "Optimal"/"Overstock" statuses came from the demo dataset.
    expect(screen.queryByText('Optimal')).toBeNull();
    expect(screen.queryByText('Overstock')).toBeNull();
  });

  it('discloses stockout incidents instead of showing the engine mock value', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: [glEntry] });
    const { getByTestId, getByText } = render(<InventoryPlanningPage />);
    expect(getByText(/needs an operations\/incident feed/i)).toBeInTheDocument();
    // The three GL-derived KPIs render; the fourth cell is the disclosure.
    const grid = getByTestId('inventory-planning-kpis');
    for (const label of ['Total Inventory Value', 'Inventory Turnover', 'Days on Hand']) {
      expect(grid.textContent).toContain(label);
    }
    // "Stockout Incidents" appears ONLY as the disclosure card's title —
    // never as a numeric KPI fed by the engine's mocked value.
    expect(screen.getAllByText('Stockout Incidents')).toHaveLength(1);
    expect(getByText(/fixed placeholder\s*value of 4/i)).toBeInTheDocument();
  });

  it('shows recorded-product views only when products exist in the retail workspace', async () => {
    const { useRetailStore } = await import('@/store/retailStore');
    (useRetailStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector?: (s: unknown) => unknown) =>
        selector?.({
          stores: [],
          inventory: [],
          products: [
            {
              id: 'p1',
              name: 'Recorded Widget',
              sku: 'RW-1',
              category: 'Widgets',
              price: 20,
              cost: 12,
              stock: 5,
              reorderLevel: 10,
            },
          ],
        })
    );
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries: [glEntry] });
    render(<InventoryPlanningPage />);
    // User-recorded product renders with its derived below-reorder status…
    expect(screen.getByText('Recorded Widget')).toBeInTheDocument();
    expect(screen.getByText('Reorder')).toBeInTheDocument();
    // …and the category summary aggregates the SAME recorded data only
    // (category appears in both the summary row and the table cell).
    expect(screen.getAllByText('Widgets').length).toBe(2);
    expect(screen.getAllByText(/units on hand/i).length).toBeGreaterThan(0);
  });
});
