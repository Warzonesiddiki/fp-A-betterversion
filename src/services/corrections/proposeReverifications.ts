/**
 * Phase 5 (DEC-018): proposed re-verifications. When a correction is
 * APPLIED and the current rule run no longer raises its finding, the tool
 * attaches a proposal — evidence that the flag has gone quiet. It never
 * confirms anything: a human reads the proposal and sets REVERIFIED.
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
  const stillFlagged = new Set(currentFindings.map((f) => f.findingKey));
  return corrections
    .filter((c) => c.status === 'APPLIED' && !stillFlagged.has(c.exceptionId))
    .map((c) => ({
      exceptionId: c.exceptionId,
      reason: `The current rule run no longer flags this item across ${examinedEntries.toLocaleString()} examined entries. Confirm the fix in the ledger, then mark it re-verified.`,
      examinedEntries,
    }))
    .sort((a, b) => a.exceptionId.localeCompare(b.exceptionId));
}
