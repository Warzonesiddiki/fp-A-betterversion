/**
 * Client-side command envelope (F-04 mirror).
 *
 * Must stay in sync with `server/src/types/commandEnvelope.ts` until a shared
 * package exists. The client only PROPOSES commands; the Control Plane is the
 * sole authority that accepts, scopes, revises, and audits them.
 *
 * Security IDs use crypto.randomUUID — never Math.random.
 */

export const COMMAND_TYPES = [
  'plan.upsert',
  'close.certify',
  'report.publish',
  'masterdata.update',
] as const;

export type CommandType = (typeof COMMAND_TYPES)[number];

export interface CommandEnvelope {
  commandId: string;
  correlationId: string;
  idempotencyKey: string;
  commandType: CommandType;
  baseRevision: string | null;
  timestamp: string;
  scope: {
    entityId: string;
  };
  payload: Record<string, unknown>;
}

export interface CreateCommandEnvelopeOptions {
  correlationId?: string;
  idempotencyKey?: string;
  baseRevision?: string | null;
}

export function createCommandEnvelope(
  commandType: CommandType,
  entityId: string,
  payload: Record<string, unknown>,
  options: CreateCommandEnvelopeOptions = {}
): CommandEnvelope {
  return {
    commandId: crypto.randomUUID(),
    correlationId: options.correlationId ?? crypto.randomUUID(),
    idempotencyKey: options.idempotencyKey ?? crypto.randomUUID(),
    commandType,
    baseRevision: options.baseRevision ?? null,
    timestamp: new Date().toISOString(),
    scope: { entityId },
    payload,
  };
}

// ---------------------------------------------------------------------------
// Command outcomes (mirror of server/src/types/commandEnvelope.ts)
// ---------------------------------------------------------------------------

export const COMMAND_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN_ENTITY',
  'CONFLICT_REVISION',
  'DUPLICATE_IDEMPOTENCY',
  'NOT_FOUND',
  'INTERNAL',
] as const;

export type CommandErrorCode = (typeof COMMAND_ERROR_CODES)[number];

export type CommandStatus = 'accepted' | 'completed' | 'conflict' | 'rejected';

export interface CommandError {
  code: CommandErrorCode;
  message: string;
  details?: unknown;
}

export interface CommandResult {
  status: CommandStatus;
  /** Null when the envelope failed validation before ids were parsed. */
  commandId: string | null;
  correlationId: string | null;
  /** Revision after apply; null when the command was rejected/conflicted. */
  revision: string | null;
  /** Present on the accept path (server recorded audit evidence). */
  auditRecorded?: boolean;
  error?: CommandError;
}

export function isCommandResult(value: unknown): value is CommandResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.status === 'string' &&
    (v.status === 'accepted' ||
      v.status === 'completed' ||
      v.status === 'conflict' ||
      v.status === 'rejected')
  );
}
