/**
 * Vertical truthfulness sweep (wave 2) — fabrication regression lock for
 * AgricultureDashboardPage.
 *
 * The pre-sweep page rendered config tiles as `target × 0.92` with an
 * invented `change={-4}` plus hand-typed agronomy literals (yield 8.5 t/ha ·
 * revenue/acre $4,600 · water 4,200 m³ · equipment utilisation 78% · labour
 * 22% · cost/unit $95 · gross margin 33% · active farms 8). This lock pins
 * the post-sweep contract: GL-derived figures plus a disclosed name-matched
 * labour share only; the magic-factor tile pattern cannot return; a missing
 * labour match renders `—`, never `0%`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import AgricultureDashboardPage from './AgricultureDashboardPage';
import { useGLStore } from '@/store/glStore';

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString('en-US')}`,
  formatNumber: (v: number) => v.toLocaleString('en-US'),
}));

const seededEntries = [
  {
    id: 'g1',
    accountId: 'a1',
    accountCode: '4000',
    accountName: 'Crop Sales',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 100000,
    netChange: -100000,
    amount: -100000,
    date: '2026-01-15',
    description: 'Revenue',
    reference: 'REF-G1',
  },
  {
    id: 'g2',
    accountId: 'a2',
    accountCode: '6100',
    accountName: 'Harvest Payroll',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 20000,
    credit: 0,
    netChange: 20000,
    amount: 20000,
    date: '2026-01-15',
    description: 'Labor',
    reference: 'REF-G2',
  },
  {
    id: 'g3',
    accountId: 'a3',
    accountCode: '6200',
    accountName: 'Equipment Rental',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 40000,
    credit: 0,
    netChange: 40000,
    amount: 40000,
    date: '2026-01-15',
    description: 'Costs',
    reference: 'REF-G3',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AgricultureDashboardPage />
    </MemoryRouter>
  );
}

describe('AgricultureDashboardPage (fabrication regression lock)', () => {
  it('does not render the invented agronomy literals', () => {
    useGLStore.setState({ entries: seededEntries as never });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).not.toContain('8.5 tons');
    expect(text).not.toContain('$4,600');
    expect(text).not.toContain('4,200');
    expect(text).not.toContain('Active Farms');
    expect(text).not.toContain('Yield per Hectare');
    expect(text).not.toContain('Equipment Utilization');
  });

  it('renders GL-derived margin and the name-matched labor share', () => {
    useGLStore.setState({ entries: seededEntries as never });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    // margin (100k − 60k)/100k and labor share 20k payroll / 60k costs
    expect(text).toContain('40.0%');
    expect(text).toContain('33.3%');
    expect(text).toMatch(/Labor Share of Posted Costs/i);
  });

  it('renders — when no labor-named account matches (absence is not zero)', () => {
    useGLStore.setState({
      entries: [seededEntries[0], seededEntries[2]] as never,
    });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    // The labor row renders an em dash — absence is not a zero share.
    expect(text).toContain('—');
    expect(text).toMatch(/Labor Share of Posted Costs—/);
  });

  it('discloses that agronomy metrics need operational feeds', () => {
    useGLStore.setState({ entries: seededEntries as never });
    renderPage();
    expect(screen.getByText(/Not derivable from this ledger/i)).toBeInTheDocument();
  });

  it('source guard: no target-factor tiles or invented change props may return', () => {
    const source = readFileSync(path.resolve(__dirname, './AgricultureDashboardPage.tsx'), 'utf8');
    expect(source).not.toMatch(/target\s*\*\s*0\.\d+/);
    expect(source).not.toMatch(/change=\{-?\d+(?:\.\d+)?\}/);
    expect(source).not.toContain('agricultureConfig.defaultKPIs');
  });
});
