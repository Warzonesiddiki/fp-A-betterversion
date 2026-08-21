/**
 * Typed 409-conflict payload parser for GL commits (W0.8.6 prep).
 *
 * Mirrors the stable error-code registry in
 * `server/src/types/errorCodes.ts` (FP-NNNN ids are contractually immutable).
 * The server-side module cannot be imported into the client bundle, so the
 * codes are redeclared here; a drift test asserts parity of the literal ids.
 *
 * @module sdk/gl/conflict
 */

/** Conflict-category codes from the server registry (`category: 'conflict'`). */
export const GL_CONFLICT_CODES = ['FP-0400', 'FP-0401', 'FP-0410'] as const;

export type GlConflictCode = (typeof GL_CONFLICT_CODES)[number];

export function isGlConflictCode(value: unknown): value is GlConflictCode {
  return typeof value === 'string' && (GL_CONFLICT_CODES as readonly string[]).includes(value);
}

/**
 * Server payload shape produced by `AppError.toPayload(details)`:
 * `{ error: { code, message, details? } }`.
 */
export interface GlConflict {
  /** Stable FP-NNNN code (always a registered conflict code after parsing). */
  readonly code: GlConflictCode;
  readonly message: string;
  /**
   * For FP-0400 revision conflicts: the authoritative row version the client
   * must rebase onto. Absent when the server did not include it.
   */
  readonly serverVersion?: number;
  /** Raw details blob from the server (table, row id, …). */
  readonly details?: unknown;
}

interface ServerErrorPayload {
  error?: { code?: unknown; message?: unknown; details?: unknown };
}

function extractServerVersion(details: unknown): number | undefined {
  if (typeof details !== 'object' || details === null) return undefined;
  const record = details as Record<string, unknown>;
  const version = record.serverVersion ?? record.version;
  return typeof version === 'number' && Number.isFinite(version) ? version : undefined;
}

/**
 * Parse a raw HTTP response body into a typed {@link GlConflict}.
 * Returns `null` when the body is not a recognizable server error payload
 * (e.g. an HTML error page or a non-conflict shape), so callers can fall back
 * to generic error handling.
 */
export function parseGlConflict(data: unknown): GlConflict | null {
  if (typeof data !== 'object' || data === null) return null;
  const payload = (data as ServerErrorPayload).error;
  if (typeof payload !== 'object' || payload === null) return null;
  if (!isGlConflictCode(payload.code)) return null;
  return {
    code: payload.code,
    message: typeof payload.message === 'string' ? payload.message : '',
    ...(extractServerVersion(payload.details) !== undefined
      ? { serverVersion: extractServerVersion(payload.details) }
      : {}),
    ...((payload as { details?: unknown }).details !== undefined
      ? { details: (payload as { details: unknown }).details }
      : {}),
  };
}
