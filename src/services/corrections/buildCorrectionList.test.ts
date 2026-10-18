/**
 * Phase 5 (DEC-018): the Excel correction list is generated from the same
 * store records the screen shows — this test ties every exported cell
 * back to the store, so the hand-off can never drift from the tracker.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildCorrectionList } from './buildCorrectionList';
import { runExceptionRules, type ExceptionEntryInput } from '@/services/exceptions/runExceptionRules';
import { useExceptionDispositionStore } from '@/store/exceptionDispositionStore';
import { setClock, resetClock } from '@/utils/clock';
import type { CorrectionRequest } from '@/types/exceptions';

const FIXED = '2026-10-15T09:30:00.000Z';

const ENTRIES: ExceptionEntryInput[] = [
  {
    id: 'e1',
    journalId: 'J-9',
    date: '2026-01-07',
    period: '2026-01',
    accountCode: '2010',
    accountName: 'AP',
    debit: 500,
    credit: 0,
    description: 'invoice',
    reference: 'J-9',
    provenance: { batchId: 'batch-7', sourceFile: 'jan.csv', sourceRow: 214 },
  },
  {
    id: 'e2',
    journalId: 'J-9',
    date: '2026-01-07',
    period: '2026-01',
    accountCode: '6010',
    accountName: 'Rent',
    debit: 0,
    credit: 450,
    description: 'rent',
    reference: 'J-9',
    provenance: { batchId: 'batch-7', sourceFile: 'jan.csv', sourceRow: 215 },
  },
];

function seedCorrection(): CorrectionRequest {
  const findings = runExceptionRules(ENTRIES).findings;
  const unbal = findings.find((f) => f.ruleId === 'R-006')!;
  return useExceptionDispositionStore.getState().requestCorrection({
    exceptionId: unbal.findingKey,
    ruleId: 'R-006',
    instruction: 'Find the missing 50 credit and re-post J-9',
    assignee: 'accounts-team',
    dueDate: '2026-10-31',
    source: 'batch-7 · row 214',
  });
}

describe('buildCorrectionList — store == Excel tie-out (DEC-018)', () => {
  beforeEach(() => {
    setClock(FIXED);
    useExceptionDispositionStore.getState().reset();
  });
  afterEach(() => resetClock());

  it('exports exactly the store records, field by field', () => {
    const correction = seedCorrection();
    const findings = runExceptionRules(ENTRIES).findings;
    const data = buildCorrectionList({
      corrections: useExceptionDispositionStore.getState().getCorrections(),
      findings,
      entries: ENTRIES,
    });

    expect(data.headers).toEqual([
      'Finding key',
      'Rule',
      'Account',
      'Date',
      'Amount',
      'Source (file · batch · row)',
      'Suspected issue',
      'Correction instruction',
      'Assignee',
      'Due date',
      'Status',
      'Requested',
    ]);
    expect(data.rows).toHaveLength(1);
    const row = Object.fromEntries(data.headers.map((h, i) => [h, data.rows[0]![i]]));
    expect(row['Finding key']).toBe(correction.exceptionId);
    expect(row['Rule']).toBe('R-006');
    expect(row['Account']).toBe('2010');
    expect(row['Date']).toBe('2026-01-07');
    expect(row['Amount']).toBe(50);
    expect(row['Source (file · batch · row)']).toBe('jan.csv · batch-7 · row 214');
    expect(String(row['Suspected issue'])).toContain('out of balance by 50');
    expect(String(row['Suspected issue'])).toContain('not a confirmed error');
    expect(row['Correction instruction']).toBe(correction.instruction);
    expect(row['Assignee']).toBe(correction.assignee);
    expect(row['Due date']).toBe('2026-10-31');
    expect(row['Status']).toBe('REQUESTED');
    expect(row['Requested']).toBe(correction.requestedAt);
  });

  it('a finding the current run no longer raises is stated, not dropped', () => {
    seedCorrection();
    const data = buildCorrectionList({
      corrections: useExceptionDispositionStore.getState().getCorrections(),
      findings: [], // the fix landed; the rule is silent now
      entries: ENTRIES,
    });
    expect(data.rows).toHaveLength(1);
    expect(String(data.rows[0]![6])).toContain('no longer raised');
  });

  it('empty store exports headers and no rows — never fabricated corrections', () => {
    const data = buildCorrectionList({ corrections: [], findings: [], entries: [] });
    expect(data.rows).toEqual([]);
    expect(data.headers.length).toBeGreaterThan(0);
  });
});
