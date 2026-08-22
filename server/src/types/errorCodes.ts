/**
 * Stable error-code registry (W0.4).
 *
 * Single source of truth for machine-readable error codes emitted by the
 * server. Every code has:
 *   - a STABLE string id (`FP-NNNN`) that MUST never change meaning once
 *     shipped — consumers key on it, so renumbering is forbidden;
 *   - a stable HTTP status mapping;
 *   - a category used for routing/alerting.
 *
 * Additive-only: new codes are appended with the next free number. Retiring a
 * code marks it `deprecated` instead of deleting it. This module is consumed
 * by tenancy leak responses (W0.2) and will be consumed by three-statement
 * gate violations (K16 / W0.3).
 */

export const ERROR_CATEGORY = [
  'validation',
  'auth',
  'tenancy',
  'gate',
  'conflict',
  'not_found',
  'internal',
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORY)[number];

export interface ErrorCodeDefinition {
  /** Stable id — never reused, never renumbered. */
  readonly code: string;
  readonly httpStatus: number;
  readonly category: ErrorCategory;
  /** Human-readable summary of when this code is emitted. */
  readonly description: string;
  /** Set when a code is retired; retired codes keep their ids reserved. */
  readonly deprecated?: true;
}

const defineErrorCodes = <T extends readonly ErrorCodeDefinition[]>(defs: T): T => defs;

export const ERROR_CODES = defineErrorCodes([
  // ── validation (4xx request-shape problems) ────────────────────────────
  {
    code: 'FP-0001',
    httpStatus: 400,
    category: 'validation',
    description: 'Request body/query failed schema validation.',
  },
  {
    code: 'FP-0002',
    httpStatus: 400,
    category: 'validation',
    description: 'Semantic validation failed although the shape was valid.',
  },

  // ── auth ───────────────────────────────────────────────────────────────
  {
    code: 'FP-0100',
    httpStatus: 401,
    category: 'auth',
    description: 'Missing or malformed credentials.',
  },
  {
    code: 'FP-0101',
    httpStatus: 401,
    category: 'auth',
    description: 'Invalid or expired token.',
  },
  {
    code: 'FP-0110',
    httpStatus: 403,
    category: 'auth',
    description: 'Authenticated but not permitted for this resource.',
  },
  {
    code: 'FP-0111',
    httpStatus: 403,
    category: 'auth',
    description: 'Account is deactivated or locked.',
  },
  {
    code: 'FP-0112',
    httpStatus: 423,
    category: 'auth',
    description: 'Account temporarily locked (brute-force protection).',
  },

  // ── tenancy (W0.2) ─────────────────────────────────────────────────────
  {
    code: 'FP-0200',
    httpStatus: 403,
    category: 'tenancy',
    description: 'Cross-tenant access attempt blocked at route level.',
  },
  {
    code: 'FP-0201',
    httpStatus: 403,
    category: 'tenancy',
    description: 'Cross-tenant entity scope denied (tenant/entity mismatch).',
  },
  {
    code: 'FP-0202',
    httpStatus: 500,
    category: 'tenancy',
    description: 'Tenant-scoped table missing tenant_id column (registry ratchet violation).',
  },
  {
    code: 'FP-0203',
    httpStatus: 403,
    category: 'tenancy',
    description: 'Unknown or inactive tenant id in claims.',
  },
  {
    code: 'FP-0204',
    httpStatus: 403,
    category: 'tenancy',
    description: 'Environment mismatch within tenant (environment_id guard).',
  },

  // ── gates (K16 / W0.3 three-statement gate and future runtime gates) ───
  {
    code: 'FP-0300',
    httpStatus: 422,
    category: 'gate',
    description: 'Three-statement gate violation: balance sheet does not balance.',
  },
  {
    code: 'FP-0301',
    httpStatus: 422,
    category: 'gate',
    description: 'Three-statement gate violation: cash flow does not reconcile to cash.',
  },
  {
    code: 'FP-0302',
    httpStatus: 422,
    category: 'gate',
    description: 'Three-statement gate violation: net income link broken between P&L and equity.',
  },
  {
    code: 'FP-0303',
    httpStatus: 422,
    category: 'gate',
    description:
      'Three-statement gate violation: ledger carries an account type outside the closed chart-of-accounts vocabulary (Revenue/COGS/OpEx/CapEx/Asset/Liability/Equity); the gate fails closed rather than guessing its natural balance.',
  },
  {
    code: 'FP-0399',
    httpStatus: 422,
    category: 'gate',
    description: 'Generic gate violation (reserved for future runtime gates).',
  },

  // ── conflict / not found ───────────────────────────────────────────────
  {
    code: 'FP-0400',
    httpStatus: 409,
    category: 'conflict',
    description: 'Revision conflict — stale base revision.',
  },
  {
    code: 'FP-0401',
    httpStatus: 409,
    category: 'conflict',
    description: 'Duplicate idempotency key.',
  },
  {
    code: 'FP-0402',
    httpStatus: 409,
    category: 'conflict',
    description:
      'Duplicate natural key — a resource with the same unique code already exists in scope (W0.2c account-code uniqueness).',
  },
  {
    code: 'FP-0410',
    httpStatus: 409,
    category: 'conflict',
    description: 'Resource state transition not allowed from current status.',
  },
  {
    code: 'FP-0500',
    httpStatus: 404,
    category: 'not_found',
    description: 'Requested resource does not exist (or is out of scope).',
  },

  // ── internal ───────────────────────────────────────────────────────────
  {
    code: 'FP-0900',
    httpStatus: 500,
    category: 'internal',
    description: 'Unhandled internal error.',
  },
]);

