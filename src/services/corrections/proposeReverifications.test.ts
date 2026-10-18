/**
 * Phase 5 (DEC-018): after a fix lands, the tool may PROPOSE
 * re-verification — it never sets it. A proposal exists only when the
 * correction is APPLIED and the current rule run no longer raises the
 * finding. A human still confirms every one.
 */
import { describe, it, expect } from 'vitest';
import { proposeReverifications } from './proposeReverifications';
import type { CorrectionRequest } from '@/types/exceptions';
import type { ExceptionFinding } from '@/store/exceptionRuleCatalogue';

function correction(status: CorrectionRequest['status']): CorrectionRequest {
  return {
    exceptionId: 'R-006:J-9:2026-01',
    ruleId: 'R-006',
    instruction: 'Fix J-9',
    assignee: 'accounts-team',
    dueDate: null,
    source: 'batch-7 · row 214',
    status,
    requestedAt: '2026-10-15T09:30:00.000Z',
    requestedBy: 'user',
  };
}

const FINDING = { findingKey: 'R-006:J-9:2026-01' } as ExceptionFinding;

describe('proposeReverifications', () => {
  it('proposes only for APPLIED corrections whose finding disappeared', () => {
    const proposals = proposeReverifications(
      [correction('APPLIED'), correction('REQUESTED')],
      [], // current run raises nothing
      12_345
    );
    expect(proposals).toHaveLength(1);
    expect(proposals[0]?.exceptionId).toBe('R-006:J-9:2026-01');
    expect(proposals[0]?.reason).toContain('no longer flags');
    expect(proposals[0]?.examinedEntries).toBe(12_345);
  });

  it('no proposal while the rule still flags the item', () => {
    expect(proposeReverifications([correction('APPLIED')], [FINDING], 10)).toEqual([]);
  });

  it('no proposal for terminal or already-reverified corrections', () => {
    expect(
      proposeReverifications([correction('REVERIFIED'), correction('WITHDRAWN')], [], 10)
    ).toEqual([]);
  });
});
