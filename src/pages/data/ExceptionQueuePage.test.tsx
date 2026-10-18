/**
 * Phase 3 queue page: the runner's findings over the real GL store,
 * presented as review candidates (never as confirmed errors), with the
 * run's coverage stated on the page (entries examined, journal skips).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExceptionQueuePage from './ExceptionQueuePage';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

function entry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: 'q1',
    accountId: '1010',
    accountCode: '1010',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    amount: 0,
    date: '2026-01-05',
    description: 'ok',
    reference: 'J-1',
    journalId: 'J-1',
    ...overrides,
  } as GLEntry;
}

const PLANTED: GLEntry[] = [
  entry({ id: 'q1', debit: 500, amount: 500 }),
  entry({
    id: 'q2',
    accountId: '4010',
    accountCode: '4010',
    accountName: 'Revenue',
    credit: 450,
    amount: -450,
  }),
];

describe('ExceptionQueuePage (Phase 3)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], accounts: [] });
  });

  it('empty ledger invites an import instead of showing an empty queue', () => {
    render(
      <BrowserRouter>
        <ExceptionQueuePage />
      </BrowserRouter>
    );
    expect(screen.getByText(/No GL Data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
  });

  it('planted unbalanced journal appears as a candidate with coverage stated', () => {
    useGLStore.setState({ entries: PLANTED, accounts: [] });
    render(
      <BrowserRouter>
        <ExceptionQueuePage />
      </BrowserRouter>
    );
    expect(screen.getByText(/2 entries examined/i)).toBeInTheDocument();
    expect(screen.getByText(/R-006@v1/)).toBeInTheDocument();
    expect(screen.getAllByText(/not a confirmed error/i).length).toBeGreaterThan(0);
  });

  it('clean ledger states plainly that no candidates were found', () => {
    useGLStore.setState({
      entries: [
        entry({ id: 'q1', debit: 500, amount: 500 }),
        entry({
          id: 'q2',
          accountId: '4010',
          accountCode: '4010',
          accountName: 'Revenue',
          credit: 500,
          amount: -500,
        }),
      ],
      accounts: [],
    });
    render(
      <BrowserRouter>
        <ExceptionQueuePage />
      </BrowserRouter>
    );
    expect(screen.getByText(/No review candidates/i)).toBeInTheDocument();
  });
});
