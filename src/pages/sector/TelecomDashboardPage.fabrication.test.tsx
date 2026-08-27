/**
 * Vertical truthfulness sweep (wave 2) — fabrication regression lock for
 * TelecomDashboardPage.
 *
 * The pre-sweep page rendered config tiles as `target × 0.95` with an
 * invented `change={-1}` plus hand-typed subscriber and network literals
 * (ARPU $42.80 · churn 1.8% · growth +3.2% · SAC $185 · utilisation 78.4% ·
 * data usage 16.8 GB · EBITDA/user $11.40). This lock pins the post-sweep
 * contract: GL-derived figures only, subscriber/network metrics disclosed
 * as not derivable, and the magic-factor tile pattern cannot return.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import TelecomDashboardPage from './TelecomDashboardPage';
import { useGLStore } from '@/store/glStore';

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString('en-US')}`,
  formatNumber: (v: number) => v.toLocaleString('en-US'),
}));

const seededEntries = [
  {
    id: 'c1',
    accountId: 'a1',
    accountCode: '4000',
    accountName: 'Service Revenue',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 100000,
    netChange: -100000,
    amount: -100000,
    date: '2026-01-15',
    description: 'Revenue',
    reference: 'REF-C1',
  },
  {
    id: 'c2',
    accountId: 'a2',
    accountCode: '1500',
    accountName: 'Capital Expenditure',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 40000,
    credit: 0,
    netChange: 40000,
    amount: 40000,
    date: '2026-01-15',
    description: 'Capex',
    reference: 'REF-C2',
  },
  {
    id: 'c3',
    accountId: 'a3',
    accountCode: '6000',
    accountName: 'Operations Expense',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 30000,
    credit: 0,
    netChange: 30000,
    amount: 30000,
    date: '2026-01-15',
    description: 'Opex',
    reference: 'REF-C3',
  },
] as never;

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <TelecomDashboardPage />
    </MemoryRouter>
  );
}

describe('TelecomDashboardPage (fabrication regression lock)', () => {
  it('does not render the invented ARPU/churn/SAC/utilisation literals', () => {
    useGLStore.setState({ entries: seededEntries });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).not.toContain('$42.80');
    expect(text).not.toContain('1.8%');
    expect(text).not.toContain('+3.2%');
    expect(text).not.toContain('$185');
    expect(text).not.toContain('78.4%');
    expect(text).not.toContain('$11.40');
    expect(text).not.toContain('Network Utilization');
  });

  it('renders the real CAPEX/revenue ratio from posted amounts', () => {
    useGLStore.setState({ entries: seededEntries });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    // capex 40,000 / revenue 100,000 = 40.0%
    expect(text).toContain('CAPEX / Revenue');
    expect(text).toContain('40.0%');
    expect(text).toContain('Operating Surplus');
    expect(text).toContain('$70,000'); // revenue − opex = 100k − 30k
  });

  it('discloses that ARPU/churn/telemetry need feeds the ledger lacks', () => {
    useGLStore.setState({ entries: seededEntries });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toMatch(/Not derivable from this ledger/i);
    expect(text).toMatch(/subscriber counts and billing events/i);
    expect(text).toMatch(/network telemetry/i);
  });

  it('source guard: no target-factor tiles or invented change props may return', () => {
    const source = readFileSync(path.resolve(__dirname, './TelecomDashboardPage.tsx'), 'utf8');
    expect(source).not.toMatch(/target\s*\*\s*0\.\d+/);
    expect(source).not.toMatch(/change=\{-?\d+(?:\.\d+)?\}/);
    expect(source).not.toContain('telecomConfig.defaultKPIs');
  });
});
