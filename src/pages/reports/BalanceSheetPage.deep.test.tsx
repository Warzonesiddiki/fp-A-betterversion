import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BalanceSheetPage, { computeBalanceSheet } from './BalanceSheetPage';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BalanceSheetPage (deep tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    vi.spyOn(ExportEngine, 'exportToPDF').mockResolvedValue(undefined as never);
    vi.spyOn(ExportEngine, 'exportToExcel').mockResolvedValue(undefined as never);
  });

  const balancedEntries: GLEntry[] = [
    {
      id: 'e-asset',
      accountCode: '1010',
      accountName: 'Cash',
      debit: 100000,
      credit: 0,
      netChange: 100000,
      date: '2026-08-01',
      description: 'Cash deposit',
      category: 'Asset',
    },
    {
      id: 'e-liab',
      accountCode: '2010',
      accountName: 'Accounts Payable',
      debit: 0,
      credit: 40000,
      netChange: -40000,
      date: '2026-08-01',
      description: 'Vendor payable',
      category: 'Liability',
    },
    {
      id: 'e-eq',
      accountCode: '3010',
      accountName: 'Common Stock',
      debit: 0,
      credit: 60000,
      netChange: -60000,
      date: '2026-08-01',
      description: 'Founder Equity',
      category: 'Equity',
    },
  ];

  describe('computeBalanceSheet unit tests', () => {
    it('accurately computes assets, liabilities, equity, and balanced status', () => {
      const res = computeBalanceSheet(balancedEntries, '2026-08-01');
      expect(res.totalAssets).toBe(100000);
      expect(res.totalLiabilities).toBe(40000);
      expect(res.totalEquity).toBe(60000);
      expect(res.isBalanced).toBe(true);
      expect(res.diff).toBe(0);
      expect(res.entryCount).toBe(3);
    });

    it('identifies imbalance when entries do not equate', () => {
      const imbalanced = [balancedEntries[0]!]; // Only $100k asset
      const res = computeBalanceSheet(imbalanced);
      expect(res.isBalanced).toBe(false);
      expect(res.diff).toBe(100000);
    });
  });

  it('renders empty state when no entries exist and navigates on click', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <BalanceSheetPage />
      </BrowserRouter>
    );

    expect(screen.getByText('No Data')).toBeInTheDocument();
    const importBtn = screen.getByRole('button', { name: 'Import Data' });
    await user.click(importBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/data/gl-upload');
  });

  it('renders balanced report statement with assets, liabilities, and equity', () => {
    useGLStore.setState({ entries: balancedEntries });

    render(
      <BrowserRouter>
        <BalanceSheetPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Balance Sheet is Balanced')).toBeInTheDocument();
    expect(screen.getAllByText('$100,000')).toHaveLength(2); // Assets and Liabilities + Equity
    expect(screen.getByText('$40,000')).toBeInTheDocument(); // Liabilities
    // Posted capital row and the Equity total: with no P&L activity they agree.
    expect(screen.getAllByText('$60,000')).toHaveLength(2);
    // Nothing is sitting in the open P&L accounts, so the earnings row is blank.
    expect(
      screen.getByText('Current-period earnings (open P&L accounts)').parentElement?.textContent
    ).toContain('—');
  });

  it('closes current-period earnings into equity so traded books balance', () => {
    // Sum of debits equals sum of credits, so Assets − Liabilities − PostedEquity
    // is exactly net income. Rolling up prefix 3 alone reported "Off by $5,000"
    // on this perfectly balanced ledger.
    const traded: GLEntry[] = [
      {
        id: 't-cash',
        accountCode: '1010',
        accountName: 'Cash',
        debit: 5000,
        credit: 0,
        netChange: 5000,
        date: '2026-08-01',
        description: 'Customer receipt',
        category: 'Asset',
      } as unknown as GLEntry,
      {
        id: 't-rev',
        accountCode: '4010',
        accountName: 'Product Revenue',
        debit: 0,
        credit: 5000,
        netChange: -5000,
        date: '2026-08-01',
        description: 'Invoice',
        category: 'Revenue',
      } as unknown as GLEntry,
    ];
    useGLStore.setState({ entries: traded });

    render(
      <BrowserRouter>
        <BalanceSheetPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Balance Sheet is Balanced')).toBeInTheDocument();
    expect(screen.queryByText(/Off by/i)).not.toBeInTheDocument();
    // Assets, current-period earnings, Equity total and Liabilities + Equity.
    expect(screen.getAllByText('$5,000')).toHaveLength(4);
  });

  it('reports unmapped account codes instead of dropping them', () => {
    useGLStore.setState({
      entries: [
        balancedEntries[0]!,
        {
          id: 'e-unmapped',
          accountCode: '9900',
          accountName: 'Suspense',
          debit: 250,
          credit: 0,
          netChange: 250,
          date: '2026-08-01',
          description: 'Unmapped',
          category: 'Other',
        } as unknown as GLEntry,
      ],
    });

    render(
      <BrowserRouter>
        <BalanceSheetPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('note').textContent).toMatch(/1 entries carry an account code outside/);
  });

  it('displays imbalance status when books are off', () => {
    useGLStore.setState({ entries: [balancedEntries[0]!] });

    render(
      <BrowserRouter>
        <BalanceSheetPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Off by \$100,000/i)).toBeInTheDocument();
  });

  it('triggers PDF and Excel export handlers', async () => {
    const user = userEvent.setup();
    useGLStore.setState({ entries: balancedEntries });

    render(
      <BrowserRouter>
        <BalanceSheetPage />
      </BrowserRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: 'Export PDF' });
    await user.click(pdfBtn);
    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);

    const excelBtn = screen.getByRole('button', { name: 'Export Excel' });
    await user.click(excelBtn);
    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
  });
});
