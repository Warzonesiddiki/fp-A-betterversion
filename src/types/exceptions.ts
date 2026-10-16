/**
 * Exception disposition and review types (FR-009).
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
