/**
 * Phase 5 (DEC-035): proposed re-verifications. When a correction is
 * APPLIED and the current rule run no longer raises its finding, the tool
 * attaches a review cue — not proof that the correction worked. It never
 * confirms anything: a human checks the underlying ledger evidence and sets
 * REVERIFIED.
 */
import type { CorrectionRequest } from '@/types/exceptions';
import type { ExceptionFinding } from '@/store/exceptionRuleCatalogue';

export interface ReverificationProposal {
  readonly exceptionId: string;
  readonly reason: string;
  /** Entries the current run examined when it stopped flagging the item. */
  readonly examinedEntries: number;
}

export function proposeReverifications(
  corrections: readonly CorrectionRequest[],
  currentFindings: readonly ExceptionFinding[],
  examinedEntries: number
): ReverificationProposal[] {
  // An empty run means there is no current ledger evidence. Absence of a
  // finding in zero rows must never be presented as progress toward a fix.
  if (!Number.isFinite(examinedEntries) || examinedEntries <= 0) return [];

  const stillFlagged = new Set(currentFindings.map((f) => f.findingKey));
  return corrections
    .filter((c) => c.status === 'APPLIED' && !stillFlagged.has(c.exceptionId))
    .map((c) => ({
      exceptionId: c.exceptionId,
      reason: `The current rule run no longer flags this item across ${examinedEntries.toLocaleString()} examined entries. This is a review cue, not proof of correction: verify the underlying ledger entry and source evidence before marking it re-verified.`,
      examinedEntries,
    }))
    .sort((a, b) => a.exceptionId.localeCompare(b.exceptionId));
}
