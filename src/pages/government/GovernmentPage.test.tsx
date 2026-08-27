import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import GovernmentPage from '@/pages/government/GovernmentPage';
import { useGLStore } from '@/store/glStore';
import { useGovernmentStore } from '@/store/governmentStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockEntries: GLEntry[] = [
  {
    id: 'entry-1',
    accountId: 'acc-5100',
    accountCode: '5100',
    accountName: 'General Fund Appropriations',
    debit: 500000,
    credit: 0,
    netChange: 500000,
    amount: 500000,
    departmentId: 'dept-public-safety',
    date: '2026-01-01',
    period: '2026-01',
  },
  {
    id: 'entry-2',
    accountId: 'acc-4100',
    accountCode: '4100',
    accountName: 'Disbursed Program Expenditures',
    debit: 0,
    credit: 350000,
    netChange: -350000,
    amount: -350000,
    departmentId: 'dept-transportation',
    date: '2026-01-15',
    period: '2026-01',
  },
];

describe('GovernmentPage (store-wired & exports)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useGovernmentStore.setState({
      funds: [],
      compliance: [],
      budgetLines: [],
    });
  });

  it('renders empty state when GL entries are empty', () => {
    render(
      <MemoryRouter>
        <GovernmentPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No Government Data')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /import gl data to view government budget tracking/i })
    ).toBeInTheDocument();
  });

  it('renders government KPIs from GL store and governmentStore', () => {
    useGLStore.setState({ entries: mockEntries });
    useGovernmentStore.setState({
      funds: [
        {
          id: 'fund-1',
          fund: 'Capital Infrastructure Fund',
          department: 'Public Works',
          allocated: 1200000,
          utilized: 850000,
          status: 'On Track',
        },
      ],
      compliance: [
        {
          id: 'comp-1',
          regulation: 'GASB 34 Asset Reporting',
          agency: 'State Audit Bureau',
          nextAudit: '2026-11-01',
          status: 'Compliant',
        },
      ],
      budgetLines: [{ category: 'Emergency Response', budgeted: 600000, actual: 480000 }],
    });

    render(
      <MemoryRouter>
        <GovernmentPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Government')).toBeInTheDocument();
    expect(screen.getByText('2 entries imported')).toBeInTheDocument();

    // Top KPIs
    expect(screen.getByText('Total Budget')).toBeInTheDocument();
    expect(screen.getByText('Expenditures')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Utilization')).toBeInTheDocument();
    // 350000 / 500000 = 70%
    expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);

    // Fund & Compliance KPIs
    expect(screen.getByText('Monitored Funds')).toBeInTheDocument();
    expect(screen.getByText('Compliance Items')).toBeInTheDocument();
    expect(screen.getByText('Budget Programs')).toBeInTheDocument();
    expect(screen.getByText('Execution Ratio')).toBeInTheDocument();

    // Account Breakdown
    expect(screen.getByText('Account Breakdown')).toBeInTheDocument();
    expect(screen.getByText('General Fund Appropriations')).toBeInTheDocument();
    expect(screen.getByText('Disbursed Program Expenditures')).toBeInTheDocument();
  });

  it('exports a PDF report with government budget KPIs and disclosures', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <GovernmentPage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /export pdf report/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]!;
    expect(config?.title).toBe('Government_Budget_Execution');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  it('exports an Excel workbook with budget execution and GL accounts', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <GovernmentPage />
      </MemoryRouter>
    );

    const excelBtn = screen.getByRole('button', { name: /export excel workbook/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    expect(config?.title).toBe('Government_Budget_Review');
    expect(data.rows.length).toBeGreaterThan(0);
  });
});
