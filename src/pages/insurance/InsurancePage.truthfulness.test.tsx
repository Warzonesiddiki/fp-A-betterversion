/**
 * Vertical truthfulness sweep (wave 2) — truthfulness lock for InsurancePage.
 *
 * The KPI grid previously labelled the number of loss-pick rows in the
 * actuarial store as "Policies". A general ledger records amounts, not
 * contracts, and this app has no policy-administration store; counting
 * actuarial loss picks as policies mislabeled the one figure it did have.
 * This lock pins the corrected contract: the tile reads "Loss Picks", its
 * value is exactly the store's row count, and no "Policies" tile exists.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import InsurancePage from './InsurancePage';
import { useGLStore } from '@/store/glStore';
import { useInsuranceStore } from '@/store/insuranceStore';

const glEntries = [
  {
    id: 'i1',
    accountId: 'a1',
    accountCode: '4100',
    accountName: 'Written Premium',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 50000,
    netChange: -50000,
    amount: -50000,
    date: '2026-01-15',
    description: 'Premium',
    reference: 'REF-I1',
  },
] as never;

describe('InsurancePage (truthfulness lock)', () => {
  it('labels the loss-pick count as loss picks, not policies', () => {
    useGLStore.setState({ entries: glEntries });
    useInsuranceStore.setState({
      lossPicks: [
        { line: 'Auto', pick: '1000', ultimate: '1100', dev: '10%', credibility: 'High' },
        { line: 'Home', pick: '500', ultimate: '520', dev: '4%', credibility: 'Medium' },
      ],
    });
    render(
      <MemoryRouter>
        <InsurancePage />
      </MemoryRouter>
    );
    expect(screen.getByText('Loss Picks')).toBeInTheDocument();
    expect(screen.queryByText('Policies')).not.toBeInTheDocument();
    expect(screen.getByText('loss-pick rows on file')).toBeInTheDocument();
    // The value is the exact row count of the actuarial store.
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('discloses an empty loss-pick store instead of implying policy data', () => {
    useGLStore.setState({ entries: glEntries });
    useInsuranceStore.setState({ lossPicks: [] });
    render(
      <MemoryRouter>
        <InsurancePage />
      </MemoryRouter>
    );
    expect(screen.getByText('no loss picks recorded')).toBeInTheDocument();
  });
});
