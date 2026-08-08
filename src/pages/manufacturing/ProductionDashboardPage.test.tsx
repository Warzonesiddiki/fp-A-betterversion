import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ProductionDashboardPage from './ProductionDashboardPage';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import userEvent from '@testing-library/user-event';
import { type GLEntry } from '@/types';

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
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => null,
  };
});

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(true),
  },
}));

const mockEntries: GLEntry[] = [
  // Revenue: credit - debit
  {
    id: '1',
    date: '2023-01-15',
    accountCode: '4000',
    amount: 100000,
    debit: 0,
    credit: 500000,
    description: 'Rev',
    currency: 'USD',
  },
  // COGS: abs(debit - credit)
  {
    id: '2',
    date: '2023-01-15',
    accountCode: '5000',
    amount: 40000,
    debit: 300000,
    credit: 0,
    description: 'COGS',
    currency: 'USD',
  },
];

describe('ProductionDashboardPage (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(
      <MemoryRouter>
        <ProductionDashboardPage />
      </MemoryRouter>
    );

    // Revenue = 500k. COGS = 300k.
    // Margin = (500k - 300k) / 500k = 200k / 500k = 40%
    expect(screen.getByText(/\$500,000/)).toBeInTheDocument();
    expect(screen.getByText(/40\.0%/)).toBeInTheDocument();
  });

  it('renders hardcoded line table', () => {
    render(
      <MemoryRouter>
        <ProductionDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Line A — Assembly')).toBeInTheDocument();
    expect(screen.getByText('94.2%')).toBeInTheDocument();
  });

  it('triggers PDF export with lines data', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductionDashboardPage />
      </MemoryRouter>
    );

    const exportBtn = screen.getByRole('button', { name: /Export PDF/i });
    await user.click(exportBtn);

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const exportArgs = vi.mocked(ExportEngine.exportToPDF).mock.calls[0][0];

    expect(exportArgs.headers).toEqual(['Line', 'Status', 'Output', 'Efficiency', 'Downtime']);
    expect(exportArgs.rows).toHaveLength(5);
    const firstRow = exportArgs.rows.find((r: any) => r[0] === 'Line A — Assembly');
    expect(firstRow).toEqual(['Line A — Assembly', 'Running', '12500', '94.2%', '2.1%']);
  });
});
