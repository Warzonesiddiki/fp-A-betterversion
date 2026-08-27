import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EnrollmentRetentionPage from './EnrollmentRetentionPage';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

const enrollmentEntries: GLEntry[] = [
  {
    id: 'e1',
    accountId: '9001',
    accountCode: '9001',
    accountName: 'Total Students Fall',
    period: 'P01',
    periodName: 'January',
    debit: 500,
    credit: 0,
    netChange: 500,
    date: '2026-01-15',
    amount: 500,
    description: 'Enrollment count',
    reference: 'e1',
  },
  {
    id: 'e2',
    accountId: '9002',
    accountCode: '9002',
    accountName: 'Students Retained',
    period: 'P01',
    periodName: 'January',
    debit: 450,
    credit: 0,
    netChange: 450,
    date: '2026-01-15',
    amount: 450,
    description: 'Retention count',
    reference: 'e2',
  },
  {
    id: 'e3',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Tuition Fees',
    period: 'P01',
    periodName: 'January',
    debit: 0,
    credit: 900_000,
    netChange: -900_000,
    date: '2026-01-15',
    amount: 900_000,
    description: 'Tuition',
    reference: 'e3',
  },
];

function unrelatedEntry(): GLEntry {
  return {
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
  };
}

describe('EnrollmentRetentionPage (real-store, vertical truthfulness)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('shows the honest empty state when nothing is posted', () => {
    render(
      <MemoryRouter>
        <EnrollmentRetentionPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/No Enrollment Data/i)).toBeTruthy();
  });

  it('computes retention and revenue-per-student from posted counts', () => {
    useGLStore.setState({ entries: enrollmentEntries });
    render(
      <MemoryRouter>
        <EnrollmentRetentionPage />
      </MemoryRouter>
    );
    // Retention = 450 ÷ 500 = 90.0%
    expect(screen.getByText('90.0%')).toBeInTheDocument();
    // Revenue per student = 900,000 ÷ 500 = 1,800.00 (formatMoney, no symbol)
    expect(screen.getByText('1,800.00')).toBeInTheDocument();
    // Faculty count is not posted → faculty ratio discloses
    expect(screen.getByText('no faculty/student counts posted')).toBeInTheDocument();
  });

  it('never fabricates institutional constants when counts are absent (W-FAB)', () => {
    useGLStore.setState({ entries: [unrelatedEntry()] });
    const { container } = render(
      <MemoryRouter>
        <EnrollmentRetentionPage />
      </MemoryRouter>
    );
    const text = container.textContent ?? '';
    // The previous invented institution is gone:
    expect(text).not.toContain('12,000');
    expect(text).not.toContain('11,400');
    expect(text).not.toContain('24,000,000');
    expect(text).not.toContain('21,600,000');
    expect(text).not.toContain('800');
    // Untracked quantities disclose:
    expect(screen.getAllByText('— not posted').length).toBeGreaterThanOrEqual(3);
  });
});
