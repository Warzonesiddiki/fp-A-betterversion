import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import HealthcareDashboardPage from './HealthcareDashboardPage';
import { useGLStore } from '@/store/glStore';
import { type GLEntry } from '@/types';

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">
      {data?.map((row: any, i: number) => (
        <div key={i} data-testid={`table-row-${i}`}>
          {JSON.stringify(row)}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children, data }: any) => (
      <div data-testid="area-chart">
        {data?.map((d: any, i: number) => (
          <div key={i} data-testid={`area-data-${i}`}>
            {JSON.stringify(d)}
          </div>
        ))}
        {children}
      </div>
    ),
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

const mockEntries: GLEntry[] = [
  // Gross Charges for Cardiology (ends in '01')
  {
    id: '1',
    date: '2023-01-15',
    accountCode: '4001',
    amount: 50000,
    description: 'Rev',
    currency: 'USD',
  },
  // Gross Charges for Neurology (ends in '02')
  {
    id: '4',
    date: '2023-01-15',
    accountCode: '4002',
    amount: 30000,
    description: 'Rev',
    currency: 'USD',
  },
  // Contractuals
  {
    id: '2',
    date: '2023-01-15',
    accountCode: '4100',
    amount: -10000,
    description: 'Cont',
    currency: 'USD',
  },
  // Bad Debt
  {
    id: '3',
    date: '2023-01-15',
    accountCode: '4200',
    amount: 5000,
    description: 'Debt',
    currency: 'USD',
  },
];

describe('HealthcareDashboardPage (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(
      <MemoryRouter>
        <HealthcareDashboardPage />
      </MemoryRouter>
    );

    // Gross Charges = $80,000
    // Net Patient Revenue = 80k - 10k(contractuals) = $70,000
    // Let's check Net Patient Revenue is rendered as compact
    expect(screen.getByText(/\$70\.0K/)).toBeInTheDocument();
  });

  it('renders data table rows with department performance', () => {
    render(
      <MemoryRouter>
        <HealthcareDashboardPage />
      </MemoryRouter>
    );

    // Cardiology revenue = $50,000
    // patients = 50000 / 2500 = 20
    expect(screen.getByText(/Cardiology/)).toBeInTheDocument();
    // In DataTable, currency is formatted. Let's see how it formats.
    // revenue: deptRevenue, and format is:
    // If it's compact or normal? We'll just check for '$50' or '50'
    expect(screen.getByText(/50000/)).toBeInTheDocument();

    // Check if Neurology is rendered
    expect(screen.getByTestId('data-table')).toHaveTextContent(/Neurology/);
  });
});
