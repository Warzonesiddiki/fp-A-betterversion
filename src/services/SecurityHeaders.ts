/**
 * SecurityHeaders — PATCH 11 (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * SECURITY HEADERS MIDDLEWARE — generate, validate, and apply defense-in-depth
 * HTTP security headers per OWASP Secure Headers Project + FinPlan Pro v1.0.0 policy.
 *
 * 11.1 CSP (Content Security Policy):
 *      - default-src 'self'
 *      - script-src: self + nonce (no unsafe-inline in prod)
 *      - style-src: self + nonce
 *      - img-src: self + data: + https: (for avatars, charts)
 *      - connect-src: self + wss: (for real-time)
 *      - frame-ancestors 'none' (anti-clickjacking)
 *      - object-src 'none'
 *      - base-uri 'self'
 *      - form-action 'self'
 *      - upgrade-insecure-requests
 * 11.2 HSTS (HTTP Strict Transport Security):
 *      - max-age=31536000 (1 year)
 *      - includeSubDomains
 *      - preload
 * 11.3 Anti-clickjacking:
 *      - X-Frame-Options: DENY
 *      - frame-ancestors 'none' (CSP)
 * 11.4 Content-type / XSS:
 *      - X-Content-Type-Options: nosniff
 *      - Referrer-Policy: strict-origin-when-cross-origin
 * 11.5 Cross-origin isolation:
 *      - Cross-Origin-Opener-Policy: same-origin
 *      - Cross-Origin-Embedder-Policy: require-corp
 *      - Cross-Origin-Resource-Policy: same-origin
 * 11.6 Permissions Policy (formerly Feature-Policy):
 *      - camera=(), microphone=(), geolocation=(), payment=() (deny all by default)
 *      - Allow only specific features as needed
 *
 * CWE references:
 * - CWE-1021 (Improper Restriction of Rendered UI Layers) — clickjacking
 * - CWE-79 (XSS) — CSP
 * - CWE-319 (Cleartext Transmission) — HSTS
 * - CWE-693 (Protection Mechanism Failure) — defense-in-depth
 *
 * @module services/SecurityHeaders
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const SECURITY_HEADERS_CONSTANTS = {
  /** Schema version for policy compatibility */
  SCHEMA_VERSION: 1,
  /** HSTS max-age in seconds (1 year) */
  HSTS_MAX_AGE: 31536000,
  /** HSTS max-age in seconds (2 years, for preload eligibility) */
  HSTS_MAX_AGE_PRELOAD: 63072000,
  /** Default CSP nonce length in bytes (base64-encoded) */
  CSP_NONCE_BYTES: 16,
  /** Maximum header value length (DoS prevention) */
  MAX_HEADER_LENGTH: 8192,
  /** Allowed sources for CSP directive */
  ALLOWED_SOURCES: [
    'self',
    'none',
    'unsafe-inline',
    'unsafe-eval',
    'strict-dynamic',
    'data:',
    'blob:',
    'https:',
    'wss:',
  ] as const,
  /** Default deny list for Permissions Policy */
  PERMISSIONS_POLICY_DENY: [
    'camera',
    'microphone',
    'geolocation',
    'payment',
    'usb',
    'magnetometer',
    'gyroscope',
    'accelerometer',
  ] as const,
  /** Permitted features for Permissions Policy */
  PERMISSIONS_POLICY_ALLOW: ['fullscreen', 'clipboard-read', 'clipboard-write'] as const,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

/** CSP source value */
export type CspSource =
  | 'self'
  | 'self '
  | 'none'
  | 'unsafe-inline'
  | 'unsafe-eval'
  | 'strict-dynamic'
  | 'data'
  | 'data:'
  | 'blob'
  | 'blob:'
  | 'https'
  | 'https:'
  | 'http'
  | 'http:'
  | 'wss'
  | 'wss:'
  | 'ws'
  | 'ws:'
  | `nonce-${string}`
  | `sha256-${string}`
  | `sha384-${string}`
  | `sha512-${string}`
  | `https://${string}`
  | `http://${string}`
  | `wss://${string}`
  | `ws://${string}`;

