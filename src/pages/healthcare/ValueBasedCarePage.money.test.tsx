import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useHealthcareStore } from '@/store/healthcareStore';

/**
 * Source guard + DOM probe for the value-based-care rewrite (session 024).
 *
 * Pre-session-024 there were TWO copies of the fabrication: module fixtures
 * inside the page (aggregate quality 91.4%, shared savings $4.8M, ROI
 * 14.2%, four named ACO programs) AND seeded defaults persisted by
 * healthcareStore for every tenant. Both are asserted gone here; the
 * derivation runs for real against the live store.
 */

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
}

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  RadarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="radar-series" data-series={JSON.stringify(data)} />
  ),
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Radar: () => null,
  BarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="savings-series" data-series={JSON.stringify(data)} />
  ),
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import ValueBasedCarePage from '@/pages/healthcare/ValueBasedCarePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/healthcare/value-based']}>
      <ValueBasedCarePage />
    </MemoryRouter>
  );
}

const EMPTY = { qualityMetrics: [], savingsData: [], programs: [] };

describe('ValueBasedCarePage — source guards', () => {
  const pageSrc = stripComments(
    fs.readFileSync(path.resolve(__dirname, './ValueBasedCarePage.tsx'), 'utf8')
  );
  const storeSrc = stripComments(
    fs.readFileSync(path.resolve(__dirname, '../../store/healthcareStore.ts'), 'utf8')
  );

  it('no module-level fixture arrays survive in the page', () => {
    expect(pageSrc).not.toMatch(/const qualityMetrics = \[/);
    expect(pageSrc).not.toMatch(/const savingsData = \[/);
    expect(pageSrc).not.toMatch(/programPerformance/);
  });

  it('no literal KPI values in the page body', () => {
    expect(pageSrc).not.toMatch(/91\.4%/);
    expect(pageSrc).not.toMatch(/\$4\.8M/);
    expect(pageSrc).not.toMatch(/14\.2%/);
  });

  it('healthcareStore no longer seeds tenant data', () => {
    expect(storeSrc).not.toMatch(/MSSP ACO Track 3/);
    expect(storeSrc).not.toMatch(/BPCI-Advanced/);
    expect(storeSrc).not.toMatch(/2400000/);
    expect(storeSrc).not.toMatch(/94\.2%/);
    // persist bump: upgrading workspaces must have the seeds cleared.
    expect(storeSrc).toMatch(/version: 3/);
    expect(storeSrc).toMatch(/qualityMetrics: \[\], savingsData: \[\], programs: \[\]/);
  });
});

describe('ValueBasedCarePage — figures come from the store', () => {
  beforeEach(() => {
    useHealthcareStore.setState({
      qualityMetrics: [
        { subject: 'Readmissions', A: 80, B: 75, fullMark: 100 },
        { subject: 'Safety', A: 45, B: 50, fullMark: 50 },
      ],
      savingsData: [
        { category: 'Orthopedics', target: 2000000, actual: 1850000, savings: 0 },
        { category: 'Cardiology', target: 1500000, actual: 1600000, savings: 0 },
      ],
      programs: [
        {
          id: 'p1',
          program: 'Recorded ACO',
          population: '1,000',
          qualityScore: '90%',
          sharedSavings: '+$50,000',
          status: 'High',
        },
      ],
    });
  });

  afterEach(() => {
    useHealthcareStore.setState(EMPTY);
  });

  it('renders the derived aggregate score and net savings', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('83.33%'); // 125 / 150, ratio of sums
    expect(text).toContain('$50,000'); // (2,000,000−1,850,000) + (1,500,000−1,600,000)
    expect(text).toContain('Recorded ACO');
  });

  it('derives per-bundle savings as target − actual in the chart series', () => {
    const { container } = renderPage();
    const series = container.querySelector('[data-testid="savings-series"]');
    const parsed = JSON.parse(series!.getAttribute('data-series') ?? '[]') as {
      category?: string;
      savings?: number;
    }[];
    const ortho = parsed.find((p) => p.category === 'Orthopedics');
    expect(ortho?.savings).toBe(150000);
  });

  it('empty-states with an h1 when nothing is recorded', () => {
    useHealthcareStore.setState(EMPTY);
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /No Value-Based Care Data/i })
    ).toBeTruthy();
  });
});
