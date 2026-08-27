/**
 * FpaClient SDK — public type definitions.
 *
 * These types form the public contract of the SDK. They are intentionally
 * generic and stable: breaking changes here are tracked via the `SdkVersion`
 * export and versioned per the rules in `docs/parts/API_REFERENCE.md` §11.
 *
 * The shape is a thin, ergonomic wrapper over the internal `ConnectorAuthConfig`
 * (see `src/services/api-integration/types.ts`). Where the internal config
 * uses snake_case enum values (`'api_key'`) and separates OAuth2 flow config
 * from runtime tokens, the SDK combines them so a single `AuthConfig` value
 * is enough to construct a working `FpaClient`.
 *
 * @module sdk/types
 * @since 0.1.0
 * @version 0.1.0
 *
 * @example
 * ```ts
 * // ESM
 * import type { AuthConfig, FpaClientConfig } from '@finplanpro/sdk';
 * // CommonJS
 * const { AuthConfig, FpaClientConfig } = require('@finplanpro/sdk');
 * ```
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * OAuth2 client configuration (the OAuth2 *flow* config, not the runtime
 * tokens). Required when `AuthConfig.type === 'oauth2'` so the underlying
 * `RestApiClient` can refresh expired access tokens.
 */
export interface OAuth2ClientConfig {
  /** OAuth2 client identifier (registered with the auth provider). */
  readonly clientId: string;
  /** OAuth2 client secret. NEVER log this. */
  readonly clientSecret: string;
  /** Token endpoint URL (e.g. `https://oauth.platform.example.com/token`). */
  readonly tokenUrl: string;
  /** Authorization endpoint URL (for code-flow bootstrapping). */
  readonly authorizationUrl?: string;
  /** Redirect URI registered with the auth provider. */
  readonly redirectUri?: string;
  /** OAuth2 scopes to request. */
  readonly scopes?: readonly string[];
}

/**
 * OAuth2 runtime tokens. Stored on the underlying `RestApiClient` after
 * the SDK is constructed; the SDK calls `setOAuthTokens` for the user.
 *
 * NOTE: `refreshToken`, `expiresAt`, and `tokenType` are all **required**
 * because the internal `OAuth2Tokens` type declares them required. If you
 * do not yet have a refresh token, pass an empty string — refresh is a
 * no-op in that case. `expiresAt` should be the epoch-ms when the access
 * token expires; pass `0` if unknown and the client will not preemptively
 * refresh.
 */
export interface OAuth2TokenState {
  /** Current access token. */
  readonly accessToken: string;
  /** Refresh token. Required by the internal API — pass `''` if unknown. */
  readonly refreshToken: string;
  /** Epoch-ms when the access token expires. `0` disables preemptive refresh. */
  readonly expiresAt: number;
  /** OAuth2 scope granted by the auth provider. */
  readonly scope?: string;
  /** Token type (defaults to `'Bearer'` if omitted). */
  readonly tokenType?: string;
}

/**
 * Auth strategy discriminated union.
 *
 * - `oauth2`: full OAuth2 — client config + runtime tokens. The SDK wires
 *   the client config into `RestApiClient` (so it can refresh) and seeds
 *   the runtime tokens via `setOAuthTokens`.
 * - `apiKey`:  Custom header (default `X-API-Key`).
 * - `bearer`:  Static bearer token (no refresh).
 * - `basic`:   HTTP Basic credentials. **HTTPS only** (the underlying
 *   client warns if `baseUrl` is `http:`).
 *
 * @example
 * ```ts
 * // OAuth2 (recommended for production) — client config + runtime tokens
 * const oauth: AuthConfig = {
 *   type: 'oauth2',
 *   client: {
 *     clientId: 'abc',
 *     clientSecret: 'xyz',
 *     tokenUrl: 'https://oauth.platform.example.com/token',
 *     redirectUri: 'https://app.example.com/cb',
 *     scopes: ['workbook.read', 'workbook.write'],
 *   },
 *   tokens: {
 *     accessToken: 'ey...',
 *     refreshToken: 'rt...',
 *     expiresAt: Date.now() + 3_600_000,
 *   },
 * };
 *
 * // Bearer token (server-to-server, no refresh)
 * const bearer: AuthConfig = { type: 'bearer', token: 'ey...' };
 *
 * // API key (custom connectors)
 * const apiKey: AuthConfig = { type: 'apiKey', apiKey: 'sk_...', headerName: 'X-API-Key' };
 *
 * // Basic auth (legacy, HTTPS-only)
 * const basic: AuthConfig = { type: 'basic', username: 'u', password: 'p' };
 * ```
 */
