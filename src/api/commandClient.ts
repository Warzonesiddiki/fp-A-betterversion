import type { CommandEnvelope, CommandResult } from '@/types/commandEnvelope';
import { isCommandResult } from '@/types/commandEnvelope';

/**
 * Control-Plane command client (F-04, client side).
 *
 * Thin typed transport for the authoritative command boundary:
 *   POST /api/v1/commands            — propose a command
 *   GET  /api/v1/commands/:correlationId — query a stored outcome
 *
 * Rules:
 * - The client only PROPOSES commands. The Control Plane is the sole
 *   authority that validates identity, tenant/entity scope, schema,
 *   idempotency, and base revision, then records audit evidence.
 * - Feature-flagged: when `VITE_CONTROL_PLANE_URL` (or
 *   `VITE_ENABLE_CONTROL_PLANE=true`) is not configured, every call throws
 *   `ControlPlaneDisabledError` and never touches the network.
 * - No `Math.random` anywhere; ids come from `crypto.randomUUID` in the
 *   envelope builder.
 */

export interface CommandClientConfig {
  baseUrl: string;
  /** Bearer token for the Control Plane; null/empty disables the auth header. */
  accessToken: string | null;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export class ControlPlaneDisabledError extends Error {
  constructor() {
    super(
      'Control Plane is not configured. Set VITE_CONTROL_PLANE_URL (or VITE_ENABLE_CONTROL_PLANE=true).'
    );
    this.name = 'ControlPlaneDisabledError';
  }
}

export class CommandRequestError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'CommandRequestError';
    this.status = status;
    this.code = code;
  }
}

/** Normalizes a configured base URL: trims and strips trailing slashes. */
export function normalizeBaseUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

/** Resolves the Control Plane base URL from the environment (feature flag). */
export function resolveControlPlaneBaseUrl(env: ImportMetaEnv = import.meta.env): string | null {
  return normalizeBaseUrl(env.VITE_CONTROL_PLANE_URL);
}

export function isControlPlaneEnabled(env: ImportMetaEnv = import.meta.env): boolean {
  if (env.VITE_ENABLE_CONTROL_PLANE === 'true' || env.VITE_ENABLE_CONTROL_PLANE === '1') {
    return true;
  }
  return resolveControlPlaneBaseUrl(env) !== null;
}

export class CommandClient {
  private readonly baseUrl: string;
  private readonly accessToken: string | null;
  private readonly fetchImpl: typeof fetch;

  constructor(config: CommandClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.accessToken = config.accessToken;
    this.fetchImpl = config.fetchImpl ?? ((...args) => fetch(...args));
  }

  /**
   * Proposes a command to the Control Plane. Resolves with the typed outcome
   * (completed/conflict/rejected); throws `CommandRequestError` for
   * non-CommandResult responses (e.g., 401 auth failures) and network errors.
   */
  async submitCommand(envelope: CommandEnvelope): Promise<CommandResult> {
    return this.request('/api/v1/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
  }

  /** Queries the stored outcome for a correlation id (404 → NOT_FOUND error). */
  async getCommandResult(correlationId: string): Promise<CommandResult> {
    return this.request(`/api/v1/commands/${encodeURIComponent(correlationId)}`, {
      method: 'GET',
    });
  }

  private async request(path: string, init: RequestInit): Promise<CommandResult> {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers });
    } catch (err) {
      throw new CommandRequestError(
        0,
        'NETWORK_ERROR',
        err instanceof Error ? err.message : 'Network request failed'
      );
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (isCommandResult(body)) {
      return body;
    }

    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>).error)
        : `Unexpected response (HTTP ${response.status})`;
    throw new CommandRequestError(response.status, 'UNEXPECTED_RESPONSE', message);
  }
}
