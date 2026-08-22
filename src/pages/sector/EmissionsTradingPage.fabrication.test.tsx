/**
 * Vertical truthfulness sweep (wave 2) — fabrication regression lock for the
 * routed sector copy of EmissionsTradingPage.
 *
 * This copy still carried the portfolio/compliance cards its `energy/` twin
 * shed in session 028: 12,500 / 8,200 / 4,300 tCO2e holdings, a $28.50
 * average price, a 15,000 tCO2e obligation, 83.3% compliance and a $75,000
 * estimated penalty. No store records an allowance position, market price or
 * regulatory cap. This lock pins the post-sweep contract: ledger amounts
 * only (labelled as currency, not tonnes), empty-state/disclosure cards for
 * inventory and compliance, and no physical-tonne or penalty literals.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EmissionsTradingPage from './EmissionsTradingPage';
import { useGLStore } from '@/store/glStore';

vi.mock('@/utils/formatters', () => ({
  formatCurrency: (v: number) => `$${v.toLocaleString('en-US')}`,
  formatNumber: (v: number) => v.toLocaleString('en-US'),
}));

const seededEntries = [
  {
    id: 'e1',
    accountId: 'a1',
    accountCode: '5400',
    accountName: 'Carbon Credit Purchase',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 9000,
    credit: 0,
    netChange: 9000,
    amount: 9000,
    date: '2026-01-15',
    description: 'Carbon',
    reference: 'REF-E1',
  },
  {
    id: 'e2',
    accountId: 'a2',
    accountCode: '5410',
    accountName: 'Offset Program Payment',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 4000,
    credit: 0,
    netChange: 4000,
    amount: 4000,
    date: '2026-01-15',
    description: 'Offset',
    reference: 'REF-E2',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <EmissionsTradingPage />
    </MemoryRouter>
  );
}

describe('EmissionsTradingPage sector copy (fabrication regression lock)', () => {
  it('does not render the invented allowance inventory or compliance literals', () => {
    useGLStore.setState({ entries: seededEntries as never });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).not.toContain('tCO2e');
    expect(text).not.toContain('$28.50');
    expect(text).not.toContain('83.3%');
    expect(text).not.toContain('$75,000');
    expect(text).not.toContain('Estimated Penalty');
    expect(text).not.toContain('Compliance Rate');
    expect(text).not.toContain('Credits Retired');
  });

  it('renders posted carbon/offset amounts as currency with an explicit basis note', () => {
    useGLStore.setState({ entries: seededEntries as never });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('$9,000');
    expect(text).toContain('$4,000');
    expect(text).toContain('$5,000'); // net position
    expect(text).toMatch(/posted\s+currency amounts/i);
    expect(text).toMatch(/not holdings in tCO/i);
  });

  it('discloses that allowance registry and regulator records are required', () => {
    useGLStore.setState({ entries: seededEntries as never });
    renderPage();
    expect(screen.getByText(/No allowance positions are recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/allowance registry and a stated market price/i)).toBeInTheDocument();
    expect(screen.getByText(/regulator record/i)).toBeInTheDocument();
  });

  it('keeps the honest empty state when nothing matches', () => {
    useGLStore.setState({
      entries: [
        {
          id: 'x1',
          accountId: 'ax',
          accountCode: '4000',
          accountName: 'Office Rent',
          period: '2026-01',
          periodName: 'Jan 2026',
          debit: 1000,
          credit: 0,
          netChange: 1000,
          amount: 1000,
          date: '2026-01-15',
          description: 'Rent',
          reference: 'REF-X1',
        },
      ] as never,
    });
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('$0');
    expect(text).toContain('Matched Entries');
  });

  it('source guard: fabricated compliance/portfolio rows cannot return', () => {
    const source = readFileSync(path.resolve(__dirname, './EmissionsTradingPage.tsx'), 'utf8');
    expect(source).not.toMatch(/tCO2e/);
    expect(source).not.toMatch(/Estimated Penalty|Compliance Rate|Regulatory Obligation/);
    expect(source).not.toMatch(/12,500|8,200|4,300|\$28\.50|\$75,000/);
  });
});
