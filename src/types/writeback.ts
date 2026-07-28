/**
 * Bidirectional ERP Write-Back Types
 *
 * Defines the contract for pushing financial data FROM FinPlan Pro
 * TO external ERP systems (SAP, Oracle NetSuite, QuickBooks, etc.).
 *
 * DESIGN PRINCIPLE: Every write-back is TRANSACTIONAL — either the entire
 * batch succeeds in the external system, or we roll back and report the
 * precise failure point. Zero partial updates.
 */

// ─── Write-Back Operation Envelope ─────────────────────────────────────────

/** The type of financial record being pushed. */
export type WriteBackRecordType =
  | 'budget'
  | 'journal-entry'
  | 'invoice'
  | 'bill'
  | 'account'
  | 'vendor'
  | 'customer'
  | 'forecast';

/** Direction of the sync operation. */
export type WriteBackDirection = 'push' | 'pull' | 'bidirectional';

/**
 * A single write-back operation targeting one external record.
 * All amounts are in integer cents to avoid floating-point drift.
 */
export interface WriteBackOperation {
  /** Unique operation ID for tracing */
  readonly id: string;
  /** Type of record to write */
  readonly recordType: WriteBackRecordType;
  /** Operation verb */
  readonly action: 'create' | 'update' | 'delete';
  /** External system record ID (null for create) */
  readonly externalId: string | null;
  /** The payload to send to the ERP */
  readonly payload: WriteBackPayload;
  /** Pre-validation state snapshot for rollback */
  readonly preState: Record<string, unknown> | null;
  /** Retry count (0 = first attempt) */
  readonly retryCount: number;
  /** Maximum retries before hard failure */
  readonly maxRetries: number;
}

/**
 * Payload for a write-back operation.
 * Uses Record<string, unknown> because each ERP has different field shapes.
 * The connector adapter maps this to the ERP-specific schema.
 */
export interface WriteBackPayload {
  readonly recordType: WriteBackRecordType;
  readonly fields: Record<string, unknown>;
  readonly metadata: WriteBackMetadata;
}

/**
 * Metadata attached to every write-back payload for audit trail.
 */
export interface WriteBackMetadata {
  /** User who initiated the write-back */
  readonly userId: string;
  /** Timestamp of the operation */
  readonly timestamp: string;
  /** Source module (e.g., 'budget-store', 'forecast-engine') */
  readonly source: string;
  /** FinPlan Pro internal record ID */
  readonly internalId: string;
  /** Version of the record being pushed */
  readonly version: number;
  /** Optional correlation ID for batch operations */
  readonly correlationId?: string;
}

// ─── Transaction Envelope ──────────────────────────────────────────────────

/**
 * A transaction groups multiple WriteBackOperations into an atomic unit.
 * ALL operations must succeed, or ALL are rolled back.
 */
export interface WriteBackTransaction {
  /** Unique transaction ID */
  readonly id: string;
  /** Target ERP connector ID */
  readonly connectorId: string;
  /** Operations in execution order */
  readonly operations: readonly WriteBackOperation[];
  /** Transaction status */
  readonly status: WriteBackTransactionStatus;
  /** When the transaction was created */
  readonly createdAt: string;
  /** When the transaction completed (success or failure) */
  readonly completedAt: string | null;
  /** Error details if status is 'failed' or 'rolled-back' */
  readonly error: WriteBackError | null;
  /** Results of successful operations */
  readonly results: readonly WriteBackResult[];
}

export type WriteBackTransactionStatus =
  | 'pending'
  | 'validating'
  | 'executing'
  | 'committed'
  | 'failed'
  | 'rolled-back'
  | 'partial-rollback';

/**
 * Result of a single successful write-back operation.
 */
export interface WriteBackResult {
  /** The operation that was executed */
  readonly operationId: string;
  /** External system record ID (assigned by ERP) */
  readonly externalId: string;
  /** Timestamp of the write */
  readonly committedAt: string;
  /** Any warnings from the ERP (non-fatal) */
  readonly warnings: readonly string[];
}

/**
 * Error details for a failed write-back operation.
 */
export interface WriteBackError {
  /** Error code (e.g., 'VALIDATION_FAILED', 'ERP_REJECTED', 'NETWORK_TIMEOUT') */
  readonly code: string;
  /** Human-readable error message */
  readonly message: string;
  /** The specific operation that failed */
  readonly failedOperationId: string | null;
  /** Whether the error is retryable */
  readonly retryable: boolean;
  /** Raw error from the ERP API */
  readonly rawError: unknown;
}

// ─── Connector Write-Back Contract ─────────────────────────────────────────

/**
 * Interface that all ERP connectors must implement for write-back support.
 * Extends the read-only BaseConnector with push capabilities.
 */
export interface WriteBackCapable {
  /**
   * Validate a batch of operations before executing.
   * Returns validation errors for any operations that would fail.
   */
  validateWriteBack(
    operations: readonly WriteBackOperation[]
  ): Promise<readonly WriteBackValidationError[]>;

  /**
   * Execute a transaction atomically.
   * Throws WriteBackError on failure; connector handles rollback.
   */
  executeWriteBack(transaction: WriteBackTransaction): Promise<readonly WriteBackResult[]>;

  /**
   * Roll back a previously committed transaction.
   * Used when post-commit validation detects data integrity issues.
   */
  rollbackWriteBack(transactionId: string, results: readonly WriteBackResult[]): Promise<void>;

  /**
   * Check if the connector supports write-back for a given record type.
   */
  supportsWriteBack(recordType: WriteBackRecordType): boolean;
}

/**
 * Validation error from pre-execution checks.
 */
export interface WriteBackValidationError {
  readonly operationId: string;
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

// ─── Write-Back Store Shape ────────────────────────────────────────────────

/**
 * State shape for the write-back store.
 * Tracks pending, in-flight, and completed transactions.
 */
export interface WriteBackState {
  /** Pending transactions queued for execution */
  readonly pendingTransactions: readonly WriteBackTransaction[];
  /** Currently executing transaction (only one at a time) */
  readonly activeTransaction: WriteBackTransaction | null;
  /** Completed transaction history (last 100) */
  readonly history: readonly WriteBackTransaction[];
  /** Whether a write-back is in progress */
  readonly isExecuting: boolean;
  /** Last error from any transaction */
  readonly lastError: WriteBackError | null;
}
