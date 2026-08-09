import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import WorkingCapitalPage, { computeWorkingCapital } from './WorkingCapitalPage';
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

describe('WorkingCapitalPage (deep tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    vi.spyOn(ExportEngine, 'exportToPDF').mockResolvedValue(undefined as never);
    vi.spyOn(ExportEngine, 'exportToExcel').mockResolvedValue(undefined as never);
  });

  const mockWcEntries: GLEntry[] = [
    {
      id: 'e-ca-1',
      accountCode: '1100',
      accountName: 'Operating Cash',
      debit: 100000,
      credit: 0,
      netChange: 100000,
      date: '2026-08-01',
      description: 'Cash',
      category: 'Asset',
    },
    {
      id: 'e-ca-2',
      accountCode: '1200',
      accountName: 'Accounts Receivable',
      debit: 100000,
      credit: 0,
      netChange: 100000,
      date: '2026-08-01',
      description: 'AR',
      category: 'Asset',
    },
    {
      id: 'e-cl-1',
      accountCode: '2100',
      accountName: 'Accounts Payable',
      debit: 0,
      credit: 80000,
      netChange: -80000,
      date: '2026-08-01',
      description: 'AP',
      category: 'Liability',
    },
    {
      id: 'e-rev',
      accountCode: '4000',
      accountName: 'Sales',
      debit: 500000,
      credit: 0,
      netChange: 500000,
      date: '2026-08-01',
      description: 'Revenue',
      category: 'Revenue',
    },
    {
      id: 'e-cogs',
      accountCode: '5000',
      accountName: 'Direct Cost',
      debit: 300000,
      credit: 0,
      netChange: -300000,
      date: '2026-08-01',
      description: 'COGS',
      category: 'Expense',
    },
  ];

  describe('computeWorkingCapital calculation helper', () => {
    it('accurately computes assets, liabilities, ratios, and cycle days', () => {
      const summary = computeWorkingCapital(mockWcEntries);
      expect(summary.assets).toBe(200000);
      expect(summary.liabilities).toBe(80000);
      expect(summary.wc).toBe(120000);
      expect(summary.currentRatio).toBe(2.5);
      expect(summary.quickRatio).toBe(1.75);
      expect(summary.components).toHaveLength(7);
      expect(summary.ccc).toBe(summary.dso + summary.dio - summary.dpo);
    });

    it('returns zero ratios when liabilities are zero', () => {
      const summary = computeWorkingCapital([mockWcEntries[0]!]);
      expect(summary.currentRatio).toBe(0);
      expect(summary.quickRatio).toBe(0);
    });
  });

  it('renders empty state when no GL data exists and handles import navigation', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <WorkingCapitalPage />
      </BrowserRouter>
    );

    expect(screen.getByText('No Data')).toBeInTheDocument();
    const importBtn = screen.getByRole('button', { name: 'Import Data' });
    await user.click(importBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/data/gl-upload');
  });

  it('renders KPI metrics, cycle cards, chart, and component table', () => {
    useGLStore.setState({ entries: mockWcEntries });

    render(
      <BrowserRouter>
        <WorkingCapitalPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Working Capital' })).toBeInTheDocument();
    expect(screen.getByText('Current Ratio')).toBeInTheDocument();
    expect(screen.getByText('Quick Ratio')).toBeInTheDocument();
    expect(screen.getByText('Cash Conversion Cycle')).toBeInTheDocument();

    // Days cards
    expect(screen.getByText('DSO')).toBeInTheDocument();
    expect(screen.getByText('DIO')).toBeInTheDocument();
    expect(screen.getByText('DPO')).toBeInTheDocument();
    expect(screen.getByText('CCC')).toBeInTheDocument();

    // Table components
    expect(screen.getByText('Cash & Equivalents')).toBeInTheDocument();
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
  });

  it('triggers PDF and Excel export handlers', async () => {
    const user = userEvent.setup();
    useGLStore.setState({ entries: mockWcEntries });

    render(
      <BrowserRouter>
        <WorkingCapitalPage />
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
