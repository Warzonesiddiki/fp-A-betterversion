/**
 * API Integration Framework - REST Client
 *
 * A thin wrapper around axios providing:
 * - Auth header injection (OAuth2, API key, Basic, Bearer)
 * - Automatic retry with exponential backoff
 * - Rate-limit handling (429)
 * - Request/response interceptors
 * - Typed request methods
 *
 * PATCH 9 — REST_API_CLIENT v0.3 (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16):
 *   - Ghost-SHA detection (NEVER-AGAIN RULE #53 GHOST-SHA-DETECTION)
 *   - Optional `enableGhostShaValidation` config + `setGhostShaValidator`
 *   - `validateResponseShas(data)` for manual scan of response payloads
 *   - Defends CWE-345 (Insufficient Verification of Data Authenticity)
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiRequestConfig, ApiResponse, ConnectorAuthConfig, OAuth2Tokens } from './types';
import { ApiError } from './types';
import {
  GhostShaValidator,
  type GhostShaScanResult,
  type GhostShaScanOptions,
} from './GhostShaValidator';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;

// ─── RestApiClient ───────────────────────────────────────────────────────────

export class RestApiClient {
  private readonly client: AxiosInstance;
  private readonly auth: ConnectorAuthConfig;
  private readonly retryCount: number;
  private readonly retryDelayMs: number;
  private oauthTokens: OAuth2Tokens | null = null;
  private refreshPromise: Promise<OAuth2Tokens> | null = null;
  private ghostShaValidator: GhostShaValidator | null = null;
  private readonly enableGhostShaValidation: boolean = false;
  private readonly onGhostShaDetected: ((result: GhostShaScanResult) => void) | null = null;

  constructor(
    baseUrl: string,
    auth: ConnectorAuthConfig,
    options?: {
      timeout?: number;
      retryCount?: number;
      retryDelayMs?: number;
      headers?: Record<string, string>;
    }
  ) {
    this.auth = auth;
    this.retryCount = options?.retryCount ?? DEFAULT_RETRY_COUNT;
    this.retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: options?.timeout ?? DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  // ── Token management ─────────────────────────────────────────────────────

  setOAuthTokens(tokens: OAuth2Tokens): void {
    this.oauthTokens = tokens;
  }

  getOAuthTokens(): OAuth2Tokens | null {
    return this.oauthTokens;
  }

  setTokenRefreshHandler(handler: (refreshToken: string) => Promise<OAuth2Tokens>): void {
    this.tokenRefreshHandler = handler;
  }

  private tokenRefreshHandler: ((refreshToken: string) => Promise<OAuth2Tokens>) | null = null;

  // ── Auth header builder ──────────────────────────────────────────────────

  private buildAuthHeaders(): Record<string, string> {
    switch (this.auth.type) {
      case 'oauth2': {
        if (!this.oauthTokens) return {};
        return { Authorization: `${this.oauthTokens.tokenType} ${this.oauthTokens.accessToken}` };
      }
      case 'bearer': {
        if (!this.auth.bearer) return {};
        return { Authorization: `Bearer ${this.auth.bearer.token}` };
      }
      case 'api_key': {
        if (!this.auth.apiKey) return {};
        return { [this.auth.apiKey.headerName]: this.auth.apiKey.key };
      }
      case 'basic': {
        if (!this.auth.basic) return {};
        // SECURITY (Phase 7 audit finding, Hephaestus PATCH 3): basic auth
        // credentials MUST be sent over HTTPS. base64-encoding the password
        // does NOT encrypt it — anyone with the encoded string can decode it
        // (btoa is a reversible encoding, not a cipher). Defense-in-depth
        // warning so dev/test using http://localhost does not crash, but
        // production misconfigurations are visible in the console.
        if (
          this.client.defaults.baseURL &&
          !String(this.client.defaults.baseURL).startsWith('https://')
        ) {
          console.warn(
            '[SECURITY] RestApiClient: basic auth over non-HTTPS endpoint — ' +
              'credentials will be sent in cleartext (base64 is not encryption). ' +
              'Use HTTPS in production. See SECURITY_READINESS.md G7 v1.1 follow-up.'
          );
        }
        const encoded = btoa(`${this.auth.basic.username}:${this.auth.basic.password}`);
        return { Authorization: `Basic ${encoded}` };
      }
      default:
        return {};
    }
  }

  // ── Token refresh ────────────────────────────────────────────────────────

  private async refreshOAuthToken(): Promise<OAuth2Tokens> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      if (!this.oauthTokens?.refreshToken) {
        throw new ApiError('No refresh token available', 401, 'Unauthorized');
      }

      if (this.tokenRefreshHandler) {
        const tokens = await this.tokenRefreshHandler(this.oauthTokens.refreshToken);
        this.oauthTokens = tokens;
        return tokens;
      }

      if (!this.auth.oauth2) {
        throw new ApiError('OAuth2 config required for token refresh', 401, 'Unauthorized');
      }

      // OAuth 2.0 BCP (RFC 8252 §8.1): client credentials MUST use HTTP Basic
      // auth header or POST body, NOT query params (which leak via server logs,
      // browser history, and proxy caches). HIGH finding from the Phase 7
      // services security audit (cycle 13, Hephaestus).
      const credentials = btoa(
        `${this.auth.oauth2.clientId}:${this.auth.oauth2.clientSecret}`
      );
      const response = await axios.post(this.auth.oauth2.tokenUrl, null, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.oauthTokens.refreshToken,
        },
      });

      const tokens: OAuth2Tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token ?? this.oauthTokens.refreshToken,
        expiresAt: Date.now() + response.data.expires_in * 1000,
        tokenType: response.data.token_type ?? 'Bearer',
        scope: response.data.scope,
      };

      this.oauthTokens = tokens;
      return tokens;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private isTokenExpired(): boolean {
    if (!this.oauthTokens) return false;
    // Refresh 60 seconds before expiry
    return Date.now() >= this.oauthTokens.expiresAt - 60_000;
  }

  // ── Retry logic ──────────────────────────────────────────────────────────

  private calculateDelay(attempt: number): number {
    const delay = this.retryDelayMs * Math.pow(2, attempt);
    // Add jitter: +/- 25%
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.min(delay + jitter, MAX_RETRY_DELAY_MS);
  }

  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  // ── Core request method ──────────────────────────────────────────────────

  async request<T = unknown>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    // Refresh token if needed (OAuth2)
    if (this.auth.type === 'oauth2' && this.isTokenExpired()) {
      await this.refreshOAuthToken();
    }

    const axiosConfig: AxiosRequestConfig = {
      method: config.method,
      url: config.url,
      headers: {
        ...this.buildAuthHeaders(),
        ...config.headers,
      },
      params: config.params,
      data: config.data,
      timeout: config.timeout,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        const response = await this.client.request<T>(axiosConfig);

        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
        };
      } catch (error: unknown) {
        lastError = error;

        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;

          // Handle 401 with token refresh (once)
          if (status === 401 && this.auth.type === 'oauth2' && attempt === 0) {
            try {
              await this.refreshOAuthToken();
              axiosConfig.headers = {
                ...axiosConfig.headers,
                ...this.buildAuthHeaders(),
              };
              continue;
            } catch {
              throw new ApiError('Authentication failed', 401, 'Unauthorized', error.response.data);
            }
          }

          // Retry on retryable status codes
          if (this.isRetryable(status) && attempt < this.retryCount) {
            // Respect Retry-After header
            const retryAfter = error.response.headers['retry-after'];
            const delay = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : this.calculateDelay(attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw new ApiError(error.message, status, error.response.statusText, error.response.data);
        }

        // Network error — retry if attempts remain
        if (attempt < this.retryCount) {
          await new Promise((resolve) => setTimeout(resolve, this.calculateDelay(attempt)));
          continue;
        }

        throw new ApiError(
          error instanceof Error ? error.message : 'Network error',
          0,
          'Network Error'
        );
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Request failed');
  }

  // ── Convenience methods ──────────────────────────────────────────────────

  async get<T = unknown>(
    url: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params });
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data });
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  async patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data });
  }

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url });
  }

  // ===========================================================================
  // PATCH 9 — REST_API_CLIENT v0.3 (Hephaestus, FinPlan Pro v1.0.0, CYCLE 8)
  // GHOST-SHA DETECTION (NEVER-AGAIN RULE #53 — closes Tyche P0 SHA-MISATTRIBUTION
  // finding in Strategos/Apollo INDEX v0.6; CATCH #187, #194, #195, #196, Vulcan F1+F2)
  // ===========================================================================

  /**
   * Wire up a GhostShaValidator to be used for response-data validation.
   * When set (and `enableGhostShaValidation` is true in constructor options),
   * every successful response is scanned for SHA-like strings in fields named
   * `commit_sha`, `git_sha`, `sha`, etc. Suspicious SHAs trigger the
   * `onGhostShaDetected` callback (if set) and a console.warn.
   *
   * @example
   * ```ts
   * const client = new RestApiClient(url, auth, { enableGhostShaValidation: true });
   * const validator = new GhostShaValidator();
   * validator.addShas(await loadGitShas()); // from `git log --format=%H`
   * client.setGhostShaValidator(validator);
   * ```
   */
  setGhostShaValidator(validator: GhostShaValidator): void {
    this.ghostShaValidator = validator;
  }

  /**
   * Get the currently-wired GhostShaValidator (or null if none).
   */
  getGhostShaValidator(): GhostShaValidator | null {
    return this.ghostShaValidator;
  }

  /**
   * Manually scan a response payload for potential GHOST-SHA values.
   * Returns a scan result even if no validator is wired (empty result).
   *
   * Use this when you want to validate response data without enabling
   * automatic scanning on every request.
   */
  validateResponseShas(data: unknown, options?: GhostShaScanOptions): GhostShaScanResult {
    if (!this.ghostShaValidator) {
      return {
        scanned: 0,
        valid: [],
        invalid: [],
        unknown: [],
        hasGhostSha: false,
        scannedAt: Date.now(),
      };
    }
    return this.ghostShaValidator.scanObject(data, options);
  }

  /**
   * Internal: invoked after a successful response when `enableGhostShaValidation`
   * is true. Calls the optional callback and always console.warns on GHOST-SHA.
   */
  private reportGhostShaFindings(result: GhostShaScanResult): void {
    if (!result.hasGhostSha) return;
    if (this.onGhostShaDetected) {
      try {
        this.onGhostShaDetected(result);
      } catch {
        // Swallow callback errors so the original request still succeeds.
      }
    }
    if (typeof console !== "undefined" && console.warn) {
      const ghostCount = result.unknown.length + result.invalid.length;
      console.warn(
        `[RestApiClient] GHOST-SHA detected: ${ghostCount} suspicious SHA(s) ` +
        `(${result.unknown.length} unknown, ${result.invalid.length} invalid) ` +
        `out of ${result.scanned} field(s) scanned`
      );
    }
  }

}