/**
 * Vertical truthfulness sweep (wave 2) — fabrication regression lock for
 * HospitalityDashboardPage.
 *
 * The pre-sweep page rendered config tiles as `target × 0.91` with an
 * invented `change={-5}` plus hand-typed lodging literals (RevPAR $132 ·
 * ADR $165 · occupancy 80% · guest satisfaction 8.7/10 · GOPPAR $58 ·
 * F&B margin 28% · labour 27% of revenue · total properties 14). This
 * lock pins the post-sweep contract: GL-derived figures plus a disclosed
 * name-matched labour share only; room-night denominators stay disclosed
 * as missing because no PMS feed exists; the magic-factor tile pattern
 * cannot return.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import HospitalityDashboardPage from './HospitalityDashboardPage';
import { useGLStore } from '@/store/glStore';

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString('en-US')}`,
  formatNumber: (v: number) => v.toLocaleString('en-US'),
}));

const seededEntries = [
  {
    id: 'h1',
    accountId: 'a1',
    accountCode: '4000',
    accountName: 'Room Revenue',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 100000,
    netChange: -100000,
    amount: -100000,
    date: '2026-01-15',
    description: 'Revenue',
    reference: 'REF-H1',
  },
  {
    id: 'h2',
    accountId: 'a2',
    accountCode: '6100',
    accountName: 'Housekeeping Payroll',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 20000,
    credit: 0,
    netChange: 20000,
    amount: 20000,
    date: '2026-01-15',
    description: 'Labor',
    reference: 'REF-H2',
  },
  {
    id: 'h3',
    accountId: 'a3',
    accountCode: '6200',
    accountName: 'Property Supplies',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 40000,
    credit: 0,
    netChange: 40000,
    amount: 40000,
    date: '2026-01-15',
    description: 'Costs',
    reference: 'REF-H3',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <HospitalityDashboardPage />
    </MemoryRouter>
  );
}

describe('HospitalityDashboardPage (fabrication regression lock)', () => {
  it('does not render the invented lodging literals', () => {
    useGLStore.setState({ entries: seededEntries as never });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).not.toContain('$132');
    expect(text).not.toContain('$165');
    expect(text).not.toContain('80%');
    expect(text).not.toContain('8.7/10');
    expect(text).not.toContain('$58');
    expect(text).not.toContain('28%');
    expect(text).not.toContain('Occupancy Rate');
    expect(text).not.toContain('Total Properties');
    expect(text).not.toContain('Guest Satisfaction');
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

  it('discloses that RevPAR/ADR/occupancy need a PMS feed', () => {
    useGLStore.setState({ entries: seededEntries as never });
    renderPage();
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/Not derivable from this ledger/i);
    expect(text).toMatch(/room-nights/i);
    expect(text).toMatch(/property-management system/i);
  });

  it('source guard: no target-factor tiles or invented change props may return', () => {
    const source = readFileSync(path.resolve(__dirname, './HospitalityDashboardPage.tsx'), 'utf8');
    expect(source).not.toMatch(/target\s*\*\s*0\.\d+/);
    expect(source).not.toMatch(/change=\{-?\d+(?:\.\d+)?\}/);
    expect(source).not.toContain('hospitalityConfig.defaultKPIs');
  });
});
