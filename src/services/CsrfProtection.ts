/**
 * CsrfProtection — PATCH 11 (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * CSRF (Cross-Site Request Forgery) defense using double-submit cookie pattern
 * + HMAC-SHA256 token signing. Defends against unauthorized state-changing
 * requests from cross-origin attacker sites.
 *
 * 11.7 Double-submit cookie pattern:
 *      - Server generates HMAC-signed token, sets in cookie (HttpOnly, SameSite=Strict)
 *      - Client reads token from cookie and sends in X-CSRF-Token header
 *      - Server compares cookie value with header value (constant-time compare)
 *      - If match: request is same-origin; if mismatch: reject
 * 11.8 HMAC token format:
 *      - <expiresAt>.<nonce>.<signature>
 *      - expiresAt: Unix timestamp (seconds)
 *      - nonce: 16 random bytes (base64)
 *      - signature: HMAC-SHA256(expiresAt + "." + nonce, derivedKey)
 * 11.9 Token lifetime:
 *      - Default 1 hour, configurable 60-86400 seconds
 *      - Constant-time compare for cookie vs header
 *
 * CWE-352 (Cross-Site Request Forgery) defense.
 *
 * @module services/CsrfProtection
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const CSRF_PROTECTION_CONSTANTS = {
  /** Schema version for token format */
  SCHEMA_VERSION: 1,
  /** Default token lifetime in seconds (1 hour) */
  DEFAULT_TOKEN_LIFETIME_SECONDS: 3600,
  /** Maximum token lifetime in seconds (24 hours) */
  MAX_TOKEN_LIFETIME_SECONDS: 86400,
  /** Minimum token lifetime in seconds (60 seconds) */
  MIN_TOKEN_LIFETIME_SECONDS: 60,
  /** Random nonce size in bytes */
  NONCE_BYTES: 16,
  /** Default cookie name */
  DEFAULT_COOKIE_NAME: 'fpa_csrf_token',
  /** Default header name */
  DEFAULT_HEADER_NAME: 'X-CSRF-Token',
  /** HMAC key derivation iterations */
  PBKDF2_ITERATIONS: 100000,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

/** CSRF error codes */
export type CsrfProtectionErrorCode =
  | 'INVALID_SECRET'
  | 'INVALID_LIFETIME'
  | 'CRYPTO_UNAVAILABLE'
  | 'SIGN_FAILED';

/** CSRF error class */
export class CsrfProtectionError extends Error {
  public readonly code: CsrfProtectionErrorCode;
  public readonly details?: Record<string, unknown>;
  constructor(code: CsrfProtectionErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'CsrfProtectionError';
    this.code = code;
    this.details = details;
  }
}

/** Token generation result */
export interface CsrfToken {
  /** Raw token value (cookie + header) */
  token: string;
  /** Cookie attributes */
  cookieAttributes: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
    path: string;
    maxAge: number;
  };
  /** Expiration timestamp (ISO 8601) */
  expiresAt: string;
}

/** Token validation result */
export interface CsrfValidationResult {
  valid: boolean;
  reason?: 'MISSING_COOKIE' | 'MISSING_HEADER' | 'MISMATCH' | 'EXPIRED' | 'MALFORMED' | 'INVALID_SIGNATURE';
  expiresAt?: string;
}

/** Verification options */
export interface VerifyOptions {
  /** Cookie name to read from */
  cookieName?: string;
  /** Header name to read from */
  headerName?: string;
  /** Allowed clock skew in seconds */
  clockSkewSeconds?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Constant-time string comparison.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Convert ArrayBuffer to base64 string.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ── CsrfProtection class ─────────────────────────────────────────────────────

export class CsrfProtection {
  private readonly secretKey: string;
  private readonly tokenLifetimeSeconds: number;
  private readonly cookieName: string;
  private readonly headerName: string;

  /** Cached derived HMAC key (Uint8Array) */
  private cachedKey: Uint8Array | null = null;

  private constructor(secretKey: string, tokenLifetimeSeconds: number, cookieName: string, headerName: string) {
    if (!secretKey || secretKey.length < 32) {
      throw new CsrfProtectionError('INVALID_SECRET', 'CSRF secret key must be at least 32 characters', { secretLength: secretKey?.length ?? 0 });
    }
    if (tokenLifetimeSeconds < CSRF_PROTECTION_CONSTANTS.MIN_TOKEN_LIFETIME_SECONDS ||
        tokenLifetimeSeconds > CSRF_PROTECTION_CONSTANTS.MAX_TOKEN_LIFETIME_SECONDS) {
      throw new CsrfProtectionError('INVALID_LIFETIME', `Token lifetime must be ${CSRF_PROTECTION_CONSTANTS.MIN_TOKEN_LIFETIME_SECONDS}-${CSRF_PROTECTION_CONSTANTS.MAX_TOKEN_LIFETIME_SECONDS} seconds`, { tokenLifetimeSeconds });
    }
    this.secretKey = secretKey;
    this.tokenLifetimeSeconds = tokenLifetimeSeconds;
    this.cookieName = cookieName;
    this.headerName = headerName;
  }

