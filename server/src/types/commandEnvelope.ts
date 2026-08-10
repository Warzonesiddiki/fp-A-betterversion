import { z } from 'zod';

/**
 * Typed command envelope contract (F-04 Control-Plane spike).
 *
 * Official state changes are server-authorized commands. The client draft
 * workspace may propose a command; the Control Plane validates identity,
 * tenant/entity scope, schema, idempotency, and base revision before applying
 * it and recording audit evidence in the same transaction.
 *
 * This module is the spike contract — not a production migration claim.
 */

export const COMMAND_TYPES = [
  'plan.upsert',
  'close.certify',
  'report.publish',
  'masterdata.update',
] as const;

export type CommandType = (typeof COMMAND_TYPES)[number];

export const commandEnvelopeSchema = z.object({
  commandId: z.string().uuid(),
  correlationId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  commandType: z.enum(COMMAND_TYPES),
  /** Revision the command applies on top of; null = first write for the scope. */
  baseRevision: z.string().min(1).nullable(),
  timestamp: z.string().datetime(),
  scope: z.object({
    entityId: z.string().min(1),
  }),
  payload: z.record(z.unknown()),
});

export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;

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
  error?: CommandError;
}
