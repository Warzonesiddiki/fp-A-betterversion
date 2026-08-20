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

    // Cardiology revenue = $50,000 (derived from the real GL).
    expect(screen.getByText(/Cardiology/)).toBeInTheDocument();
    expect(screen.getByText(/50000/)).toBeInTheDocument();

    // Check if Neurology is rendered
    expect(screen.getByTestId('data-table')).toHaveTextContent(/Neurology/);
  });

  it('does not fabricate margin or efficiency from department name', () => {
    // Session 028: pre-existing test gap. The page used to compute
    // margin = 15 + ((d.name.charCodeAt(0) * 3) % 15) and
    // efficiency = 85 + ((d.name.charCodeAt(0) * 2) % 12) — a function of
    // the first character of the department name. That is a Severity-0
    // fabrication: it renders a different number for every department and
    // is not backed by a general ledger. The page must now render those
    // columns as '—' (not derivable from a GL).
    render(
      <MemoryRouter>
        <HealthcareDashboardPage />
      </MemoryRouter>
    );
    const table = screen.getByTestId('data-table');
    // Cardiology's first char 'C' (charCode 67). Pre-fix margin would be
    // 15 + (67*3 % 15) = 15 + 6 = 21; pre-fix efficiency would be
    // 85 + (67*2 % 12) = 85 + 2 = 87. Neither literal must appear.
    expect(table.textContent).not.toMatch(/\b21\.0\s*%/);
    expect(table.textContent).not.toMatch(/\b87\s*%/);
    // Same check for Neurology ('N' = 78).
    expect(table.textContent).not.toMatch(/\b15\.4\s*%/);
    expect(table.textContent).not.toMatch(/\b89\s*%/);
  });
});
