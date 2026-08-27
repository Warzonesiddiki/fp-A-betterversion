import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
    LineChart: ({ children, data }: any) => (
      <div data-testid="line-chart">
        {data?.map((d: any, i: number) => (
          <div key={i} data-testid={`line-data-${i}`}>
            {JSON.stringify(d)}
          </div>
        ))}
        {children}
      </div>
    ),
    Line: () => null,
  };
});

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(true),
  },
}));

function entry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: overrides.id ?? 'e',
    accountId: 'a',
    accountCode: '4000',
    amount: 0,
    debit: 0,
    credit: 0,
    description: '',
    date: '2023-01-15',
    period: '2023-01',
    periodName: '2023-01',
    netChange: 0,
    accountName: '',
    reference: '',
    ...overrides,
  };
}

// No department tags anywhere -> line-level config cannot be derived.
const untaggedEntries: GLEntry[] = [
  entry({ id: '1', accountCode: '4000', credit: 500000, amount: 500000 }),
  entry({ id: '2', accountCode: '5000', debit: 40000, amount: 40000 }),
];

// Department tags present -> engine derives line configs from measured GL metadata.
const taggedEntries: GLEntry[] = [
  entry({ id: 'r1', accountCode: '4700', credit: 300000, amount: 300000, department: 'Assembly' }),
  entry({
    id: 'r2',
    accountCode: '4710',
    credit: 200000,
    amount: 200000,
    date: '2023-02-10',
    period: '2023-02',
    department: 'Packaging',
  }),
  entry({ id: 'c1', accountCode: '5700', debit: 100000, amount: 100000, department: 'Assembly' }),
  entry({ id: 'c2', accountCode: '5800', debit: 60000, amount: 60000, department: 'Packaging' }),
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ProductionDashboardPage />
    </MemoryRouter>
  );
}

describe('ProductionDashboardPage (measured-data only)', () => {
  it('renders KPI values computed by the manufacturing engine', () => {
    useGLStore.setState({ entries: untaggedEntries });
    renderPage();

    // Engine convention: revenue = sum(|amount|) on 4xxx; COGS = |amount| on 5xxx.
    // Revenue = 500k. COGS = 40k. Margin = (500k - 40k) / 500k = 92%.
    expect(screen.getByText(/\$500,000/)).toBeInTheDocument();
    expect(screen.getByText(/92\.0%/)).toBeInTheDocument();
  });

  it('discloses absence instead of fabricating production lines when GL has no line config', () => {
    useGLStore.setState({ entries: untaggedEntries });
    renderPage();

    expect(screen.queryByText(/Line [A-Z]/)).not.toBeInTheDocument();
    expect(screen.getByText(/No production line configuration/i)).toBeInTheDocument();
  });

  it('derives production lines from department-tagged GL entries', () => {
    useGLStore.setState({ entries: taggedEntries });
    renderPage();

    expect(screen.getByText('Assembly')).toBeInTheDocument();
    expect(screen.getByText('Packaging')).toBeInTheDocument();
    expect(screen.queryByText(/Line [A-Z]/)).not.toBeInTheDocument();
    // Even split of measured 160k production cost across 2 configured lines.
    const table = screen.getByRole('grid');
    expect(within(table).getAllByText('$80,000')).toHaveLength(2);
  });

  it('buckets the output trend chart by posting month from GL entries', () => {
    useGLStore.setState({ entries: taggedEntries });
    renderPage();

    expect(screen.getByTestId('area-data-0')).toHaveTextContent('"month":"2023-01"');
    expect(screen.getByTestId('line-data-1')).toHaveTextContent('"month":"2023-02"');
  });

  it('triggers PDF export with derived line rows only', async () => {
    useGLStore.setState({ entries: taggedEntries });
    const user = userEvent.setup();
    renderPage();

    const exportBtn = screen.getByRole('button', { name: /Export PDF/i });
    await user.click(exportBtn);

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const exportArgs = vi.mocked(ExportEngine.exportToPDF).mock.calls[0][0];

    expect(exportArgs.headers).toEqual(['Line', 'Allocated Cost']);
    expect(exportArgs.rows).toEqual([
      ['Assembly', '$80,000'],
      ['Packaging', '$80,000'],
    ]);
  });
});
