// src/components/audit/StateReconstructionPanel.test.tsx
// Phase 12 tail (R-009): the panel rebuilds cell state from the real audit
// store's trail and shows it; a tampered trail produces a refusal, not data.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { StateReconstructionPanel } from './StateReconstructionPanel';
import { useAuditTrailStore, AUDIT_CHAIN_GENESIS_HASH } from '@/store/auditTrailStore';
import { setClock, resetClock } from '@/utils/clock';

const cellA = {
  cube: 'gl',
  coords: { account: '1000' },
  measure: 'value',
  sectorId: 'revenue',
  scenarioId: 'Actual',
  periodId: '2026Q2',
  lineItemId: 'revenue',
};

beforeEach(() => {
  useAuditTrailStore.setState({
    entries: [],
    chainHead: AUDIT_CHAIN_GENESIS_HASH,
    currentUserRole: 'viewer',
  });
});
afterEach(() => resetClock());

describe('StateReconstructionPanel', () => {
  it('rebuilds and displays cell state from the trail', () => {
    useAuditTrailStore.getState().recordWrite({
      cellId: cellA,
      userId: 'controller@finplan.io',
      operation: 'write',
      dataType: 'number',
      newValue: 1250,
    });
    render(<StateReconstructionPanel />);
    fireEvent.click(screen.getByRole('button', { name: /reconstruct/i }));
    expect(screen.getByText(/chain verified/i)).toBeInTheDocument();
    expect(screen.getByText(/1250/)).toBeInTheDocument();
  });

  it('honours the as-of cutoff', () => {
    setClock('2026-01-01T09:00:00.000Z');
    useAuditTrailStore.getState().recordWrite({
      cellId: cellA,
      userId: 'controller@finplan.io',
      operation: 'write',
      dataType: 'number',
      newValue: 1000,
    });
    setClock('2026-01-05T09:00:00.000Z');
    useAuditTrailStore.getState().recordUpdate({
      cellId: cellA,
      userId: 'controller@finplan.io',
      operation: 'update',
      dataType: 'number',
      previousValue: 1000,
      newValue: 1250,
    });
    render(<StateReconstructionPanel />);
    fireEvent.change(screen.getByLabelText(/as of/i), { target: { value: '2026-01-02T00:00' } });
    fireEvent.click(screen.getByRole('button', { name: /reconstruct/i }));
    expect(screen.getByText(/1000/)).toBeInTheDocument();
    expect(screen.queryByText(/1250/)).not.toBeInTheDocument();
  });

  it('refuses a tampered trail instead of showing data', () => {
    useAuditTrailStore.getState().recordWrite({
      cellId: cellA,
      userId: 'controller@finplan.io',
      operation: 'write',
      dataType: 'number',
      newValue: 1000,
    });
    const entries = useAuditTrailStore.getState().entries.map((e) => ({ ...e, newValue: 1 }));
    useAuditTrailStore.setState({ entries });
    render(<StateReconstructionPanel />);
    fireEvent.click(screen.getByRole('button', { name: /reconstruct/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/refused/i);
  });

  it('states plainly when there is no trail yet', () => {
    render(<StateReconstructionPanel />);
    expect(screen.getByText(/no audit entries/i)).toBeInTheDocument();
  });
});