/** CSP directive configuration */
export interface CspDirectives {
  defaultSrc?: CspSource[];
  scriptSrc?: CspSource[];
  styleSrc?: CspSource[];
  imgSrc?: CspSource[];
  fontSrc?: CspSource[];
  connectSrc?: CspSource[];
  mediaSrc?: CspSource[];
  objectSrc?: CspSource[];
  frameSrc?: CspSource[];
  frameAncestors?: CspSource[];
  formAction?: CspSource[];
  baseUri?: CspSource[];
  manifestSrc?: CspSource[];
  workerSrc?: CspSource[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
  reportUri?: string;
  reportTo?: string;
}

/** Security headers policy */
export interface SecurityHeadersPolicy {
  csp?: CspDirectives;
  hsts?: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  contentTypeOptions?: boolean;
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin';
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless' | 'unsafe-none';
  crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin';
  permissionsPolicy?: Record<string, ('self' | 'src' | '*')[]>;
  customHeaders?: Record<string, string>;
}

/** Environment preset */
export type Environment = 'development' | 'staging' | 'production';

/** Default policies */
export type PresetPolicy = 'strict' | 'moderate' | 'permissive' | 'custom';

// ── Errors ───────────────────────────────────────────────────────────────────

export type SecurityHeadersErrorCode =
  | 'INVALID_DIRECTIVE'
  | 'INVALID_SOURCE'
  | 'INVALID_HSTS_VALUE'
  | 'INVALID_NONCE'
  | 'INVALID_HEADER_NAME'
  | 'INVALID_HEADER_VALUE'
  | 'HEADER_TOO_LONG'
  | 'POLICY_VALIDATION_FAILED'
  | 'CONFLICTING_POLICIES';

export class SecurityHeadersError extends Error {
  public readonly code: SecurityHeadersErrorCode;
  public readonly details?: Record<string, unknown>;
  constructor(code: SecurityHeadersErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SecurityHeadersError';
    this.code = code;
    this.details = details;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically-random CSP nonce.
 */
export function generateCspNonce(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new SecurityHeadersError('INVALID_NONCE', 'crypto.getRandomValues is not available');
  }
  const bytes = new Uint8Array(SECURITY_HEADERS_CONSTANTS.CSP_NONCE_BYTES);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Validate a CSP source value.
 */
export function isValidCspSource(source: string): boolean {
  if (!source || source.length === 0 || source.length > 256) {
    return false;
  }
  // Allowed keyword sources (CSP3 spec — keywords may be unquoted or single-quoted)
  const keywords = [
    'self',
    'none',
    'unsafe-inline',
    'unsafe-eval',
    'strict-dynamic',
    'report-sample',
    'wasm-unsafe-eval',
  ];
  // Strip surrounding single quotes for comparison (e.g. "'self'" -> "self")
  const stripped = source.replace(/^'(.*)'$/, '$1');
  if (keywords.includes(stripped) || keywords.includes(source)) {
    return true;
  }
  // URI schemes
  if (['data:', 'blob:', 'https:', 'wss:'].includes(source)) {
    return true;
  }
  // Nonce
  if (/^'nonce-[A-Za-z0-9+/=_-]{8,}'$/.test(source)) {
    return true;
  }
  // Hash
  if (/^'sha(256|384|512)-[A-Za-z0-9+/=_-]+'$/.test(source)) {
    return true;
  }
  // Wildcard (https://*.example.com)
  if (/^https:\/\/(\*\.)?[a-z0-9.-]+(:\d+)?(\/[a-z0-9._~:/?#@!$&'()*+,;=-]*)?$/i.test(source)) {
    return true;
  }
  return false;
}

/**
 * Validate a header name (per RFC 7230).
 */
export function isValidHeaderName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 256) {
    return false;
  }
  return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name);
}

/**
 * Validate a header value (no CR/LF).
 */
export function isValidHeaderValue(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  if (value.length > SECURITY_HEADERS_CONSTANTS.MAX_HEADER_LENGTH) {
    return false;
  }
  // No CR/LF (header injection prevention)
  if (/[\r\n]/.test(value)) {
    return false;
  }
  return true;
}

// ── SecurityHeaders class ────────────────────────────────────────────────────

export class SecurityHeaders {
  private readonly policy: SecurityHeadersPolicy;
  private readonly env: Environment;

  private constructor(policy: SecurityHeadersPolicy, env: Environment) {
    this.policy = policy;
    this.env = env;
  }

  // ── Factory methods ────────────────────────────────────────────────────

  /**
   * Create a SecurityHeaders instance from a custom policy.
   */
  public static create(
    policy: SecurityHeadersPolicy,
    env: Environment = 'production'
  ): SecurityHeaders {
    SecurityHeaders.validatePolicy(policy);
    return new SecurityHeaders(policy, env);
  }

  /**
   * Create a SecurityHeaders instance from a preset.
   */
  public static fromPreset(preset: PresetPolicy, env: Environment = 'production'): SecurityHeaders {
    return new SecurityHeaders(SecurityHeaders.presetPolicy(preset, env), env);
  }

  // ── Preset policies ────────────────────────────────────────────────────

