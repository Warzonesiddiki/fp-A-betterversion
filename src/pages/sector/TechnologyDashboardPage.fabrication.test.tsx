/**
 * Vertical truthfulness sweep (wave 2) — fabrication regression lock for
 * TechnologyDashboardPage.
 *
 * The pre-sweep page rendered config tiles as `target × 0.87` with an
 * invented `change={-7}` plus hand-typed SaaS literals (ARR $43,500,000 ·
 * NRR 115% · logo churn 5.8% · gross margin 72% · LTV/CAC 2.8× · magic
 * number 0.68 · quick ratio 3.5 · Rule of 40 = 38). This lock pins the
 * post-sweep contract: only GL-derived figures appear, the SaaS metrics are
 * disclosed as not derivable, and the magic-factor tile pattern cannot
 * return.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import TechnologyDashboardPage from './TechnologyDashboardPage';
import { useGLStore } from '@/store/glStore';

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString('en-US')}`,
  formatNumber: (v: number) => v.toLocaleString('en-US'),
}));

const seededEntries = [
  {
    id: 't1',
    accountId: 'a1',
    accountCode: '4000',
    accountName: 'Subscription Revenue',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 100000,
    netChange: -100000,
    amount: -100000,
    date: '2026-01-15',
    description: 'Revenue',
    reference: 'REF-T1',
  },
  {
    id: 't2',
    accountId: 'a2',
    accountCode: '6000',
    accountName: 'Cloud Costs',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 60000,
    credit: 0,
    netChange: 60000,
    amount: 60000,
    date: '2026-01-15',
    description: 'Costs',
    reference: 'REF-T2',
  },
] as never;

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <TechnologyDashboardPage />
    </MemoryRouter>
  );
}

describe('TechnologyDashboardPage (fabrication regression lock)', () => {
  it('does not render the invented ARR/NRR/churn/LTV-CAC/magic-number literals', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).not.toContain('$43,500,000');
    expect(text).not.toContain('115%');
    expect(text).not.toContain('2.8x');
    expect(text).not.toContain('0.68');
    expect(text).not.toContain('Logo Churn');
  });

  it('renders GL-derived revenue, costs and margin instead', () => {
    useGLStore.setState({ entries: seededEntries });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('$100,000');
    expect(text).toContain('$60,000');
    expect(text).toContain('40.0%');
  });

  it('discloses the subscription-billing gap instead of estimating it', () => {
    useGLStore.setState({ entries: seededEntries });
    renderPage();
    expect(screen.getByText(/Not derivable from this ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/contract-level billing data/i)).toBeInTheDocument();
  });

  it('source guard: no target-factor tiles or invented change props may return', () => {
    const source = readFileSync(path.resolve(__dirname, './TechnologyDashboardPage.tsx'), 'utf8');
    expect(source).not.toMatch(/target\s*\*\s*0\.\d+/);
    expect(source).not.toMatch(/change=\{-?\d+(?:\.\d+)?\}/);
    expect(source).not.toContain('technologyConfig.defaultKPIs');
  });
});
