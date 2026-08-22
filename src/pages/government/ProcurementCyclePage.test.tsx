import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ProcurementCyclePage from './ProcurementCyclePage';
import { useGLStore } from '@/store/glStore';
import { type GLEntry } from '@/types';

const mockEntries: GLEntry[] = [
  // Contract Value: matches 'procurement', does NOT match 'tender', 'audit', 'cycle', 'contracts'
  {
    id: '1',
    date: '2023-01-15',
    accountName: 'Procurement Base',
    accountCode: '7001',
    amount: 0,
    credit: 0,
    debit: 1999960,
    netChange: 1999960,
    description: 'Base',
    currency: 'USD',
  },
  // Competitively Tendered AND Contract Value: matches 'tender' AND 'award'
  {
    id: '2',
    date: '2023-01-15',
    accountName: 'Award Tender',
    accountCode: '7002',
    amount: 0,
    credit: 0,
    debit: 8000000,
    netChange: 8000000,
    description: 'Tender',
    currency: 'USD',
  },
  // Compliant Audits AND Total Audits: matches 'audit pass'
  {
    id: '3',
    date: '2023-01-15',
    accountName: 'Audit Pass',
    accountCode: '8000',
    amount: 0,
    credit: 0,
    debit: 45,
    netChange: 45,
    description: 'Pass',
    currency: 'USD',
  },
  // Total Audits ONLY: matches 'review'
  {
    id: '4',
    date: '2023-01-15',
    accountName: 'General Review',
    accountCode: '8001',
    amount: 0,
    credit: 0,
    debit: 5,
    netChange: 5,
    description: 'Review',
    currency: 'USD',
  },
  // Cycle Days Sum: matches 'cycle'
  {
    id: '5',
    date: '2023-01-15',
    accountName: 'Cycle Time',
    accountCode: '9000',
    amount: 0,
    credit: 0,
    debit: 1200,
    netChange: 1200,
    description: 'Days',
    currency: 'USD',
  },
  // Contract Count AND Contract Value: matches 'contracts'
  {
    id: '6',
    date: '2023-01-15',
    accountName: 'Contracts Amount',
    accountCode: '9001',
    amount: 0,
    credit: 0,
    debit: 40,
    netChange: 40,
    description: 'Count',
    currency: 'USD',
  },
  // Baseline Spend: matches 'baseline spend'
  {
    id: '7',
    date: '2023-01-15',
    accountName: 'Baseline Spend',
    accountCode: '5001',
    amount: 0,
    credit: 0,
    debit: 2000000,
    netChange: 2000000,
    description: 'Baseline',
    currency: 'USD',
  },
  // Realized Spend: matches 'realized spend'
  {
    id: '8',
    date: '2023-01-15',
    accountName: 'Realized Spend',
    accountCode: '5002',
    amount: 0,
    credit: 0,
    debit: 1800000,
    netChange: 1800000,
    description: 'Realized',
    currency: 'USD',
  },
];

describe('ProcurementCyclePage (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(
      <MemoryRouter>
        <ProcurementCyclePage />
      </MemoryRouter>
    );

    // Competitive Tender Rate: 8M / 10M = 80.0%
    expect(screen.getByText(/80\.0%/)).toBeInTheDocument();

    // Audit Compliance Rate: 45 / 50 = 90.0%
    expect(screen.getByText(/90\.0%/)).toBeInTheDocument();

    // Avg Cycle Time: 1200 / 40 = 30
    expect(screen.getByText(/^30$/)).toBeInTheDocument();

    // Negotiated Savings: 2M - 1.8M = 200,000
    expect(screen.getByText(/200,000/)).toBeInTheDocument();
  });

  it('shows blanks instead of invented records when accounts are absent (W-FAB)', () => {
    useGLStore.setState({
      entries: [
        {
          id: 'm1',
          accountId: '4000',
          accountCode: '4000',
          accountName: 'Unrelated Sales',
          period: 'P01',
          periodName: 'January',
          debit: 0,
          credit: 500,
          netChange: -500,
          date: '2026-01-15',
          amount: 500,
          description: 'Misc',
          reference: 'm1',
        },
      ],
    });
    const { container } = render(
      <MemoryRouter>
        <ProcurementCyclePage />
      </MemoryRouter>
    );
    const text = container.textContent ?? '';
    // The previous invented procurement record is gone:
    expect(text).not.toContain('5,000,000');
    expect(text).not.toContain('4,250,000');
    expect(text).not.toContain('$48'); // compliantAudits fallback
    expect(text).not.toContain('1,350');
    expect(text).not.toContain('6,000,000');
    expect(text).not.toContain('5,700,000');
    // Unposted quantities disclose instead:
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(text).toContain('no audit accounts posted');
    expect(text).toContain('no cycle-time/contract-count accounts posted');
  });
});
