import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import FleetCostDashboardPage from './FleetCostDashboardPage';
import { useGLStore } from '@/store/glStore';
import { type GLEntry } from '@/types';

const mockEntries: GLEntry[] = [
  // Revenue
  {
    id: '1',
    date: '2023-01-15',
    accountName: 'Freight Revenue',
    accountCode: '4000',
    amount: 0,
    credit: 100000,
    debit: 0,
    netChange: 100000,
    description: 'Rev',
    currency: 'USD',
  },
  // COGS (Fuel)
  {
    id: '2',
    date: '2023-01-15',
    accountName: 'Fuel',
    accountCode: '5000',
    amount: 0,
    credit: 0,
    debit: 30000,
    netChange: 30000,
    description: 'Fuel',
    currency: 'USD',
  },
  // OPEX (Maintenance)
  {
    id: '3',
    date: '2023-01-15',
    accountName: 'Maintenance',
    accountCode: '6000',
    amount: 0,
    credit: 0,
    debit: 10000,
    netChange: 10000,
    description: 'Maint',
    currency: 'USD',
  },
  // Total Miles
  {
    id: '4',
    date: '2023-01-15',
    accountName: 'Total Miles',
    accountCode: '9001',
    amount: 0,
    credit: 0,
    debit: 20000,
    netChange: 20000,
    description: 'Miles',
    currency: 'USD',
  },
  // Loaded Miles
  {
    id: '5',
    date: '2023-01-15',
    accountName: 'Loaded Miles',
    accountCode: '9002',
    amount: 0,
    credit: 0,
    debit: 15000,
    netChange: 15000,
    description: 'Loaded',
    currency: 'USD',
  },
];

describe('FleetCostDashboardPage (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(
      <MemoryRouter>
        <FleetCostDashboardPage />
      </MemoryRouter>
    );

    // Total Cost = 30k + 10k = 40,000
    // Total Miles = 20,000
    // Cost Per Mile = 40,000 / 20,000 = $2.00
    expect(screen.getByText(/2\.00/)).toBeInTheDocument();

    // Loaded Miles = 15,000
    // Empty Miles = Total (20000) - Loaded (15000) = 5,000
    // Empty Miles % = 5,000 / 20,000 = 25.0%
    expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
  });
});
