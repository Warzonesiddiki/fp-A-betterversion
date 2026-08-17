import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  LineChart: () => <div data-testid="line-chart" />,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('@/components/charts/WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

vi.mock(import('lucide-react'), async (importOriginal) => {
  const actual = await importOriginal();
  const Icon = (props: Record<string, unknown>) => <span data-testid="mock-icon" {...props} />;
  Icon.displayName = 'MockIcon';
  return {
    ...actual,
    default: Icon,
    Landmark: Icon,
    Download: Icon,
    FileText: Icon,
    Table: Icon,
    Percent: Icon,
    DollarSign: Icon,
    TrendingUp: Icon,
    ChevronUp: Icon,
    ChevronDown: Icon,
    Receipt: Icon,
    Calculator: Icon,
    Info: Icon,
    TrendingDown: Icon,
    FileSpreadsheet: Icon,
  };
});

import TaxProvisionPage from '@/pages/tax/TaxProvisionPage';

describe('TaxProvisionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<TaxProvisionPage />);
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
  });

  it('renders heading', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        {
          id: '1',
          accountCode: '4000',
          accountName: 'Revenue',
          debit: 0,
          credit: 1000,
          netChange: -1000,
          amount: -1000,
          period: '2026-01',
          date: '2026-01-15',
        },
      ],
    });
    render(<TaxProvisionPage />);
    expect(screen.getAllByText(/tax provision/i).length).toBeGreaterThan(0);
  });

  /**
   * Renders a genuinely balanced ledger and asserts the figures that reach
   * the screen. The previous page invented Federal/CA/NY/International
   * provisions from hardcoded rates and missed COGS, so pretax showed $750
   * for this ledger instead of $350.
   */
  it('displays book tax that matches the underlying ledger', async () => {
    const { useGLStore } = await import('@/store/glStore');
    let n = 0;
    const e = (accountCode: string, debit: number, credit: number) => ({
      id: `e${(n += 1)}`,
      accountCode,
      accountName: accountCode,
      debit,
      credit,
      netChange: debit - credit,
      amount: debit - credit,
      period: '2026-01',
      date: '2026-01-15',
    });

    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [
        e('1000', 500, 0),
        e('3000', 0, 500),
        e('1000', 1000, 0),
        e('4000', 0, 1000),
        e('5000', 400, 0),
        e('1000', 0, 400),
        e('6000', 250, 0),
        e('1000', 0, 250),
        e('8000', 70, 0),
        e('1000', 0, 70),
      ],
    });

    render(<TaxProvisionPage />);

    const body = document.body.textContent ?? '';

    expect(body).toContain('$1,000'); // Revenue
    expect(body).toContain('$400'); // COGS
    expect(body).toContain('$350'); // Pretax (was $750 — COGS ignored)
    expect(body).toContain('$70'); // Posted tax
    expect(body).toContain('$280'); // Net income
    expect(body).toContain('20.0%'); // ETR = 70/350

    // Invented jurisdiction rows and statutory rates must not reappear.
    expect(body).not.toMatch(/State \(CA\)/);
    expect(body).not.toMatch(/State \(NY\)/);
    expect(body).not.toMatch(/8\.84/);
    expect(body).not.toMatch(/12\.5%/);
  });

  it('omits tax, ETR and net income when no tax accounts are posted', async () => {
    const { useGLStore } = await import('@/store/glStore');
    let n = 0;
    const e = (accountCode: string, debit: number, credit: number) => ({
      id: `e${(n += 1)}`,
      accountCode,
      accountName: accountCode,
      debit,
      credit,
      netChange: debit - credit,
      amount: debit - credit,
      period: '2026-01',
      date: '2026-01-15',
    });

    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      entries: [e('4000', 0, 1000), e('5000', 400, 0), e('6000', 250, 0)],
    });

    render(<TaxProvisionPage />);

    const body = document.body.textContent ?? '';
    expect(body).toContain('$350');
    expect(body).toMatch(/Income tax expense/);
    expect(body).toMatch(/not derivable/i);
    // Must not invent a 21% federal provision on $350 pretax ($74 / $73.50).
    expect(body).not.toMatch(/\$74\b/);
    expect(body).not.toMatch(/\$73/);
    expect(body).not.toMatch(/21\.0%/);
  });
});
