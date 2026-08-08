import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import GrantDisbursementPage from './GrantDisbursementPage';
import { useGLStore } from '@/store/glStore';
import { type GLEntry } from '@/types';

const mockEntries: GLEntry[] = [
  // Budget
  {
    id: '1',
    date: '2023-01-15',
    accountName: 'Budget Appropriation',
    accountCode: '7001',
    amount: 0,
    credit: 0,
    debit: 1000000,
    netChange: 1000000,
    description: 'Budget',
    currency: 'USD',
  },
  // Actual Spend
  {
    id: '2',
    date: '2023-01-15',
    accountName: 'Capital Outlay',
    accountCode: '8000',
    amount: 0,
    credit: 0,
    debit: 750000,
    netChange: 750000,
    description: 'Spend',
    currency: 'USD',
  },
  // Grant Allocated
  {
    id: '3',
    date: '2023-01-15',
    accountName: 'Grant Allocated',
    accountCode: '7002',
    amount: 0,
    credit: 0,
    debit: 500000,
    netChange: 500000,
    description: 'Grant All',
    currency: 'USD',
  },
  // Grant Disbursed
  {
    id: '4',
    date: '2023-01-15',
    accountName: 'Grant Disbursed',
    accountCode: '7003',
    amount: 0,
    credit: 0,
    debit: 250000,
    netChange: 250000,
    description: 'Grant Dis',
    currency: 'USD',
  },
  // Citizens
  {
    id: '5',
    date: '2023-01-15',
    accountName: 'Citizens Served',
    accountCode: '9000',
    amount: 0,
    credit: 0,
    debit: 10000,
    netChange: 10000,
    description: 'Citizens',
    currency: 'USD',
  },
  // Revenue Collected
  {
    id: '6',
    date: '2023-01-15',
    accountName: 'Tax Receipts',
    accountCode: '4000',
    amount: 0,
    credit: 900000,
    debit: 0,
    netChange: -900000,
    description: 'Rev',
    currency: 'USD',
  },
  // Revenue Forecast
  {
    id: '7',
    date: '2023-01-15',
    accountName: 'Revenue Forecast',
    accountCode: '4001',
    amount: 0,
    credit: 0,
    debit: 1000000,
    netChange: 1000000,
    description: 'Rev',
    currency: 'USD',
  },
];

describe('GrantDisbursementPage (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(
      <MemoryRouter>
        <GrantDisbursementPage />
      </MemoryRouter>
    );

    // Grant Disbursement Rate: 250k / 500k = 50%
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument();

    // Budget Utilization: 750k / 1M = 75%
    expect(screen.getByText(/75\.0%/)).toBeInTheDocument();

    // Cost Per Citizen: Total expenses = all debits = 1,000,000 + 750,000 + 500,000 + 250,000 + 10,000 + 1,000,000 = 3,510,000
    // Citizens = 10,000
    // 3,510,000 / 10,000 = 351
    expect(screen.getByText(/351\.00/)).toBeInTheDocument();

    // Revenue Collection Gap: (1M - 900k) / 1M = 10%
    expect(screen.getByText(/10\.0%/)).toBeInTheDocument();
  });
});
