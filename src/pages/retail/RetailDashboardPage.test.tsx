import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import RetailDashboard from './RetailDashboard';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import userEvent from '@testing-library/user-event';
import { type GLEntry } from '@/types';

// Mock Recharts to render the text content of charts
vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children, data }: any) => (
      <div data-testid="bar-chart">
        {data?.map((d: any, i: number) => (
          <div key={i} data-testid={`bar-data-${i}`}>
            {JSON.stringify(d)}
          </div>
        ))}
        {children}
      </div>
    ),
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(true),
  },
}));

const mockEntries: GLEntry[] = [
  // Store 1: S-01
  {
    id: '1',
    date: '2023-01-15',
    accountCode: '4000',
    amount: 100000,
    description: 'Rev',
    entityId: 'S-01',
    currency: 'USD',
  },
  {
    id: '2',
    date: '2023-01-15',
    accountCode: '5000',
    amount: 40000,
    description: 'COGS',
    entityId: 'S-01',
    currency: 'USD',
  },
  {
    id: '3',
    date: '2023-01-15',
    accountCode: '5100',
    amount: 20000,
    description: 'Labor',
    entityId: 'S-01',
    currency: 'USD',
  },
  {
    id: '4',
    date: '2023-01-15',
    accountCode: '5200',
    amount: 10000,
    description: 'Occ',
    entityId: 'S-01',
    currency: 'USD',
  },
  // Store 2: S-02
  {
    id: '5',
    date: '2023-02-15',
    accountCode: '4000',
    amount: 200000,
    description: 'Rev',
    entityId: 'S-02',
    currency: 'USD',
  },
  {
    id: '6',
    date: '2023-02-15',
    accountCode: '5000',
    amount: 100000,
    description: 'COGS',
    entityId: 'S-02',
    currency: 'USD',
  },
  {
    id: '7',
    date: '2023-02-15',
    accountCode: '5100',
    amount: 30000,
    description: 'Labor',
    entityId: 'S-02',
    currency: 'USD',
  },
  {
    id: '8',
    date: '2023-02-15',
    accountCode: '5200',
    amount: 20000,
    description: 'Occ',
    entityId: 'S-02',
    currency: 'USD',
  },
];

describe('RetailDashboard (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(
      <MemoryRouter>
        <RetailDashboard />
      </MemoryRouter>
    );

    // Total Revenue is $300,000
    expect(screen.getByText(/\$300,000/)).toBeInTheDocument();

    // Avg Rev per store = $150,000
    expect(screen.getByText(/\$150,000/)).toBeInTheDocument();

    // Avg Net Margin (80k / 300k = 26.7%)
    expect(screen.getByText(/26\.7%/)).toBeInTheDocument();
  });

  it('renders data table rows correctly', () => {
    render(
      <MemoryRouter>
        <RetailDashboard />
      </MemoryRouter>
    );

    // Store 2 row should have $200,000 revenue
    expect(screen.getByText('Store S-02')).toBeInTheDocument();
    // 25% margin should be displayed
    const rowsWithMargin = screen.getAllByText('25.0%');
    expect(rowsWithMargin.length).toBeGreaterThan(0);
  });

  it('renders the PnL trend chart data', () => {
    render(
      <MemoryRouter>
        <RetailDashboard />
      </MemoryRouter>
    );

    // Look for chart output text: '2023-01' should have 100000 revenue
    expect(screen.getByText(/"month":"2023-01".*"revenue":100000/)).toBeInTheDocument();
    expect(screen.getByText(/"month":"2023-02".*"revenue":200000/)).toBeInTheDocument();
  });

  it('triggers PDF export with the computed store stats', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RetailDashboard />
      </MemoryRouter>
    );

    const exportBtn = screen.getByRole('button', { name: /export/i });
    await user.click(exportBtn);

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const exportArgs = vi.mocked(ExportEngine.exportToPDF).mock.calls[0][0];

    expect(exportArgs.headers).toEqual([
      'Store',
      'Revenue',
      'COGS',
      'Labor',
      'Gross Profit',
      'Net Profit',
      'Margin %',
    ]);
    expect(exportArgs.rows).toHaveLength(2); // 2 stores
    const firstRow = exportArgs.rows.find((r: any) => r[0] === 'Store S-01');
    expect(firstRow).toBeDefined();
    expect(firstRow).toEqual(['Store S-01', 100000, 40000, 20000, 60000, 30000, '30.0%']);
  });
});

import RetailDashboardPage from './RetailDashboardPage';

describe('RetailDashboardPage — no fabricated figures', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('shows empty state and no invented KPIs when the GL is empty', () => {
    render(
      <MemoryRouter>
        <RetailDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No Retail Data/i)).toBeInTheDocument();
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/\$12\.4M/);
    expect(body).not.toMatch(/Flagship NYC/);
    expect(body).not.toMatch(/6\.8%/);
    expect(body).not.toMatch(/24\.2%/);
  });

  it('renders GL-derived store totals instead of invented peer quotes', () => {
    useGLStore.setState({ entries: mockEntries });
    render(
      <MemoryRouter>
        <RetailDashboardPage />
      </MemoryRouter>
    );
    const body = document.body.textContent ?? '';
    expect(body).toMatch(/Retail Dashboard/i);
    expect(body).toMatch(/\$300,000/);
    expect(body).not.toMatch(/\$12\.4M/);
    expect(body).not.toMatch(/Flagship NYC/);
    expect(body).not.toMatch(/Westside LA/);
    expect(body).toMatch(/not derivable/i);
  });
});
