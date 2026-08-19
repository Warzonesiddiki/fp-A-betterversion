import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useGLStore } from '@/store/glStore';
import { HealthcareEngine } from '@/engines/HealthcareEngine';
import type { GLEntry } from '@/types';

/**
 * Anti-fabrication probe for the patient revenue cycle page.
 *
 * `HealthcareEngine` is REAL here — the page's numbers are recomputed by the
 * shipping engine from a seeded ledger, so a fabricated literal cannot hide
 * behind a mocked engine (the pre-existing smoke test mocks `@/engines`, a
 * module this page never imports, so that mock never applied).
 *
 * Seeded ledger, hand-computed:
 *   4001 Medicare charges     1,000,000
 *   4002 Commercial charges     500,000  -> gross charges 1,500,000
 *   4100 contractuals          -300,000  -> |300,000|
 *                                        -> net revenue   1,200,000
 *   1100 cash                   600,000  -> collection rate 50.0%
 *   1200 patient A/R            400,000  -> daily revenue 1,200,000/30 = 40,000
 *                                        -> days in A/R  10.0
 *   4200 bad debt                20,000
 */
function entry(accountCode: string, amount: number, id: string): GLEntry {
  return {
    id,
    accountId: id,
    accountCode,
    accountName: accountCode,
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: amount > 0 ? amount : 0,
    credit: amount < 0 ? -amount : 0,
    netChange: amount,
    date: '2026-01-31',
    amount,
    description: 'seed',
    reference: id,
  };
}

const SEEDED: GLEntry[] = [
  entry('4001', 1000000, 'g1'),
  entry('4002', 500000, 'g2'),
  entry('4100', -300000, 'c1'),
  entry('1100', 600000, 'k1'),
  entry('1200', 400000, 'a1'),
  entry('4200', 20000, 'b1'),
];

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ data }: { data: unknown[] }) => (
    <div data-testid="payer-mix" data-series={JSON.stringify(data)} />
  ),
  Cell: () => null,
  BarChart: ({ data, children }: { data: unknown[]; children?: React.ReactNode }) => (
    <div data-testid="cycle-series" data-series={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import PatientRevenuePage from '@/pages/healthcare/PatientRevenuePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/healthcare/patient-revenue']}>
      <PatientRevenuePage />
    </MemoryRouter>
  );
}

describe('HealthcareEngine.calculatePatientRevenue — no invented denial rate', () => {
  it('returns null for the denial rate, not a hardcoded 4.2', () => {
    const stats = HealthcareEngine.calculatePatientRevenue(SEEDED);
    expect(stats.denialRate).toBeNull();
  });

  it('discloses the A/R days basis it divided by', () => {
    const stats = HealthcareEngine.calculatePatientRevenue(SEEDED);
    expect(stats.daysInPeriodBasis).toBe(30);
    expect(stats.daysInAR).toBe(10);
  });

  it('derives the ledger figures used by the page', () => {
    const stats = HealthcareEngine.calculatePatientRevenue(SEEDED);
    expect(stats.grossCharges).toBe(1500000);
    expect(stats.contractuals).toBe(300000);
    expect(stats.netRevenue).toBe(1200000);
    expect(stats.collectionRate).toBe(50);
  });
});

describe('PatientRevenuePage — no fabricated denial analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: SEEDED });
  });

  it('renders the engine figures from the seeded ledger', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toMatch(/\$1,500,000/); // gross charges
    expect(text).toMatch(/\$1,200,000/); // net revenue
    expect(text).toContain('50.0%'); // collection rate
    expect(text).toContain('10.0'); // days in A/R
  });

  it('renders none of the invented denial rows', () => {
    const text = renderPage().container.textContent ?? '';
    for (const quote of ['$840k', '$450k', '$1.2M', '$120k', '$2.1M']) {
      expect(text).not.toContain(quote);
    }
    for (const count of ['420', '215', '180', '95', '64']) {
      expect(text).not.toContain(`${count} `);
    }
  });

  it('discloses the denial rate as unavailable instead of showing 4.2%', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).not.toContain('4.2%');
    expect(text).toMatch(/Denial rate — unavailable/);
    expect(text).toMatch(/general ledger does not carry/i);
  });

  it('renders no invented KPI deltas or narrative causes', () => {
    const text = renderPage().container.textContent ?? '';
    for (const invented of [
      'volume increase in Q1',
      'coding audits effective',
      'net of contractuals',
      'billing cycle faster',
    ]) {
      expect(text).not.toContain(invented);
    }
  });

  it('discloses the A/R days basis on the tile', () => {
    expect(renderPage().container.textContent).toMatch(/12xx balance on a 30-day basis/);
  });

  it('feeds the revenue-cycle chart only engine-derived amounts', () => {
    renderPage();
    const series = JSON.parse(
      screen.getByTestId('cycle-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ stage: string; amount: number }>;
    expect(series.find((p) => p.stage === 'Charges')!.amount).toBe(1500000);
    expect(series.find((p) => p.stage === 'Net Revenue')!.amount).toBe(1200000);
    expect(series.find((p) => p.stage === 'Cash Collected')!.amount).toBe(600000);
  });

  it('empty-states with no ledger and shows no figure at all', () => {
    useGLStore.setState({ entries: [] });
    const { container } = renderPage();
    expect(screen.getByText(/No Healthcare Data/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('PatientRevenuePage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'PatientRevenuePage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('carries no hand-typed currency or percent literal in a displayed value', () => {
    expect(source).not.toMatch(/value:\s*'\$[\d.]+[kMB]?'/);
    expect(source).not.toMatch(/value=\{?['"`]\$[\d.]+[kMB]?['"`]/);
    expect(source).not.toMatch(/change=\{-?\d/);
  });

  it('declares no denial-analytics fixture', () => {
    expect(source).not.toMatch(/denialAnalytics\s*=/);
    expect(source).not.toMatch(/reason:\s*'/);
  });

  it('passes no invented sparkline history', () => {
    expect(source).not.toMatch(/sparklineData=\{\[\s*\d/);
  });

  it('never substitutes a default for the null denial rate', () => {
    expect(source).not.toMatch(/denialRate\s*(\?\?|\|\|)\s*[\d.]/);
  });
});

describe('HealthcareEngine — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, '../../engines/HealthcareEngine.ts'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('does not assign a numeric denial rate', () => {
    expect(source).not.toMatch(/denialRate:\s*[\d.]+/);
  });
});
