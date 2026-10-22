/**
 * @vitest-environment jsdom
 *
 * The quarantine surface (DEC-057) — the other half of the hydrate gate.
 *
 * A held-back row is correctly out of every `Money` total, but "correctly zero"
 * and "silently zero" look identical on screen. This file pins the sentence the
 * user actually reads, the counts behind it, and the two failure modes that
 * would make it dishonest:
 *
 *   - showing the notice when nothing is quarantined (crying wolf);
 *   - showing it without the row id and the exact stored value (a report that
 *     cannot be acted on).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  LedgerQuarantineNotice,
  QUARANTINE_REASON_LIMIT,
  summarizeQuarantinedLedger,
} from './LedgerQuarantineNotice';
import { useGLStore } from '@/store/glStore';
import type { UnrepresentableAmount, QuarantinedLedgerRow } from '@/utils/ledgerHydration';

vi.mock('@/utils/tauriSqlStorage', () => ({
  tauriSqlStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
  isTauri: async () => false,
}));

function row(
  rowId: string,
  issues: UnrepresentableAmount[],
  rowIndex = 0
): QuarantinedLedgerRow<Record<string, unknown>> {
  return { row: { id: rowId }, rowId, rowIndex, issues };
}

function reset() {
  useGLStore.setState({ quarantinedEntries: [] });
}

describe('summarizeQuarantinedLedger', () => {
  beforeEach(reset);

  it('counts rows once and issues individually, and names the field for every issue', () => {
    const summary = summarizeQuarantinedLedger([
      row('a', [{ field: 'debit', canonical: '0.004', reason: 'sub-cent' }]),
      row('b', [
        { field: 'credit', canonical: '123.456', reason: 'sub-cent' },
        { field: 'amount', canonical: 'n/a', reason: 'unparseable' },
      ]),
    ]);

    // Two rows, three offending amounts — the two counts are not the same thing.
    expect(summary.rowCount).toBe(2);
    expect(summary.issueCount).toBe(3);
    expect(summary.byField).toEqual({ debit: 1, credit: 1, netChange: 0, amount: 1 });
  });

  it('carries the row id and the exact stored value, never a rounded one', () => {
    const summary = summarizeQuarantinedLedger([
      row('JE-42', [{ field: 'debit', canonical: '0.004', reason: 'sub-cent' }]),
    ]);

    expect(summary.reasons).toEqual([
      'Entry JE-42: debit 0.004 cannot be represented at 2 decimal places',
    ]);
    // The rounded value must not appear anywhere: 0.00 is the number the user
    // must NOT be told their ledger holds.
    expect(summary.reasons.join(' ')).not.toContain('0.00 ');
  });

  it('is empty, not zero-filled, for an empty ledger', () => {
    expect(summarizeQuarantinedLedger([])).toEqual({
      rowCount: 0,
      issueCount: 0,
      reasons: [],
      byField: { debit: 0, credit: 0, netChange: 0, amount: 0 },
    });
  });
});

describe('LedgerQuarantineNotice', () => {
  beforeEach(reset);

  it('renders nothing when no row is held back', () => {
    const { container } = render(<LedgerQuarantineNotice />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('states the count, the effect on totals, and the exact reason', () => {
    useGLStore.setState({
      quarantinedEntries: [
        row('JE-1', [{ field: 'debit', canonical: '0.005', reason: 'sub-cent' }], 0),
      ],
    });

    render(<LedgerQuarantineNotice />);

    expect(screen.getByRole('status')).toHaveAccessibleName('Ledger rows excluded from totals');
    expect(screen.getByText(/1 ledger row held back from the totals on this page/)).toBeTruthy();
    expect(
      screen.getByText(/an amount that cannot be represented at 2 decimal places/)
    ).toBeTruthy();
    // The consequence, stated: the totals are smaller, and by what.
    expect(screen.getByText(/excluded from every money total/)).toBeTruthy();
    expect(screen.getByText(/not rounded, not repaired/)).toBeTruthy();
    expect(
      screen.getByText('Entry JE-1: debit 0.005 cannot be represented at 2 decimal places')
    ).toBeTruthy();
  });

  it('uses the plural copy for several rows and truncates a long list honestly', () => {
    const many = Array.from({ length: QUARANTINE_REASON_LIMIT + 3 }, (_, index) =>
      row(
        `JE-${index}`,
        [{ field: 'credit', canonical: '0.001', reason: 'sub-cent' as const }],
        index
      )
    );
    useGLStore.setState({ quarantinedEntries: many });

    render(<LedgerQuarantineNotice />);

    expect(
      screen.getByText(new RegExp(`${many.length} ledger rows held back from the totals`))
    ).toBeTruthy();
    expect(screen.getByText('and 3 more')).toBeTruthy();
  });
});
