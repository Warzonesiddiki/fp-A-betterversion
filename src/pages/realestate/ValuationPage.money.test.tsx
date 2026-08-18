import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useGLStore } from '@/store/glStore';

/**
 * Anti-fabrication probe for property valuation.
 *
 * Seeded ledger (see valuationData.test.ts): P1 cost 4,000,000 / value
 * 5,000,000 / NOI 300,000; P2 cost 2,000,000 / value 2,200,000 and no rent;
 * mortgage 3,000,000. Portfolio: value 7,200,000, gain 1,200,000 (+20%),
 * weighted cap rate 6.00%, LTV 41.67%.
 */
const LEDGER = [
  {
    id: '1',
    accountCode: '1500',
    accountName: 'Riverside Cost',
    entityId: 'P1',
    debit: 4000000,
    credit: 0,
  },
  {
    id: '2',
    accountCode: '1600',
    accountName: 'Riverside Appraisal',
    entityId: 'P1',
    debit: 5000000,
    credit: 0,
  },
  {
    id: '3',
    accountCode: '4000',
    accountName: 'Rental Income',
    entityId: 'P1',
    debit: 0,
    credit: 400000,
  },
  {
    id: '4',
    accountCode: '5000',
    accountName: 'Property Opex',
    entityId: 'P1',
    debit: 100000,
    credit: 0,
  },
  {
    id: '5',
    accountCode: '1500',
    accountName: 'Hillcrest Cost',
    entityId: 'P2',
    debit: 2000000,
    credit: 0,
  },
  {
    id: '6',
    accountCode: '1600',
    accountName: 'Hillcrest Appraisal',
    entityId: 'P2',
    debit: 2200000,
    credit: 0,
  },
  {
    id: '7',
    accountCode: '2500',
    accountName: 'Mortgage',
    entityId: 'P1',
    debit: 0,
    credit: 3000000,
  },
];

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('@/components/ui/PeriodPicker', () => ({ PeriodPicker: () => <div /> }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="valuation-series" data-series={JSON.stringify(data)} />
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import ValuationPage from '@/pages/realestate/ValuationPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/realestate/valuation']}>
      <ValuationPage />
    </MemoryRouter>
  );
}

describe('ValuationPage — valuations come from the ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: LEDGER as never });
  });

  it('renders portfolio totals derived from posted balances', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('$7,200,000'); // appraised value
    expect(text).toContain('$6,000,000'); // cost basis
    expect(text).toContain('20.0%'); // value-weighted appreciation, not 17.5% mean
    expect(text).not.toContain('17.5%');
  });

  it('does not stamp one cap rate onto every property', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('6.00%'); // P1's own cap rate and the weighted figure
    expect(text).toContain('1 of 2 properties');
    // P2 posts no rental income, so its cap-rate cell is blank.
    expect(text).toContain('—');
  });

  it('renders no invented KPI deltas', () => {
    const text = renderPage().container.textContent ?? '';
    for (const invented of [
      'vs prior period',
      'since acquisition',
      'above market avg',
      'compression',
    ]) {
      expect(text).not.toContain(invented);
    }
  });

  it('derives LTV and NOI instead of engine placeholders', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('41.7%'); // 3,000,000 / 7,200,000
    expect(text).toContain('$300,000'); // portfolio NOI
    expect(text).not.toContain('94.8');
    expect(text).not.toContain('Value-Add');
  });

  it('charts posted cost and value per property', () => {
    renderPage();
    const series = JSON.parse(
      screen.getByTestId('valuation-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ cost: number; market: number }>;
    expect(series).toHaveLength(2);
    expect(series[0]!.cost).toBe(4000000);
    expect(series[0]!.market).toBe(5000000);
  });

  it('empty-states when no property balance is posted', () => {
    useGLStore.setState({ entries: [] });
    const { container } = renderPage();
    expect(screen.getByText('No Valuation Data')).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('ValuationPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'ValuationPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('does not assign a portfolio cap rate to a property row', () => {
    expect(source).not.toMatch(/capRate:\s*dashStats/);
    expect(source).not.toMatch(/dashStats/);
  });

  it('does not call RealEstateEngine, whose breakdown carries placeholders', () => {
    expect(source).not.toMatch(/RealEstateEngine/);
  });

  it('passes no invented KPI delta', () => {
    expect(source).not.toMatch(/change=\{-?\d/);
  });

  it('does no money arithmetic in the view', () => {
    expect(source).not.toMatch(/p\.currentVal\s*-\s*p\.purchasePrice/);
    expect(source).not.toMatch(/reduce\(\(acc/);
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });

  it('derives everything through the shared model', () => {
    expect(source).toMatch(/from '@\/pages\/realestate\/valuationData'/);
    expect(source).toMatch(/deriveValuation\(entries\)/);
  });
});
