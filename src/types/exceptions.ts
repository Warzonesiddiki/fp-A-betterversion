/**
 * Exception disposition and review types (FR-009) and the accounts-team
 * correction hand-off (FR-010).
 */

export type DispositionStatus = 'ACCEPT' | 'REJECT' | 'REVIEW' | 'ESCALATE';

export interface ExceptionDisposition {
  readonly exceptionId: string;
  readonly ruleId?: string;
  readonly disposition: DispositionStatus;
  readonly rationale: string;
  readonly recordedAt: string;
  readonly recordedBy: string;
  readonly action?: string;
}

export interface ExceptionDispositionAuditRecord extends ExceptionDisposition {
  readonly previousDisposition?: DispositionStatus;
  readonly sequenceNumber: number;
}

/**
 * Where the accounts team stands on a correction the reviewer asked for
 * (FR-010). `REQUESTED → APPLIED` is the normal path; `WITHDRAWN` records a
 * request the reviewer took back. Nothing sets `APPLIED` by itself: only a
 * human action does, because "we asked" is not "it is fixed".
 */
export type CorrectionStatus = 'REQUESTED' | 'APPLIED' | 'WITHDRAWN';

export interface CorrectionRequest {
  readonly exceptionId: string;
  readonly ruleId?: string;
  /** What has to change, in the reviewer's words. Never empty. */
  readonly instruction: string;
  /** Who in the accounts team owns it. Never empty. */
  readonly assignee: string;
  /** Canonical `YYYY-MM-DD`, or `null` for "no date agreed" — never "today". */
  readonly dueDate: string | null;
  /** Where the entry is, so it can be found: e.g. `batch-7 · row 214`. */
  readonly source: string | null;
  readonly status: CorrectionStatus;
  readonly requestedAt: string;
  readonly requestedBy: string;
}

export interface CorrectionAuditRecord extends CorrectionRequest {
  readonly previousStatus?: CorrectionStatus;
  readonly sequenceNumber: number;
}
