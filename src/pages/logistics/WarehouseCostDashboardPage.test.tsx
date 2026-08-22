import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WarehouseCostDashboardPage from './WarehouseCostDashboardPage';
import { useGLStore } from '@/store/glStore';
import { computeWarehouseCostFromEntries } from './WarehouseCostDashboardPage';
import type { GLEntry } from '@/types';

const warehouseEntries: GLEntry[] = [
  {
    id: 'w1',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Freight Revenue',
    period: 'P01',
    periodName: 'January',
    debit: 0,
    credit: 1_200_000,
    netChange: -1_200_000,
    date: '2026-01-15',
    amount: 1_200_000,
    description: 'Rev',
    reference: 'w1',
  },
  {
    id: 'w2',
    accountId: '5000',
    accountCode: '5000',
    accountName: 'Fuel COGS',
    period: 'P01',
    periodName: 'January',
    debit: 600_000,
    credit: 0,
    netChange: 600_000,
    date: '2026-01-15',
    amount: 600_000,
    description: 'Fuel',
    reference: 'w2',
  },
  {
    id: 'w3',
    accountId: '6100',
    accountCode: '6100',
    accountName: 'Warehouse Storage',
    period: 'P01',
    periodName: 'January',
    debit: 144_000,
    credit: 0,
    netChange: 144_000,
    date: '2026-01-15',
    amount: 144_000,
    description: 'Storage',
    reference: 'w3',
  },
];

describe('WarehouseCostDashboardPage (real-store, vertical truthfulness)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('shows the honest empty state when nothing is posted', () => {
    render(
      <MemoryRouter>
        <WarehouseCostDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No Warehouse Data/i)).toBeTruthy();
  });

  it('computes warehouse KPIs exactly from GL entries', () => {
    useGLStore.setState({ entries: warehouseEntries });
    render(
      <MemoryRouter>
        <WarehouseCostDashboardPage />
      </MemoryRouter>
    );
    // Warehouse cost % revenue = 144k ÷ 1.2M = 12.0%
    expect(screen.getByText('12.0%')).toBeInTheDocument();
    // Operating margin = (1.2M − 600k cogs) ÷ 1.2M = 50.0%
    // ("Warehouse Storage" is debit-heavy → cost line, never revenue)
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('carries no invented fleet volumes (W-FAB)', () => {
    const input = computeWarehouseCostFromEntries(warehouseEntries);
    // The input builder exposes only what this page measures:
    expect(input).not.toHaveProperty('totalMiles');
    expect(input).not.toHaveProperty('totalDeliveries');

    useGLStore.setState({
      entries: [
        {
          id: 'm1',
          accountId: '4000',
          accountCode: '4000',
          accountName: 'Unrelated Sales',
          period: 'P01',
          periodName: 'January',
          debit: 0,
          credit: 500,
          netChange: -500,
          date: '2026-01-15',
          amount: 500,
          description: 'Misc',
          reference: 'm1',
        },
      ],
    });
    const { container } = render(
      <MemoryRouter>
        <WarehouseCostDashboardPage />
      </MemoryRouter>
    );
    const text = container.textContent ?? '';
    // The previous hardcoded volumes must never appear as data:
    expect(text).not.toContain('400,000');
    expect(text).not.toContain('340,000');
    expect(text).not.toContain('470,000');
    expect(text).not.toContain('9,500');
  });
});
