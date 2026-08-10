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
