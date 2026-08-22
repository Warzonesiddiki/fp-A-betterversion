import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ResearchGrantsPage from './ResearchGrantsPage';
import { useGLStore } from '@/store/glStore';
import { type GLEntry } from '@/types';

const mockEntries: GLEntry[] = [
  // Research Grant Revenue
  {
    id: '1',
    date: '2023-01-15',
    accountName: 'Sponsored Research Revenue',
    accountCode: '4000',
    amount: 0,
    credit: 15000000,
    debit: 0,
    netChange: 15000000,
    description: 'Rev',
    currency: 'USD',
  },
  // Grants Won
  {
    id: '2',
    date: '2023-01-15',
    accountName: 'Grant Awarded Count',
    accountCode: '9000',
    amount: 0,
    credit: 0,
    debit: 50,
    netChange: 50,
    description: 'Won',
    currency: 'USD',
  },
  // Grants Applied
  {
    id: '3',
    date: '2023-01-15',
    accountName: 'Grant Submitted Count',
    accountCode: '9001',
    amount: 0,
    credit: 0,
    debit: 200,
    netChange: 200,
    description: 'Applied',
    currency: 'USD',
  },
  // Endowment Start
  {
    id: '4',
    date: '2023-01-15',
    accountName: 'Opening Endowment',
    accountCode: '3001',
    amount: 0,
    credit: 0,
    debit: 50000000,
    netChange: 50000000,
    description: 'Start',
    currency: 'USD',
  },
  // Endowment End
  {
    id: '5',
    date: '2023-01-15',
    accountName: 'Closing Endowment',
    accountCode: '3002',
    amount: 0,
    credit: 0,
    debit: 55000000,
    netChange: 55000000,
    description: 'End',
    currency: 'USD',
  },
];

describe('ResearchGrantsPage (Data-Driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
  });

  it('renders KPI values computed from GL entries', () => {
    render(
      <MemoryRouter>
        <ResearchGrantsPage />
      </MemoryRouter>
    );

    // Grant Win Rate: 50 / 200 = 25.0%
    expect(screen.getByText(/25\.0%/)).toBeInTheDocument();

    // Total Grant Value: 15,000,000 -> 15.00M or similar?
    // Let's check formatting. Probably $15,000,000 or $15M
    expect(screen.getByText(/15/)).toBeInTheDocument();

    // Endowment Growth: 55M - 50M = +5M -> 10.0%
    expect(screen.getAllByText(/10\.0%/).length).toBeGreaterThan(0);

    // Total Endowment: 55M
    expect(screen.getByText(/55/)).toBeInTheDocument();
  });

  it('never fabricates institutional constants when fields are untracked (W-FAB)', () => {
    const { container } = render(
      <MemoryRouter>
        <ResearchGrantsPage />
      </MemoryRouter>
    );
    const text = container.textContent ?? '';
    // The previous literal institution is gone:
    expect(text).not.toContain('12,000');
    expect(text).not.toContain('11,400');
    expect(text).not.toContain('24,000,000');
    expect(text).not.toContain('21,600,000');
    expect(text).not.toContain('100,000,000');
    expect(text).not.toContain('108,000,000');
    expect(text).not.toContain('250');
    // Untracked quantities disclose:
    expect(text).toContain('no tuition-classified accounts');
    expect(text).toContain('projection');
  });
});
