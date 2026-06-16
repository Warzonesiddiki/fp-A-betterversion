/**
 * FpaClient SDK — public type definitions.
 *
 * These types form the public contract of the SDK. They are intentionally
 * generic and stable: breaking changes here are tracked via the `SdkVersion`
 * export and versioned per the rules in `docs/parts/API_REFERENCE.md` §11.
 *
 * @module sdk/types
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Auth strategy discriminated union.
 *
 * - `oauth2`: OAuth2 access token, optionally with refresh-token rotation.
 * - `apiKey`:  Custom header (default `X-API-Key`).
 * - `bearer`:  Static bearer token (no refresh).
 * - `basic`:   HTTP Basic credentials.
 */
export type AuthConfig =
  | {
      readonly type: 'oauth2';
      readonly accessToken: string;
      readonly refreshToken?: string;
      readonly clientId?: string;
      readonly clientSecret?: string;
      /** Epoch-ms when the access token expires. */
      readonly expiresAt?: number;
    }
  | { readonly type: 'apiKey'; readonly apiKey: string; readonly headerName?: string }
  | { readonly type: 'bearer'; readonly token: string }
  | { readonly type: 'basic'; readonly username: string; readonly password: string };

// ─── Client config ───────────────────────────────────────────────────────────

/** Default REST base URL of the FinPlan Pro backend. */
export const DEFAULT_BASE_URL = 'https://api.finplanpro.dev/v1' as const;

/** Default WebSocket base URL (derived from `baseUrl` when omitted). */
export const DEFAULT_REALTIME_PATH = '/realtime' as const;

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000 as const;

/** Default retry count for transient failures. */
export const DEFAULT_RETRY_COUNT = 3 as const;

/** FpaClient construction config. */
export interface FpaClientConfig {
  /** REST base URL. Defaults to `DEFAULT_BASE_URL`. */
  readonly baseUrl?: string;
  /** Auth credentials. Mutated to refresh OAuth2 tokens in place. */
  readonly auth: AuthConfig;
  /** Default request timeout (ms). */
  readonly timeoutMs?: number;
  /** Default retry count for idempotent requests on 5xx/429. */
  readonly retryCount?: number;
  /** Default connector namespace. Mirrors the value passed in `X-Connector` header. */
  readonly connector?: ConnectorId;
  /** Static headers applied to every request (e.g. `X-Org-Id`). */
  readonly headers?: Readonly<Record<string, string>>;
  /** WebSocket URL override; defaults to `wss://` + baseUrl host + `DEFAULT_REALTIME_PATH`. */
  readonly realtimeUrl?: string;
  /**
   * Async callback invoked when OAuth2 access token is refreshed. The returned
   * `AuthConfig` becomes the new auth state. If omitted, refreshed tokens
   * are kept in memory only.
   */
  readonly onAuthRefresh?: (auth: AuthConfig) => Promise<AuthConfig>;
}

// ─── Connectors ──────────────────────────────────────────────────────────────

/** Supported accounting-connector identifiers. */
export type ConnectorId = 'qbo' | 'xero' | 'sage' | 'netsuite' | 'dynamics' | 'custom';

/** Connector-specific request options (forwarded as headers). */
export interface ConnectorOptions {
  /** Tenant / realm / organisation identifier. */
  readonly tenantId?: string;
  /** Force a particular minor API version. */
  readonly minorVersion?: string;
  /** Force sandbox mode (QBO only). */
  readonly sandbox?: boolean;
}

// ─── Realtime ────────────────────────────────────────────────────────────────

/** Realtime connection lifecycle states. */
export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed'
  | 'error';

/** Cell edit payload. */
export interface CellEditPayload {
  readonly sheetId: string;
  readonly cell: string;
  readonly value: unknown;
  readonly userId: string;
  /** Epoch-ms timestamp of the edit. */
  readonly ts: number;
}

/** All realtime event types. Mirrors `API_REFERENCE.md` §3.3 (10-event taxonomy). */
export type RealtimeEvent =
  | { readonly type: 'cell:edit'; readonly payload: CellEditPayload }
  | { readonly type: 'sheet:created'; readonly payload: { readonly sheetId: string; readonly userId: string } }
  | { readonly type: 'cell:formatted'; readonly payload: { readonly range: string; readonly style: unknown } }
  | { readonly type: 'cursor:moved'; readonly payload: { readonly userId: string; readonly cell: string } }
  | { readonly type: 'comment:added'; readonly payload: { readonly cell: string; readonly author: string; readonly text: string } }
  | { readonly type: 'selection:changed'; readonly payload: { readonly userId: string; readonly range: string } }
  | { readonly type: 'presence:joined'; readonly payload: { readonly userId: string; readonly name: string } }
  | { readonly type: 'presence:left'; readonly payload: { readonly userId: string } }
  | { readonly type: 'data:imported'; readonly payload: { readonly source: string; readonly rows: number } }
  | { readonly type: 'formula:recalculated'; readonly payload: { readonly sheetId: string; readonly durationMs: number } };

/** Event handler — sync or async. Errors are caught and logged via `console.warn`. */
export type RealtimeEventHandler = (event: RealtimeEvent) => void | Promise<void>;

/** Connection-state observer. */
export type ConnectionStateListener = (state: ConnectionState, info?: { readonly code?: number; readonly reason?: string }) => void;

// ─── Result helpers ──────────────────────────────────────────────────────────

/**
 * A typed, awaited result helper for callers that prefer not to use try/catch.
 * Matches the `Result<T, E>` shape used in `docs/parts/API_REFERENCE.md` §10.
 */
export type SdkResult<T, E = SdkError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** SDK-level error shape. */
export interface SdkError {
  readonly code: string;
  readonly message: string;
  readonly status?: number;
  readonly cause?: unknown;
}

// ─── Versioning ──────────────────────────────────────────────────────────────

/** SDK semver. Bump on any breaking type change. */
export const SDK_VERSION = '0.1.0' as const;

/** Compile-time string literal for type-level version checks. */
export type SdkVersion = typeof SDK_VERSION;
