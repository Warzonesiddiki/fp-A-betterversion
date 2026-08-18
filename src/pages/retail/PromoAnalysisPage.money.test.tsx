import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useRetailStore } from '@/store/retailStore';

/**
 * Anti-fabrication probe for promotion analysis.
 *
 * Recorded campaigns (see promoAnalysisData.test.ts): Spring Push 40,000 spend
 * / 300,000 revenue / 200,000 baseline / 30% margin, and Clearance 20,000 /
 * 90,000 / 100,000 with no margin.
 */
const PROMOTIONS = [
  {
    id: 'P-A',
    name: 'Spring Push',
    type: 'Percentage',
    discountPercent: 20,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    cost: 40000,
    revenue: 300000,
    baselineRevenue: 200000,
    grossMarginPercent: 30,
    status: 'completed' as const,
  },
  {
    id: 'P-B',
    name: 'Clearance',
    type: 'BOGO',
    discountPercent: 50,
    startDate: '2026-04-01',
    endDate: '2026-04-15',
    cost: 20000,
    revenue: 90000,
    baselineRevenue: 100000,
    status: 'completed' as const,
  },
];

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(), exportToExcel: vi.fn(async () => {}) },
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="before-after" data-series={JSON.stringify(data)} />
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ data }: { data: unknown[] }) => (
    <div data-testid="type-series" data-series={JSON.stringify(data)} />
  ),
  Cell: () => null,
  ScatterChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Scatter: () => null,
}));

import PromoAnalysisPage from '@/pages/retail/PromoAnalysisPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/retail/promo']}>
      <PromoAnalysisPage />
    </MemoryRouter>
  );
}

describe('PromoAnalysisPage — campaigns come from the workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRetailStore.setState({ promotions: PROMOTIONS });
  });

  it('renders the recorded campaigns, not the fixtures', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Spring Push');
    expect(text).toContain('Clearance');
    for (const invented of ['Summer Sale', 'Back to School', 'Holiday Bundle']) {
      expect(text).not.toContain(invented);
    }
  });

  it('totals spend and incremental revenue from those campaigns', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('$60,000'); // spend
    expect(text).toContain('$90,000'); // incremental revenue
    expect(text).toContain('30%'); // lift 90,000 / 300,000
  });

  it('labels the return basis instead of calling revenue profit', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Return on Spend (revenue basis)');
    expect(text).toContain('1 of 2 campaigns record a margin');
    expect(text).toMatch(/Incremental revenue is not profit/);
  });

  it('shows a negative lift as negative', () => {
    const { container } = renderPage();
    // Clearance lost 10% against baseline; the old table printed "+-10%".
    expect(container.textContent).toContain('-10%');
    expect(container.textContent).not.toContain('+-10%');
  });

  it('charts baseline against actual in full currency, not invented thousands', () => {
    renderPage();
    const series = JSON.parse(
      screen.getByTestId('before-after').getAttribute('data-series') ?? '[]'
    ) as Array<{ name: string; before: number; after: number }>;
    expect(series).toEqual([
      { name: 'Spring Push', before: 200000, after: 300000 },
      { name: 'Clearance', before: 100000, after: 90000 },
    ]);
  });

  it('empty-states when no campaign has been recorded', () => {
    useRetailStore.setState({ promotions: [] });
    const { container } = renderPage();
    expect(screen.getByText('No Promotions Recorded')).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('PromoAnalysisPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'PromoAnalysisPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('declares no fixture campaigns', () => {
    expect(source).not.toMatch(/mockPromos/);
    expect(source).not.toMatch(/PROMO-00\d/);
    expect(source).not.toMatch(/baselineRevenue:\s*\d/);
  });

  it('does not read the ledger only to discard it', () => {
    expect(source).not.toMatch(/entries:\s*_entries/);
    expect(source).not.toMatch(/useGLStore/);
  });

  it('does no money arithmetic in the view', () => {
    expect(source).not.toMatch(/revenue\s*-\s*baseline/);
    expect(source).not.toMatch(/\/\s*1000\b/);
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });

  it('never hardcodes a plus sign on a lift', () => {
    expect(source).not.toMatch(/\+\{formatPercent\(lift/);
  });

  it('derives everything through the shared model', () => {
    expect(source).toMatch(/from '@\/pages\/retail\/promoAnalysisData'/);
    expect(source).toMatch(/derivePromoAnalysis\(promotions\)/);
  });
});
