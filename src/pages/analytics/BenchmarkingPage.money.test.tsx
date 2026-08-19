import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';

/**
 * Source guard + DOM probe for the benchmarking rewrite (session 024).
 *
 * The pre-session-024 page:
 *   - `Math.abs`-ed every natural-balance group, so a contra posting
 *     (accumulated depreciation, a revenue reversal) INCREASED the balance;
 *   - substituted `|| 1` for every empty denominator, dividing by an
 *     invented dollar;
 *   - rendered the current ratio under the quick-ratio label;
 *   - computed net income without prefixes 7 and 8.
 *
 * The derivation (`benchmarkingData.ts`) runs for real here; only icons are
 * stubbed. Ledger values are the hand-computed known answers from
 * `benchmarkingData.test.ts`.
 */

const LEDGER = [
  { id: '1', accountCode: '4010', debit: 0, credit: 1000000 },
  { id: '2', accountCode: '4010', debit: 40000, credit: 0 },
  { id: '3', accountCode: '5010', debit: 400000, credit: 0 },
  { id: '4', accountCode: '5010', debit: 0, credit: 20000 },
  { id: '5', accountCode: '6010', debit: 300000, credit: 0 },
  { id: '6', accountCode: '7010', debit: 10000, credit: 0 },
  { id: '7', accountCode: '8010', debit: 50000, credit: 0 },
  { id: '8', accountCode: '1010', debit: 500000, credit: 0 },
  { id: '9', accountCode: '1100', debit: 250000, credit: 0 },
  { id: '10', accountCode: '1500', debit: 750000, credit: 0 },
  { id: '11', accountCode: '1590', debit: 0, credit: 100000 },
  { id: '12', accountCode: '2100', debit: 0, credit: 100000 },
  { id: '13', accountCode: '2500', debit: 0, credit: 200000 },
  { id: '14', accountCode: '3010', debit: 0, credit: 400000 },
];

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
}

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import BenchmarkingPage from '@/pages/analytics/BenchmarkingPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/analytics/benchmarking']}>
      <BenchmarkingPage />
    </MemoryRouter>
  );
}

describe('BenchmarkingPage — source guards', () => {
  const pageSrc = stripComments(
    fs.readFileSync(path.resolve(__dirname, './BenchmarkingPage.tsx'), 'utf8')
  );
  const dataSrc = stripComments(
    fs.readFileSync(path.resolve(__dirname, './benchmarkingData.ts'), 'utf8')
  );

  it('never Math.abs a natural balance (page and derivation)', () => {
    expect(pageSrc).not.toMatch(/Math\.abs/);
    expect(dataSrc).not.toMatch(/Math\.abs/);
  });

  it('never substitutes a fabricated $1 denominator', () => {
    expect(pageSrc).not.toMatch(/\|\|\s*1\b/);
    expect(dataSrc).not.toMatch(/\|\|\s*1\b/);
  });

  it('routes money arithmetic through @/utils/money', () => {
    expect(dataSrc).toMatch(/from '@\/utils\/money'/);
    expect(dataSrc).toMatch(/sumMoney/);
    expect(dataSrc).toMatch(/divideMoney/);
  });

  it('pins the quick ratio as permanently non-derivable', () => {
    // assignment pattern, not prose: the derivation returns a literal null.
    expect(dataSrc).toMatch(/quick:\s*null/);
  });
});

describe('BenchmarkingPage — figures come from the ledger', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: LEDGER as never });
  });

  afterEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('renders the known-answer ratios', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('2.50'); // current: 250,000 / 100,000
    expect(text).toContain('0.75'); // debt-to-equity: 300,000 / 400,000
    expect(text).toContain('60.42%'); // gross margin: 580,000 / 960,000
    expect(text).toContain('22.92%'); // net margin: 220,000 / 960,000
    expect(text).toContain('55.00%'); // ROE: 220,000 / 400,000
    expect(text).toContain('0.69'); // asset turnover: 960,000 / 1,400,000
  });

  it('does not render the pre-024 net income that skipped interest and tax', () => {
    const text = renderPage().container.textContent ?? '';
    // Old page: net income 280,000 -> net margin 29.17%.
    expect(text).not.toContain('29.17%');
  });

  it('discloses the quick ratio as not derivable instead of faking it', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Inventory is not posted to a distinguishable account prefix');
  });

  it('empty-states with an h1 when no GL is posted', () => {
    useGLStore.setState({ entries: [] });
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /No data to benchmark/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Import Data/i })).toBeTruthy();
  });
});