export type AuthConfig =
  | {
      readonly type: 'oauth2';
      readonly client: OAuth2ClientConfig;
      readonly tokens: OAuth2TokenState;
    }
  | { readonly type: 'apiKey'; readonly apiKey: string; readonly headerName?: string }
  | {
      readonly type: 'bearer';
      readonly token: string;
      /**
       * Explicitly allow requests without a credential (public endpoints).
       * When a `tokenSource` yields an empty token, the client rejects with
       * `ApiNotConfiguredError` unless this flag is `true`.
       */
      readonly allowAnonymous?: boolean;
    }
  | { readonly type: 'basic'; readonly username: string; readonly password: string };

// ─── Client config ───────────────────────────────────────────────────────────

/**
 * Thrown (or surfaced as `{ok:false}` / typed namespace errors) when the SDK
 * has no REST origin to talk to: neither an explicit `baseUrl` nor a build
 * time `VITE_API_URL` was configured. Deliberately fails BEFORE any network
 * attempt so the client can never send traffic to a guessed host.
 */
export class ApiNotConfiguredError extends Error {
  /** Stable machine-readable code (mirrored onto `SdkError.code`). */
  public readonly code = 'API_NOT_CONFIGURED' as const;

  public constructor(
    message = 'FinPlan Pro API origin is not configured. Set VITE_API_URL at build time to the FinPlan Pro server origin (e.g. http://localhost:3001 for the local Express server; in Vite dev the /api proxy reaches it same-origin), or pass baseUrl to new FpaClient().'
  ) {
    super(message);
    this.name = 'ApiNotConfiguredError';
  }
}

/** Default WebSocket base URL (derived from `baseUrl` when omitted). */
export const DEFAULT_REALTIME_PATH = '/realtime' as const;

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000 as const;

/** Default retry count for transient failures. */
export const DEFAULT_RETRY_COUNT = 3 as const;

/**
 * FpaClient construction config.
 *
 * @example
 * ```ts
 * const client = new FpaClient({
 *   // Origin comes from VITE_API_URL when omitted:
 *   auth: { type: 'bearer', token: process.env.FPA_TOKEN! },
 *   timeoutMs: 15_000,
 *   retryCount: 3,
 *   connector: 'qbo',
 *   headers: { 'X-Org-Id': 'org-42' },
 *   realtimeUrl: 'wss://api.example.com/realtime',
 *   onAuthRefresh: async (auth) => {
 *     await persistTokens(auth);
 *     return auth;
 *   },
 * });
 * ```
 */
export interface FpaClientConfig {
  /**
   * REST base URL. When omitted, resolves from `import.meta.env.VITE_API_URL`.
   * When BOTH are unset/blank, every client operation rejects immediately with
   * `ApiNotConfiguredError` — the SDK never invents a default host.
   */
  readonly baseUrl?: string;
  /** Auth credentials. Mutated to refresh OAuth2 tokens in place. */
  readonly auth: AuthConfig;
  /**
   * Lazily resolve the bearer credential at REQUEST time (e.g.
   * `() => useAuthStore.getState().accessToken ?? ''`). Use together with
   * `auth: { type: 'bearer', token: '' }` so tokens issued after client
   * construction are picked up per request. An empty result rejects with
   * `ApiNotConfiguredError` unless the auth config sets `allowAnonymous: true`.
   */
  readonly tokenSource?: () => string;
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

/**
 * Connector-specific request options (forwarded as headers).
 *
 * @example
 * ```ts
 * const opts: ConnectorOptions = {
 *   tenantId: 'realm-123',
 *   minorVersion: '65',
 *   sandbox: true,
 * };
 * ```
 */
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
  | {
      readonly type: 'sheet:created';
      readonly payload: { readonly sheetId: string; readonly userId: string };
    }
  | {
      readonly type: 'cell:formatted';
      readonly payload: { readonly range: string; readonly style: unknown };
    }
  | {
      readonly type: 'cursor:moved';
      readonly payload: { readonly userId: string; readonly cell: string };
    }
  | {
      readonly type: 'comment:added';
      readonly payload: { readonly cell: string; readonly author: string; readonly text: string };
    }
  | {
      readonly type: 'selection:changed';
      readonly payload: { readonly userId: string; readonly range: string };
    }
  | {
      readonly type: 'presence:joined';
      readonly payload: { readonly userId: string; readonly name: string };
    }
  | { readonly type: 'presence:left'; readonly payload: { readonly userId: string } }
  | {
      readonly type: 'data:imported';
      readonly payload: { readonly source: string; readonly rows: number };
    }
  | {
      readonly type: 'formula:recalculated';
      readonly payload: { readonly sheetId: string; readonly durationMs: number };
    };

/** Event handler — sync or async. Errors are caught and logged via `console.warn`. */
export type RealtimeEventHandler = (event: RealtimeEvent) => void | Promise<void>;

/** Connection-state observer. */
export type ConnectionStateListener = (
  state: ConnectionState,
  info?: { readonly code?: number; readonly reason?: string }
) => void;

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
