import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { useHealthcareStore } from '@/store/healthcareStore';

const TRIALS = [
  {
    id: 'T-1',
    name: 'Alpha',
    site: 'Site One',
    phase: 'Phase III',
    budget: 5000000,
    actualSpend: 4000000,
    targetEnrollment: 200,
    enrolled: 100,
    status: 'active' as const,
  },
  {
    id: 'T-2',
    name: 'Beta',
    site: 'Site Two',
    phase: 'Phase II',
    budget: 2000000,
    actualSpend: 2500000,
    targetEnrollment: 100,
    enrolled: 0,
    status: 'enrolling' as const,
  },
];

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('@/components/ui/PeriodPicker', () => ({ PeriodPicker: () => <div /> }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="trial-series" data-series={JSON.stringify(data)} />
  ),
  Area: () => null,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import ClinicalTrialCostPage from '@/pages/healthcare/ClinicalTrialCostPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/healthcare/clinical-trials']}>
      <ClinicalTrialCostPage />
    </MemoryRouter>
  );
}

describe('ClinicalTrialCostPage — trials come from the workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useHealthcareStore.setState({ clinicalTrials: TRIALS });
  });

  it('renders totals derived from the recorded trials', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('$7,000,000'); // budget
    expect(text).toContain('$6,500,000'); // spend
    expect(text).toContain('$65,000'); // cost per patient
    expect(text).toContain('33.3%'); // enrolment 100 of 300
  });

  it('renders none of the literal KPI figures', () => {
    const text = renderPage().container.textContent ?? '';
    for (const quote of ['$24.8M', '$18.5k', '92.4%', '$3.2M']) {
      expect(text).not.toContain(quote);
    }
  });

  it('renders none of the fixture studies or institutions', () => {
    const text = renderPage().container.textContent ?? '';
    for (const invented of ['Onco-Shield', 'Mayo Clinic', 'Johns Hopkins', 'Cedars-Sinai']) {
      expect(text).not.toContain(invented);
    }
    expect(text).toContain('Alpha');
    expect(text).toContain('Site One');
  });

  it('breaks phases down by recorded budget, not a quoted 55%', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('71.4%');
    expect(text).toContain('28.6%');
    expect(text).not.toContain('$13.6M');
  });

  it('charts the recorded trials', () => {
    renderPage();
    const series = JSON.parse(
      screen.getByTestId('trial-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ name: string; budget: number; actualSpend: number }>;
    expect(series.map((s) => s.name)).toEqual(['Alpha', 'Beta']);
    expect(series[0]!.budget).toBe(5000000);
  });

  it('discloses what recorded trials cannot answer', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Not derivable from recorded trials');
    expect(text).toContain('R&D tax credits');
  });

  it('empty-states when no trial has been recorded', () => {
    useHealthcareStore.setState({ clinicalTrials: [] });
    const { container } = renderPage();
    expect(screen.getByText('No Trials Recorded')).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('ClinicalTrialCostPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'ClinicalTrialCostPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('declares no fixture trials or budget trend', () => {
    expect(source).not.toMatch(/trialInventory/);
    expect(source).not.toMatch(/trialBudgetTrend/);
    expect(source).not.toMatch(/T-\d{3}/);
  });

  it('carries no literal KPI value, delta or sparkline history', () => {
    expect(source).not.toMatch(/value="\$[\d.]+[kM]"/);
    expect(source).not.toMatch(/change=\{-?\d/);
    expect(source).not.toMatch(/sparklineData=\{\[\s*\d/);
  });

  it('does no money arithmetic in the view', () => {
    expect(source).not.toMatch(/bucket\.budget\s*\+/);
    expect(source).not.toMatch(/toFixed\(/);
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });

  it('derives everything through the shared model', () => {
    expect(source).toMatch(/from '@\/pages\/healthcare\/clinicalTrialData'/);
    expect(source).toMatch(/deriveClinicalTrialAnalysis\(trials\)/);
  });
});