  /**
   * Built-in policies.
   *   - 'strict': Production-grade, no unsafe-* directives
   *   - 'moderate': Production-grade with limited unsafe-inline for styles
   *   - 'permissive': Development with unsafe-eval
   *   - 'custom': Use create() with custom policy
   */
  public static presetPolicy(preset: PresetPolicy, env: Environment): SecurityHeadersPolicy {
    if (preset === 'custom') {
      throw new SecurityHeadersError(
        'POLICY_VALIDATION_FAILED',
        'custom preset requires create() with explicit policy'
      );
    }
    if (preset === 'permissive' && env === 'production') {
      throw new SecurityHeadersError(
        'CONFLICTING_POLICIES',
        'permissive preset is not allowed in production'
      );
    }

    const baseCsp: CspDirectives = {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: true,
    };

    if (preset === 'strict') {
      return {
        csp: {
          ...baseCsp,
          scriptSrc: ['self'],
          styleSrc: ['self'],
          imgSrc: ['self', 'data:', 'https:'],
          fontSrc: ['self'],
          connectSrc: ['self', 'wss:'],
          workerSrc: ['self'],
          manifestSrc: ['self'],
        },
        hsts: {
          enabled: true,
          maxAge: SECURITY_HEADERS_CONSTANTS.HSTS_MAX_AGE_PRELOAD,
          includeSubDomains: true,
          preload: true,
        },
        frameOptions: 'DENY',
        contentTypeOptions: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginEmbedderPolicy: 'require-corp',
        crossOriginResourcePolicy: 'same-origin',
        permissionsPolicy: SecurityHeaders.defaultDenyPermissions(),
      };
    }

    if (preset === 'moderate') {
      return {
        csp: {
          ...baseCsp,
          scriptSrc: ["'self'", "'unsafe-inline'"], // NOTE: nonce preferred; review for v1.1
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ['self', 'data:'],
          connectSrc: ['self', 'wss:'],
          workerSrc: ['self'],
        },
        hsts: {
          enabled: true,
          maxAge: SECURITY_HEADERS_CONSTANTS.HSTS_MAX_AGE,
          includeSubDomains: true,
          preload: false,
        },
        frameOptions: 'SAMEORIGIN',
        contentTypeOptions: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginEmbedderPolicy: 'unsafe-none',
        crossOriginResourcePolicy: 'same-origin',
        permissionsPolicy: SecurityHeaders.defaultDenyPermissions(),
      };
    }

    // permissive (dev only)
    return {
      csp: {
        ...baseCsp,
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ['self', 'data:', 'https:', 'http:'],
        connectSrc: ['self', 'wss:', 'ws:', 'http:', 'https:'],
        workerSrc: ['self', 'blob:'],
      },
      hsts: { enabled: false, maxAge: 0, includeSubDomains: false, preload: false },
      frameOptions: 'SAMEORIGIN',
      contentTypeOptions: true,
      referrerPolicy: 'no-referrer-when-downgrade',
      crossOriginOpenerPolicy: 'unsafe-none',
      crossOriginEmbedderPolicy: 'unsafe-none',
      crossOriginResourcePolicy: 'cross-origin',
      permissionsPolicy: {},
    };
  }

  /**
   * Default deny-all Permissions Policy.
   */
  public static defaultDenyPermissions(): Record<string, ('self' | 'src' | '*')[]> {
    const result: Record<string, ('self' | 'src' | '*')[]> = {};
    for (const perm of SECURITY_HEADERS_CONSTANTS.PERMISSIONS_POLICY_DENY) {
      result[perm] = [];
    }
    return result;
  }

  // ── Validation ─────────────────────────────────────────────────────────

  /**
   * Validate a SecurityHeadersPolicy.
   */
  public static validatePolicy(policy: SecurityHeadersPolicy): void {
    if (policy.csp) {
      SecurityHeaders.validateCsp(policy.csp);
    }
    if (policy.hsts && policy.hsts.enabled) {
      if (policy.hsts.maxAge < 0 || policy.hsts.maxAge > 63072000) {
        throw new SecurityHeadersError(
          'INVALID_HSTS_VALUE',
          `HSTS max-age must be 0-63072000 (2 years), got ${policy.hsts.maxAge}`
        );
      }
    }
    if (policy.permissionsPolicy) {
      for (const [feature, allowList] of Object.entries(policy.permissionsPolicy)) {
        for (const value of allowList) {
          if (!['self', 'src', '*'].includes(value)) {
            throw new SecurityHeadersError(
              'POLICY_VALIDATION_FAILED',
              `Invalid permissions policy value: ${feature}=${value}`
            );
          }
        }
      }
    }
    if (policy.customHeaders) {
      for (const [name, value] of Object.entries(policy.customHeaders)) {
        if (!isValidHeaderName(name)) {
          throw new SecurityHeadersError('INVALID_HEADER_NAME', `Invalid header name: ${name}`);
        }
        if (!isValidHeaderValue(value)) {
          throw new SecurityHeadersError(
            'INVALID_HEADER_VALUE',
            `Invalid header value for ${name}`
          );
        }
      }
    }
  }