  // ── Factory ─────────────────────────────────────────────────────────────

  /**
   * Create a CsrfProtection instance.
   */
  public static create(options: {
    secretKey: string;
    tokenLifetimeSeconds?: number;
    cookieName?: string;
    headerName?: string;
  }): CsrfProtection {
    return new CsrfProtection(
      options.secretKey,
      options.tokenLifetimeSeconds ?? CSRF_PROTECTION_CONSTANTS.DEFAULT_TOKEN_LIFETIME_SECONDS,
      options.cookieName ?? CSRF_PROTECTION_CONSTANTS.DEFAULT_COOKIE_NAME,
      options.headerName ?? CSRF_PROTECTION_CONSTANTS.DEFAULT_HEADER_NAME
    );
  }

  // ── HMAC key derivation ────────────────────────────────────────────────

  private async getKey(): Promise<Uint8Array> {
    if (this.cachedKey) {
      return this.cachedKey;
    }
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new CsrfProtectionError('CRYPTO_UNAVAILABLE', 'Web Crypto API is not available');
    }
    const enc = new TextEncoder();
    // Derive key using PBKDF2
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(this.secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const salt = enc.encode('fpa-csrf-v1'); // Fixed domain-separated salt
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: CSRF_PROTECTION_CONSTANTS.PBKDF2_ITERATIONS, hash: 'SHA-256' },
      baseKey,
      256
    );
    this.cachedKey = new Uint8Array(derivedBits);
    return this.cachedKey;
  }

  // ── Token generation ───────────────────────────────────────────────────

  /**
   * Generate a new CSRF token.
   * Returns token + cookie attributes for setting the cookie.
   */
  public async generate(): Promise<CsrfToken> {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.tokenLifetimeSeconds;

    // Generate random nonce
    const nonceBytes = new Uint8Array(CSRF_PROTECTION_CONSTANTS.NONCE_BYTES);
    crypto.getRandomValues(nonceBytes);
    const nonce = bufferToBase64(nonceBytes.buffer);

    // Build token payload: <expiresAt>.<nonce>
    const payload = `${expiresAt}.${nonce}`;

    // Sign with HMAC-SHA256
    const keyBytes = await this.getKey();
    const enc = new TextEncoder();
    const hmacKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuffer = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(payload));
    const sig = bufferToBase64(sigBuffer);

    const token = `${payload}.${sig}`;
    const expiresAtIso = new Date(expiresAt * 1000).toISOString();

    return {
      token,
      expiresAt: expiresAtIso,
      cookieAttributes: {
        name: this.cookieName,
        value: token,
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/',
        maxAge: this.tokenLifetimeSeconds,
      },
    };
  }

  // ── Token validation ───────────────────────────────────────────────────

  /**
   * Verify a CSRF token from cookie + header.
   * Returns validation result.
   */
  public async verify(cookieValue: string | null, headerValue: string | null, _options: VerifyOptions = {}): Promise<CsrfValidationResult> {
    if (!cookieValue) {
      return { valid: false, reason: 'MISSING_COOKIE' };
    }
    if (!headerValue) {
      return { valid: false, reason: 'MISSING_HEADER' };
    }

    // Constant-time compare
    if (!constantTimeCompare(cookieValue, headerValue)) {
      return { valid: false, reason: 'MISMATCH' };
    }

    // Parse token: <expiresAt>.<nonce>.<sig>
    const parts = cookieValue.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'MALFORMED' };
    }
    const [expiresAtStr, nonce, sig] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (!Number.isFinite(expiresAt)) {
      return { valid: false, reason: 'MALFORMED' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      return { valid: false, reason: 'EXPIRED', expiresAt: new Date(expiresAt * 1000).toISOString() };
    }

    // Verify HMAC signature
    const keyBytes = await this.getKey();
    const enc = new TextEncoder();
    const hmacKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expectedSigBuffer = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(`${expiresAtStr}.${nonce}`));
    const expectedSig = bufferToBase64(expectedSigBuffer);

    if (!constantTimeCompare(sig, expectedSig)) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    return { valid: true, expiresAt: new Date(expiresAt * 1000).toISOString() };
  }

  /**
   * Build a Set-Cookie header string for the given cookie attributes.
   */
  public buildSetCookieHeader(cookie: CsrfToken['cookieAttributes']): string {
    const parts: string[] = [`${cookie.name}=${cookie.value}`];
    if (cookie.maxAge > 0) parts.push(`Max-Age=${cookie.maxAge}`);
    parts.push(`Path=${cookie.path}`);
    if (cookie.httpOnly) parts.push('HttpOnly');
    if (cookie.secure) parts.push('Secure');
    parts.push(`SameSite=${cookie.sameSite}`);
    return parts.join('; ');
  }

  /**
   * Get the cookie name.
   */
  public getCookieName(): string {
    return this.cookieName;
  }

  /**
   * Get the header name.
   */
  public getHeaderName(): string {
    return this.headerName;
  }

  /**
   * Get the token lifetime in seconds.
   */
  public getTokenLifetime(): number {
    return this.tokenLifetimeSeconds;
  }
}
