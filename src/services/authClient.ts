import { normalizeBaseUrl } from '@/api/commandClient';

/**
 * Auth service client (Phase 0 / W02 tenancy — frontend auth integration).
 *
 * Thin typed transport for the Express auth boundary
 * (server/src/routes/auth.ts, mounted at /api/auth):
 *   POST /api/auth/login   — credentials in, access+refresh pair out.
 *                            401 carries attemptsRemaining; 423 = account
 *                            locked (lockedUntil); 429 carries retryAfterSeconds.
 *   POST /api/auth/logout  — best-effort refresh-token revocation. Server-side
 *                            idempotent: unknown/already-revoked tokens still
 *                            answer 200.
 *   POST /api/auth/refresh — ROTATING refresh: every success returns a NEW
 *                            access+refresh pair; replaying a rotated token
 *                            trips server-side family revocation, so callers
 *                            must persist BOTH tokens on every response.
 *   GET  /api/auth/me      — current user from a bearer access token.
 *
 * Rules:
 * - Transport only: no state, no storage. Token persistence lives in
 *   src/store/authStore.ts.
 * - Injectable fetch for deterministic unit tests; defaults to global fetch.
 * - Every failure normalizes to AuthRequestError{status, code} where status 0
 *   means "network unreachable".
 */

export interface AuthUserDto {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
  readonly entityId: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LoginResponse {
  readonly user: AuthUserDto;
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface RefreshResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface AuthClientConfig {
  /** Base URL of the auth API; defaults to normalized VITE_API_URL or '/api'. */
  baseUrl?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export class AuthRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds?: number;
  readonly attemptsRemaining?: number;
  readonly lockedUntil?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    extra: {
      retryAfterSeconds?: number;
      attemptsRemaining?: number;
      lockedUntil?: string;
    } = {}
  ) {
    super(message);
    this.name = 'AuthRequestError';
    this.status = status;
    this.code = code;
    if (extra.retryAfterSeconds !== undefined) this.retryAfterSeconds = extra.retryAfterSeconds;
    if (extra.attemptsRemaining !== undefined) this.attemptsRemaining = extra.attemptsRemaining;
    if (extra.lockedUntil !== undefined) this.lockedUntil = extra.lockedUntil;
  }
}

function errorCodeForStatus(status: number): string {
  switch (status) {
    case 0:
      return 'NETWORK_ERROR';
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 423:
      return 'LOCKED';
    case 429:
      return 'RATE_LIMITED';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'REQUEST_FAILED';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isAuthUserDto(value: unknown): value is AuthUserDto {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.firstName === 'string' &&
    typeof value.lastName === 'string' &&
    typeof value.role === 'string' &&
    (value.entityId === null || typeof value.entityId === 'string') &&
    typeof value.isActive === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return (
    isRecord(value) &&
    isAuthUserDto(value.user) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === 'string' &&
    value.refreshToken.length > 0
  );
}

function isRefreshResponse(value: unknown): value is RefreshResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === 'string' &&
    value.refreshToken.length > 0
  );
}

function isMeResponse(value: unknown): value is { user: AuthUserDto } {
  return isRecord(value) && isAuthUserDto(value.user);
}

export class AuthClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: AuthClientConfig = {}) {
    this.baseUrl = (
      config.baseUrl ??
      normalizeBaseUrl(import.meta.env.VITE_API_URL) ??
      '/api'
    ).replace(/\/+$/, '');
    this.fetchImpl = config.fetchImpl ?? ((...args) => fetch(...args));
  }

  /** Exchanges credentials for a token pair. Throws AuthRequestError on failure. */
  async login(email: string, password: string): Promise<LoginResponse> {
    const { response, body } = await this.send('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    this.ensureOk(response, body);
    if (!isLoginResponse(body)) throw this.malformed(response.status);
    return body;
  }

  /**
   * Revokes a refresh token server-side. Idempotent by server contract
   * (unknown or already-revoked tokens still answer 200).
   */
  async logout(refreshToken: string): Promise<void> {
    const { response, body } = await this.send('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    this.ensureOk(response, body);
  }

  /** Fetches the authenticated user for an access token. */
  async me(accessToken: string): Promise<AuthUserDto> {
    const { response, body } = await this.send('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    this.ensureOk(response, body);
    if (!isMeResponse(body)) throw this.malformed(response.status);
    return body.user;
  }

  /**
   * Rotating refresh: returns the replacement access+refresh pair. Callers
   * MUST persist BOTH tokens; keeping the old refresh token after this call
   * guarantees family revocation on the next attempt.
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const { response, body } = await this.send('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    this.ensureOk(response, body);
    if (!isRefreshResponse(body)) throw this.malformed(response.status);
    return body;
  }

  private async send(
    path: string,
    init: RequestInit
  ): Promise<{ response: Response; body: unknown }> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    } catch (err) {
      throw new AuthRequestError(
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
    return { response, body };
  }

  private ensureOk(response: Response, body: unknown): void {
    if (response.ok) return;

    const record = isRecord(body) ? body : null;
    throw new AuthRequestError(
      response.status,
      errorCodeForStatus(response.status),
      (record && readString(record, 'error')) || `Request failed (HTTP ${response.status})`,
      {
        retryAfterSeconds: record ? readNumber(record, 'retryAfterSeconds') : undefined,
        attemptsRemaining: record ? readNumber(record, 'attemptsRemaining') : undefined,
        lockedUntil: record ? readString(record, 'lockedUntil') : undefined,
      }
    );
  }

  private malformed(status: number): AuthRequestError {
    return new AuthRequestError(
      status,
      'MALFORMED_RESPONSE',
      `Malformed response (HTTP ${status})`
    );
  }
}

/** Process-wide client used by stores/interceptors; tests construct their own. */
export const authClient = new AuthClient();