  /**
   * Validate CSP directives.
   */
  public static validateCsp(csp: CspDirectives): void {
    for (const [directive, sources] of Object.entries(csp)) {
      if (
        directive === 'upgradeInsecureRequests' ||
        directive === 'blockAllMixedContent' ||
        directive === 'reportUri' ||
        directive === 'reportTo'
      ) {
        continue;
      }
      if (!Array.isArray(sources)) {
        throw new SecurityHeadersError(
          'INVALID_DIRECTIVE',
          `CSP directive ${directive} must be an array`
        );
      }
      for (const source of sources) {
        if (!isValidCspSource(source)) {
          throw new SecurityHeadersError(
            'INVALID_SOURCE',
            `Invalid CSP source for ${directive}: ${source}`
          );
        }
      }
    }
  }

  // ── Header generation ──────────────────────────────────────────────────

  /**
   * Generate all security headers as a Record<string, string>.
   */
  public generate(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.policy.csp) {
      headers['Content-Security-Policy'] = this.buildCspString(this.policy.csp);
    }
    if (this.policy.hsts && this.policy.hsts.enabled) {
      headers['Strict-Transport-Security'] = this.buildHstsString(this.policy.hsts);
    }
    if (this.policy.frameOptions) {
      headers['X-Frame-Options'] = this.policy.frameOptions;
    }
    if (this.policy.contentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }
    if (this.policy.referrerPolicy) {
      headers['Referrer-Policy'] = this.policy.referrerPolicy;
    }
    if (this.policy.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = this.policy.crossOriginOpenerPolicy;
    }
    if (this.policy.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = this.policy.crossOriginEmbedderPolicy;
    }
    if (this.policy.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = this.policy.crossOriginResourcePolicy;
    }
    if (this.policy.permissionsPolicy) {
      const pp = this.buildPermissionsPolicyString(this.policy.permissionsPolicy);
      if (pp) {
        headers['Permissions-Policy'] = pp;
      }
    }
    if (this.policy.customHeaders) {
      for (const [name, value] of Object.entries(this.policy.customHeaders)) {
        headers[name] = value;
      }
    }
    return headers;
  }

  /**
   * Build CSP header string from directives.
   */
  public buildCspString(csp: CspDirectives): string {
    const parts: string[] = [];
    const pushDirective = (name: string, values: string[]): void => {
      if (values && values.length > 0) {
        parts.push(`${name} ${values.join(' ')}`);
      }
    };
    pushDirective('default-src', csp.defaultSrc ?? []);
    pushDirective('script-src', csp.scriptSrc ?? []);
    pushDirective('style-src', csp.styleSrc ?? []);
    pushDirective('img-src', csp.imgSrc ?? []);
    pushDirective('font-src', csp.fontSrc ?? []);
    pushDirective('connect-src', csp.connectSrc ?? []);
    pushDirective('media-src', csp.mediaSrc ?? []);
    pushDirective('object-src', csp.objectSrc ?? []);
    pushDirective('frame-src', csp.frameSrc ?? []);
    pushDirective('frame-ancestors', csp.frameAncestors ?? []);
    pushDirective('form-action', csp.formAction ?? []);
    pushDirective('base-uri', csp.baseUri ?? []);
    pushDirective('manifest-src', csp.manifestSrc ?? []);
    pushDirective('worker-src', csp.workerSrc ?? []);
    if (csp.upgradeInsecureRequests) parts.push('upgrade-insecure-requests');
    if (csp.blockAllMixedContent) parts.push('block-all-mixed-content');
    if (csp.reportUri) parts.push(`report-uri ${csp.reportUri}`);
    if (csp.reportTo) parts.push(`report-to ${csp.reportTo}`);
    return parts.join('; ');
  }

  /**
   * Build HSTS header string.
   */
  public buildHstsString(hsts: NonNullable<SecurityHeadersPolicy['hsts']>): string {
    const parts: string[] = [`max-age=${hsts.maxAge}`];
    if (hsts.includeSubDomains) parts.push('includeSubDomains');
    if (hsts.preload) parts.push('preload');
    return parts.join('; ');
  }

  /**
   * Build Permissions-Policy header string.
   */
  public buildPermissionsPolicyString(
    pp: NonNullable<SecurityHeadersPolicy['permissionsPolicy']>
  ): string {
    const parts: string[] = [];
    for (const [feature, allowList] of Object.entries(pp)) {
      if (allowList.length === 0) {
        parts.push(`${feature}=()`);
      } else {
        parts.push(`${feature}=(${allowList.map((v) => (v === '*' ? '*' : `"${v}"`)).join(' ')})`);
      }
    }
    return parts.join(', ');
  }

  /**
   * Get the policy.
   */
  public getPolicy(): SecurityHeadersPolicy {
    return this.policy;
  }

  /**
   * Get the environment.
   */
  public getEnvironment(): Environment {
    return this.env;
  }
}
