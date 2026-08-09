import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { BudgetApproval } from './BudgetApproval';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BudgetApproval (deep tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders empty state and navigates to upload on button click and keyboard interaction', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <BudgetApproval />
      </BrowserRouter>
    );

    expect(screen.getByRole('main', { name: 'Budget Approval - No Data' })).toBeInTheDocument();
    expect(screen.getByText('No Budget Approval Data')).toBeInTheDocument();

    const importBtn = screen.getByRole('button', {
      name: 'Import GL data to view budget approvals',
    });

    await user.click(importBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/data/gl-upload');

    // Keydown Enter / Space
    mockNavigate.mockClear();
    fireEvent.keyDown(importBtn, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/data/gl-upload');

    mockNavigate.mockClear();
    fireEvent.keyDown(importBtn, { key: ' ' });
    expect(mockNavigate).toHaveBeenCalledWith('/data/gl-upload');
  });

  it('renders KPI metrics and DataTable when GL entries are present', () => {
    const mockEntries: GLEntry[] = [
      {
        id: 'entry-1',
        accountCode: '4000',
        accountName: 'Revenue',
        debit: 0,
        credit: 150000,
        netChange: 150000,
        date: '2026-08-01',
        description: 'Sales Revenue',
        category: 'Revenue',
      },
      {
        id: 'entry-2',
        accountCode: '5000',
        accountName: 'COGS',
        debit: 60000,
        credit: 0,
        netChange: -60000,
        date: '2026-08-01',
        description: 'Direct Materials',
        category: 'Expense',
      },
      {
        id: 'entry-3',
        accountCode: '4000',
        accountName: 'Revenue',
        debit: 0,
        credit: 50000,
        netChange: 50000,
        date: '2026-08-02',
        description: 'Consulting Revenue',
        category: 'Revenue',
      },
    ];

    useGLStore.setState({ entries: mockEntries });

    render(
      <BrowserRouter>
        <BudgetApproval />
      </BrowserRouter>
    );

    expect(screen.getByRole('main', { name: 'Budget Approval Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Budget Approval')).toBeInTheDocument();
    expect(screen.getByText('3 entries imported')).toBeInTheDocument();

    // Check KPI Values
    expect(screen.getByText('Total Entries')).toBeInTheDocument();
    expect(screen.getByText('Budget Amount')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Net Variance')).toBeInTheDocument();

    // Check Table Rows for aggregated accounts
    expect(screen.getByText('4000')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('COGS')).toBeInTheDocument();
  });
});