export type RegisteredErrorCode = (typeof ERROR_CODES)[number]['code'];

export type ErrorCodeRegistry = Readonly<Record<RegisteredErrorCode, ErrorCodeDefinition>>;

export const ERROR_CODE_REGISTRY: ErrorCodeRegistry = Object.fromEntries(
  ERROR_CODES.map((def) => [def.code, def])
) as ErrorCodeRegistry;

/** Non-throwing-at-type-level registry access (registry is exhaustive by construction). */
export function errorCodeDefinition(code: RegisteredErrorCode): ErrorCodeDefinition {
  const def = ERROR_CODE_REGISTRY[code];
  if (!def) throw new Error(`Unknown error code: ${code}`);
  return def;
}

export class AppError extends Error {
  readonly code: RegisteredErrorCode;

  constructor(code: RegisteredErrorCode, message?: string) {
    super(message ?? errorCodeDefinition(code).description);
    this.name = 'AppError';
    this.code = code;
  }

  get httpStatus(): number {
    return errorCodeDefinition(this.code).httpStatus;
  }

  get category(): ErrorCategory {
    return errorCodeDefinition(this.code).category;
  }

  /** Structured payload for res.status(...).json(...). */
  toPayload(details?: unknown): {
    error: { code: string; message: string; details?: unknown };
  } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(details !== undefined ? { details } : {}),
      },
    };
  }
}

/** Convenience constructors for the highest-traffic codes. */
export const errors = {
  validation: (message?: string, details?: unknown) =>
    new AppError('FP-0001', message).toPayload(details),
  unauthorized: (message?: string) => new AppError('FP-0100', message),
  forbidden: (message?: string) => new AppError('FP-0110', message),
  crossTenantAccess: (message?: string, details?: unknown) =>
    new AppError('FP-0200', message).toPayload(details),
  crossTenantScope: (message?: string, details?: unknown) =>
    new AppError('FP-0201', message).toPayload(details),
  balanceBreak: (message?: string, details?: unknown) =>
    new AppError('FP-0300', message).toPayload(details),
  cashReconciliation: (message?: string, details?: unknown) =>
    new AppError('FP-0301', message).toPayload(details),
  netIncomeLink: (message?: string, details?: unknown) =>
    new AppError('FP-0302', message).toPayload(details),
  conflict: (message?: string, details?: unknown) =>
    new AppError('FP-0400', message).toPayload(details),
  duplicateIdempotency: (message?: string, details?: unknown) =>
    new AppError('FP-0401', message).toPayload(details),
  duplicateKey: (message?: string, details?: unknown) =>
    new AppError('FP-0402', message).toPayload(details),
  notFound: (message?: string) => new AppError('FP-0500', message),
  internal: (message?: string) => new AppError('FP-0900', message),
} as const;
