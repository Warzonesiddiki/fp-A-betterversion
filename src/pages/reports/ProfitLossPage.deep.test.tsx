import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProfitLossPage, { computeProfitLoss } from './ProfitLossPage';
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

describe('ProfitLossPage (deep tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    vi.spyOn(ExportEngine, 'exportToPDF').mockResolvedValue(undefined as never);
    vi.spyOn(ExportEngine, 'exportToExcel').mockResolvedValue(undefined as never);
  });

  const mockEntries: GLEntry[] = [
    {
      id: 'e-rev-1',
      accountCode: '4010',
      accountName: 'Subscription Revenue',
      debit: 0,
      credit: 100000,
      netChange: 100000,
      date: '2026-08-01',
      description: 'Q3 Enterprise',
      category: 'Revenue',
    },
    {
      id: 'e-cogs-1',
      accountCode: '5010',
      accountName: 'Hosting COGS',
      debit: 30000,
      credit: 0,
      netChange: -30000,
      date: '2026-08-05',
      description: 'Cloud Infrastructure',
      category: 'Expense',
    },
    {
      id: 'e-opex-1',
      accountCode: '6010',
      accountName: 'Marketing Expense',
      debit: 20000,
      credit: 0,
      netChange: -20000,
      date: '2026-08-10',
      description: 'Ad Spend',
      category: 'Expense',
    },
  ];

  describe('computeProfitLoss unit checks', () => {
    it('computes exact revenue, cogs, margins and net income', () => {
      const res = computeProfitLoss(mockEntries, '2026-08');
      expect(res.totalRevenue).toBe(100000);
      expect(res.totalCOGS).toBe(30000);
      expect(res.grossProfit).toBe(70000);
      expect(res.totalExpenses).toBe(20000);
      expect(res.netIncome).toBe(50000);
      expect(res.grossMargin).toBe(70);
      expect(res.netMargin).toBe(50);
      expect(res.entryCount).toBe(3);
    });

    it('returns zero margins when revenue is 0', () => {
      const res = computeProfitLoss([], '2026-08');
      expect(res.grossMargin).toBe(0);
      expect(res.netMargin).toBe(0);
    });
  });

  it('renders empty state when no GL entries exist and navigates to upload', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <ProfitLossPage />
      </BrowserRouter>
    );

    expect(screen.getByText('No Data')).toBeInTheDocument();
    const importBtn = screen.getByRole('button', { name: 'Import Data' });
    await user.click(importBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/data/gl-upload');
  });

  it('renders statement table with computed amounts and margins', () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <BrowserRouter>
        <ProfitLossPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Profit & Loss Statement')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('Cost of Goods Sold')).toBeInTheDocument();
    expect(screen.getByText('$30,000')).toBeInTheDocument();
    expect(screen.getByText('Gross Profit')).toBeInTheDocument();
    expect(screen.getByText('$70,000')).toBeInTheDocument();
    expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
    expect(screen.getByText('$20,000')).toBeInTheDocument();
    expect(screen.getByText('Net Income')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('filters entries when period input changes', () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <BrowserRouter>
        <ProfitLossPage />
      </BrowserRouter>
    );

    const periodInput = screen.getByLabelText('Select report period');
    act(() => {
      fireEvent.change(periodInput, { target: { value: '2026-07' } });
    });

    expect(screen.getByText(/0 entries/i)).toBeInTheDocument();
  });

  it('triggers PDF and Excel exports on action clicks', async () => {
    const user = userEvent.setup();
    useGLStore.setState({ entries: mockEntries });

    render(
      <BrowserRouter>
        <ProfitLossPage />
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
