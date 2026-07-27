/**
 * Zero-Retention Policy Enforcer — Outbound Data Governance
 *
 * Ensures that when data leaves FinPlan Pro (AI copilot, API calls,
 * exports), it complies with zero-retention policies.
 *
 * Every outbound request carries headers that enforce no-persistence
 * and no-training policies.
 *
 * @module zeroRetentionEnforcer
 */

import type {
  DataClassification,
  ZeroRetentionHeaders,
  OutboundDataAuditEntry,
  PolicyEnforcementResult,
  DataRedaction,
  ZeroRetentionConfig,
} from '@/types/zero-retention';

// ─── Default Configuration ─────────────────────────────────────────────────

const DEFAULT_CONFIG: ZeroRetentionConfig = {
  blockRestrictedData: true,
  requireConsent: false,
  maxPayloadSizeBytes: 1024 * 1024, // 1MB
  auditLogRetentionDays: 90,
};

// ─── Header Generation ─────────────────────────────────────────────────────

/**
 * Generate zero-retention headers for an outbound request.
 */
export function generateZeroRetentionHeaders(
  classification: DataClassification,
  userId: string
): ZeroRetentionHeaders {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  return {
    'X-No-Retention': 'true',
    'X-No-Training': 'true',
    'X-Request-Timestamp': new Date().toISOString(),
    'X-Request-Id': requestId,
    'X-Data-Classification': classification,
    'X-User-Id': userId,
    'X-Data-Expiry': expiry,
  };
}

// ─── Policy Enforcement ────────────────────────────────────────────────────

/**
 * Check if an outbound request is allowed under the zero-retention policy.
 */
export function enforcePolicy(
  destination: string,
  classification: DataClassification,
  payloadSizeBytes: number,
  userId: string,
  purpose: string,
  config: ZeroRetentionConfig = DEFAULT_CONFIG
): PolicyEnforcementResult {
  const redactions: DataRedaction[] = [];
  let allowed = true;
  let denialReason: string | null = null;

  // Block restricted data if configured
  if (config.blockRestrictedData && classification === 'restricted') {
    allowed = false;
    denialReason = 'Restricted data cannot be sent to external services under zero-retention policy';
  }

  // Check payload size
  if (payloadSizeBytes > config.maxPayloadSizeBytes) {
    allowed = false;
    denialReason = `Payload size (${payloadSizeBytes} bytes) exceeds maximum allowed (${config.maxPayloadSizeBytes} bytes)`;
  }

  const headers = generateZeroRetentionHeaders(classification, userId);

  const auditEntry: OutboundDataAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    destination,
    classification,
    payloadSizeBytes,
    headersApplied: true,
    userId,
    purpose,
    policyAcknowledged: false,
    responseStatus: null,
  };

  return {
    allowed,
    denialReason,
    headers,
    auditEntry,
    redactionsApplied: redactions,
  };
}

// ─── Data Classification ───────────────────────────────────────────────────

/**
 * Classify a data field by its content type.
 */
export function classifyField(fieldName: string, value: unknown): DataClassification {
  const lowerField = fieldName.toLowerCase();

  // PII fields are restricted
  const piiFields = ['ssn', 'socialsecurity', 'taxid', 'passport', 'dob', 'dateofbirth'];
  if (piiFields.some((p) => lowerField.includes(p))) return 'restricted';

  // Salary/compensation fields are restricted
  const salaryFields = ['salary', 'compensation', 'bonus', 'equity', 'payrate'];
  if (salaryFields.some((s) => lowerField.includes(s))) return 'restricted';

  // Financial data is confidential
  const financialFields = ['amount', 'balance', 'revenue', 'expense', 'profit', 'cost', 'budget'];
  if (financialFields.some((f) => lowerField.includes(f))) return 'confidential';

  // Aggregated metrics are internal
  const internalFields = ['count', 'average', 'total', 'percentage', 'rate'];
  if (internalFields.some((i) => lowerField.includes(i))) return 'internal';

  // Non-sensitive
  if (typeof value === 'string' && value.length < 50) return 'public';

  return 'internal';
}

/**
 * Classify an entire payload by its most sensitive field.
 */
export function classifyPayload(
  payload: Record<string, unknown>
): DataClassification {
  const levels: Record<DataClassification, number> = {
    public: 0,
    internal: 1,
    confidential: 2,
    restricted: 3,
  };

  let maxLevel: DataClassification = 'public';

  for (const [key, value] of Object.entries(payload)) {
    const classification = classifyField(key, value);
    if (levels[classification] > levels[maxLevel]) {
      maxLevel = classification;
    }
  }

  return maxLevel;
}

// ─── Redaction ─────────────────────────────────────────────────────────────

/**
 * Redact sensitive fields from outbound data.
 */
export function redactSensitiveFields(
  data: Record<string, unknown>
): { redacted: Record<string, unknown>; redactions: DataRedaction[] } {
  const redacted = { ...data };
  const redactions: DataRedaction[] = [];

  for (const [key, value] of Object.entries(data)) {
    const classification = classifyField(key, value);

    if (classification === 'restricted') {
      redactions.push({
        field: key,
        originalClassification: classification,
        method: 'mask',
        redactedValue: '****',
      });
      redacted[key] = '****';
    } else if (classification === 'confidential' && typeof value === 'number') {
      // Hash confidential numbers
      redactions.push({
        field: key,
        originalClassification: classification,
        method: 'hash',
        redactedValue: `hash-${Math.abs(value).toString(36)}`,
      });
      redacted[key] = `hash-${Math.abs(value).toString(36)}`;
    }
  }

  return { redacted, redactions };
}
