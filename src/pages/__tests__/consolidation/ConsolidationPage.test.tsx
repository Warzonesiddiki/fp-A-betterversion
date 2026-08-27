import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConsolidationPage } from '@/pages/consolidation/ConsolidationPage';
import { useGLStore } from '@/store/glStore';
import { useEntityStore } from '@/store/entityStore';
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
    id: 'ent-1',
    accountId: 'acc-4000',
    accountCode: '4000',
    accountName: 'Parent Operating Revenue',
    period: '2025-01',
    periodName: 'Jan 2025',
    debit: 0,
    credit: 250000,
    netChange: 250000,
    date: '2025-01-15',
    amount: 250000,
    description: 'Direct Parent Revenue',
    reference: 'REF-001',
    entityId: 'ent-parent',
  },
  {
    id: 'ent-2',
    accountId: 'acc-5000',
    accountCode: '5000',
    accountName: 'Parent Cost of Goods Sold',
    period: '2025-01',
    periodName: 'Jan 2025',
    debit: 100000,
    credit: 0,
    netChange: -100000,
    date: '2025-01-18',
    amount: -100000,
    description: 'Parent Direct Costs',
    reference: 'REF-002',
    entityId: 'ent-parent',
  },
  {
    id: 'ent-3',
    accountId: 'acc-4000',
    accountCode: '4000',
    accountName: 'Subsidiary Revenue',
    period: '2025-01',
    periodName: 'Jan 2025',
    debit: 0,
    credit: 120000,
    netChange: 120000,
    date: '2025-01-20',
    amount: 120000,
    description: 'Subsidiary Revenue',
    reference: 'REF-003',
    entityId: 'ent-sub',
  },
  {
    id: 'ent-4',
    accountId: 'acc-6000',
    accountCode: '6000',
    accountName: 'Subsidiary Operating Expenses',
    period: '2025-01',
    periodName: 'Jan 2025',
    debit: 50000,
    credit: 0,
    netChange: -50000,
    date: '2025-01-22',
    amount: -50000,
    description: 'Subsidiary Operating Costs',
    reference: 'REF-004',
    entityId: 'ent-sub',
  },
];

describe('ConsolidationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
    useEntityStore.setState({
      entities: [
        {
          id: 'ent-parent',
          name: 'Parent Holdings Corp',
          code: 'PARENT',
          currency: 'USD',
          country: 'US',
          isParent: true,
          parentId: null,
        },
        {
          id: 'ent-sub',
          name: 'Operating Subsidiary',
          code: 'SUB1',
          currency: 'USD',
          country: 'US',
          isParent: false,
          parentId: 'ent-parent',
        },
      ],
    });
  });

  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <ConsolidationPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(
      <MemoryRouter>
        <ConsolidationPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No Consolidation Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to view consolidation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL data/i })).toBeInTheDocument();
  });

  it('renders consolidation KPIs and worksheet when GL entries are loaded', () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <ConsolidationPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Group Financial Consolidation/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/4 entries/i)).toBeInTheDocument();
    expect(screen.getByText(/2 entities/i)).toBeInTheDocument();
    expect(screen.getByText(/Consolidated Accounts Overview/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ASC 810 \/ IFRS 10 Consolidation Basis Disclosures/i)
    ).toBeInTheDocument();
  });

  it('exports a PDF report with consolidated account data', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <ConsolidationPage />
      </MemoryRouter>
    );

    const pdfBtn = screen.getByRole('button', { name: /export pdf report/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]!;
    expect(config?.title).toBe('Consolidated_Financial_Report');
    expect(data.rows.length).toBeGreaterThan(0);
  });

  it('exports an Excel workbook with consolidated account data', async () => {
    useGLStore.setState({ entries: mockEntries });

    render(
      <MemoryRouter>
        <ConsolidationPage />
      </MemoryRouter>
    );

    const excelBtn = screen.getByRole('button', { name: /export excel workbook/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    });

    const [data, config] = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    expect(config?.title).toBe('Consolidated_Financial_Worksheet');
    expect(data.rows.length).toBeGreaterThan(0);
  });
});
