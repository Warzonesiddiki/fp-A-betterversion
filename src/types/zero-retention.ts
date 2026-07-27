/**
 * Zero-Retention Data Policy Types — Outbound Data Governance
 *
 * Ensures that when data leaves FinPlan Pro (via AI copilot, API calls,
 * exports, or integrations), it complies with zero-retention policies.
 *
 * Every outbound request carries headers that enforce:
 * - No data persistence on third-party servers
 * - No training on user data
 * - Audit trail of what was sent and to whom
 */

// ─── Data Classification ───────────────────────────────────────────────────

/**
 * Classification of data sensitivity for outbound policy enforcement.
 */
export type DataClassification =
  | 'public' // Non-sensitive (e.g., app version, UI preferences)
  | 'internal' // Internal business data (e.g., aggregated metrics)
  | 'confidential' // Financial data (e.g., budget amounts, forecasts)
  | 'restricted'; // PII and regulated data (e.g., salaries, SSNs)

/**
 * Zero-retention policy headers applied to outbound requests.
 */
export interface ZeroRetentionHeaders {
  /** Instructs the recipient not to persist the data */
  readonly 'X-No-Retention': 'true';
  /** Instructs the recipient not to use data for training */
  readonly 'X-No-Training': 'true';
  /** Timestamp of the request for audit */
  readonly 'X-Request-Timestamp': string;
  /** Unique request ID for tracing */
  readonly 'X-Request-Id': string;
  /** Data classification level */
  readonly 'X-Data-Classification': DataClassification;
  /** User who initiated the request */
  readonly 'X-User-Id': string;
  /** Expiry time for any cached data (ISO 8601) */
  readonly 'X-Data-Expiry': string;
}

/**
 * Audit record for an outbound data request.
 */
export interface OutboundDataAuditEntry {
  /** Unique audit entry ID */
  readonly id: string;
  /** Timestamp of the request */
  readonly timestamp: string;
  /** Destination URL/endpoint */
  readonly destination: string;
  /** Data classification of the payload */
  readonly classification: DataClassification;
  /** Size of the payload in bytes */
  readonly payloadSizeBytes: number;
  /** Whether zero-retention headers were applied */
  readonly headersApplied: boolean;
  /** User who initiated the request */
  readonly userId: string;
  /** Purpose of the request (e.g., 'ai-copilot-query', 'erp-sync') */
  readonly purpose: string;
  /** Whether the recipient acknowledged the policy */
  readonly policyAcknowledged: boolean;
  /** Response status code */
  readonly responseStatus: number | null;
}

/**
 * Policy enforcement result for an outbound request.
 */
export interface PolicyEnforcementResult {
  /** Whether the request is allowed */
  readonly allowed: boolean;
  /** Reason if denied */
  readonly denialReason: string | null;
  /** Headers to attach to the request */
  readonly headers: ZeroRetentionHeaders;
  /** Audit entry for this request */
  readonly auditEntry: OutboundDataAuditEntry;
  /** Data redaction applied before sending */
  readonly redactionsApplied: readonly DataRedaction[];
}

/**
 * A redaction applied to outbound data.
 */
export interface DataRedaction {
  /** The field that was redacted */
  readonly field: string;
  /** The original classification */
  readonly originalClassification: DataClassification;
  /** The redaction method */
  readonly method: 'mask' | 'hash' | 'remove' | 'tokenize';
  /** The redacted value (for audit) */
  readonly redactedValue: string;
}

// ─── Policy Store Shape ────────────────────────────────────────────────────

export interface ZeroRetentionState {
  /** Whether zero-retention enforcement is active */
  readonly isEnabled: boolean;
  /** Audit log of outbound requests */
  readonly auditLog: readonly OutboundDataAuditEntry[];
  /** Current policy configuration */
  readonly config: ZeroRetentionConfig;
}

export interface ZeroRetentionConfig {
  /** Whether to block restricted data from leaving the app */
  readonly blockRestrictedData: boolean;
  /** Whether to require explicit user consent for outbound requests */
  readonly requireConsent: boolean;
  /** Maximum payload size (bytes) before requiring approval */
  readonly maxPayloadSizeBytes: number;
  /** Retention period for audit log entries (days) */
  readonly auditLogRetentionDays: number;
}
