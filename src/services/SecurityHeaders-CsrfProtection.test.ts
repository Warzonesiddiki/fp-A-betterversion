/**
 * SecurityHeaders + CsrfProtection — PATCH 11 tests (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * Comprehensive test coverage for HTTP security headers and CSRF protection.
 *
 * @module services/SecurityHeaders-CsrfProtection.test
 */

import { describe, it, expect } from 'vitest';
import {
  SecurityHeaders,
  SecurityHeadersError,
  SECURITY_HEADERS_CONSTANTS,
  generateCspNonce,
  isValidCspSource,
  isValidHeaderName,
  isValidHeaderValue,
  type CspDirectives,
  type SecurityHeadersPolicy,
} from './SecurityHeaders';
import {
  CsrfProtection,
  CsrfProtectionError,
  CSRF_PROTECTION_CONSTANTS,
  type CsrfToken,
} from './CsrfProtection';

// ── 1. SECURITY_HEADERS_CONSTANTS ───────────────────────────────────────────

describe('1. SECURITY_HEADERS_CONSTANTS', () => {
  it('1.1 has schema version 1', () => {
    expect(SECURITY_HEADERS_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });

  it('1.2 HSTS max-age is 1 year by default', () => {
    expect(SECURITY_HEADERS_CONSTANTS.HSTS_MAX_AGE).toBe(31536000);
  });

  it('1.3 HSTS preload max-age is 2 years', () => {
    expect(SECURITY_HEADERS_CONSTANTS.HSTS_MAX_AGE_PRELOAD).toBe(63072000);
  });

  it('1.4 has all 6 default deny permissions', () => {
    expect(SECURITY_HEADERS_CONSTANTS.PERMISSIONS_POLICY_DENY).toContain('camera');
    expect(SECURITY_HEADERS_CONSTANTS.PERMISSIONS_POLICY_DENY).toContain('microphone');
    expect(SECURITY_HEADERS_CONSTANTS.PERMISSIONS_POLICY_DENY).toContain('geolocation');
    expect(SECURITY_HEADERS_CONSTANTS.PERMISSIONS_POLICY_DENY).toContain('payment');
    expect(SECURITY_HEADERS_CONSTANTS.PERMISSIONS_POLICY_DENY).toContain('usb');
    expect(SECURITY_HEADERS_CONSTANTS.PERMISSIONS_POLICY_DENY.length).toBe(8);
  });
});

// ── 2. generateCspNonce ─────────────────────────────────────────────────────

describe('2. generateCspNonce', () => {
  it('2.1 generates a base64 string', () => {
    const nonce = generateCspNonce();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(16);
  });

  it('2.2 generates unique nonces on each call', () => {
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a).not.toBe(b);
  });

  it('2.3 generates 100 nonces without collision (probabilistic)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      seen.add(generateCspNonce());
    }
    expect(seen.size).toBe(100);
  });
});

// ── 3. isValidCspSource ──────────────────────────────────────────────────────

describe('3. isValidCspSource', () => {
  it('3.1 accepts keyword sources', () => {
    expect(isValidCspSource("'self'")).toBe(true);
    expect(isValidCspSource("'none'")).toBe(true);
    expect(isValidCspSource("'unsafe-inline'")).toBe(true);
    expect(isValidCspSource("'unsafe-eval'")).toBe(true);
    expect(isValidCspSource("'strict-dynamic'")).toBe(true);
  });

  it('3.2 accepts URI scheme sources', () => {
    expect(isValidCspSource('data:')).toBe(true);
    expect(isValidCspSource('blob:')).toBe(true);
    expect(isValidCspSource('https:')).toBe(true);
    expect(isValidCspSource('wss:')).toBe(true);
  });

  it('3.3 accepts nonce sources', () => {
    expect(isValidCspSource("'nonce-abc123def456'")).toBe(true);
    expect(isValidCspSource("'nonce-XYZ0123456789ABCDEF=='")).toBe(true);
  });

  it('3.4 accepts hash sources', () => {
    expect(isValidCspSource("'sha256-AbCdEf0123456789+/='")).toBe(true);
    expect(isValidCspSource("'sha384-XYZ'")).toBe(true);
    expect(isValidCspSource("'sha512-abc=='")).toBe(true);
  });

  it('3.5 accepts https URL sources', () => {
    expect(isValidCspSource('https://cdn.example.com')).toBe(true);
    expect(isValidCspSource('https://*.googleapis.com')).toBe(true);
    expect(isValidCspSource('https://example.com:8080')).toBe(true);
  });

  it('3.6 rejects empty/invalid sources', () => {
    expect(isValidCspSource('')).toBe(false);
    expect(isValidCspSource('javascript:')).toBe(false);
    expect(isValidCspSource('eval()')).toBe(false);
    expect(isValidCspSource("'unsafe-eval")).toBe(false); // missing closing quote
  });
});

// ── 4. isValidHeaderName / isValidHeaderValue ───────────────────────────────

describe('4. isValidHeaderName / isValidHeaderValue', () => {
  it('4.1 accepts valid header names', () => {
    expect(isValidHeaderName('Content-Security-Policy')).toBe(true);
    expect(isValidHeaderName('X-Frame-Options')).toBe(true);
    expect(isValidHeaderName('Content-Type')).toBe(true);
  });

  it('4.2 rejects invalid header names', () => {
    expect(isValidHeaderName('')).toBe(false);
    expect(isValidHeaderName('Content Security Policy')).toBe(false); // space
    expect(isValidHeaderName('Header:Inject')).toBe(false); // colon
  });

  it('4.3 accepts valid header values', () => {
    expect(isValidHeaderValue("default-src 'self'")).toBe(true);
    expect(isValidHeaderValue('max-age=31536000')).toBe(true);
  });

  it('4.4 rejects header injection attempts', () => {
    expect(isValidHeaderValue('value\r\nX-Injected: true')).toBe(false);
    expect(isValidHeaderValue('value\nfake-header: 1')).toBe(false);
  });
});

// ── 5. SecurityHeaders.fromPreset ───────────────────────────────────────────

describe('5. SecurityHeaders.fromPreset', () => {
  it('5.1 strict preset has no unsafe-* directives', () => {
    const sh = SecurityHeaders.fromPreset('strict', 'production');
    const csp = sh.getPolicy().csp!;
    expect(csp.scriptSrc).not.toContain("'unsafe-inline'");
    expect(csp.scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('5.2 strict preset has HSTS preload enabled', () => {
    const sh = SecurityHeaders.fromPreset('strict', 'production');
    const hsts = sh.getPolicy().hsts!;
    expect(hsts.enabled).toBe(true);
    expect(hsts.preload).toBe(true);
    expect(hsts.maxAge).toBe(SECURITY_HEADERS_CONSTANTS.HSTS_MAX_AGE_PRELOAD);
  });

  it('5.3 strict preset has X-Frame-Options DENY', () => {
    const sh = SecurityHeaders.fromPreset('strict', 'production');
    expect(sh.getPolicy().frameOptions).toBe('DENY');
  });

  it('5.4 moderate preset allows unsafe-inline for styles', () => {
    const sh = SecurityHeaders.fromPreset('moderate', 'production');
    expect(sh.getPolicy().csp!.styleSrc).toContain("'unsafe-inline'");
  });

  it('5.5 permissive preset is rejected in production', () => {
    expect(() => SecurityHeaders.fromPreset('permissive', 'production')).toThrow(/production/);
  });

  it('5.6 permissive preset is allowed in development', () => {
    const sh = SecurityHeaders.fromPreset('permissive', 'development');
    expect(sh.getPolicy().csp!.scriptSrc).toContain("'unsafe-eval'");
  });

  it('5.7 custom preset requires create()', () => {
    expect(() => SecurityHeaders.fromPreset('custom', 'production')).toThrow(/custom/);
  });
});

// ── 6. SecurityHeaders.generate ─────────────────────────────────────────────

describe('6. SecurityHeaders.generate', () => {
  it('6.1 generates all expected headers for strict preset', () => {
    const sh = SecurityHeaders.fromPreset('strict', 'production');
    const headers = sh.generate();
    expect(headers['Content-Security-Policy']).toBeDefined();
    expect(headers['Strict-Transport-Security']).toBeDefined();
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBeDefined();
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(headers['Cross-Origin-Embedder-Policy']).toBe('require-corp');
    expect(headers['Cross-Origin-Resource-Policy']).toBe('same-origin');
    expect(headers['Permissions-Policy']).toBeDefined();
  });

  it('6.2 HSTS header string format is correct', () => {
    const sh = SecurityHeaders.create({
      hsts: { enabled: true, maxAge: 31536000, includeSubDomains: true, preload: false },
    }, 'production');
    const headers = sh.generate();
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
  });

  it('6.3 HSTS with preload', () => {
    const sh = SecurityHeaders.create({
      hsts: { enabled: true, maxAge: 63072000, includeSubDomains: true, preload: true },
    }, 'production');
    const headers = sh.generate();
    expect(headers['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains; preload');
  });

  it('6.4 CSP string format', () => {
    const sh = SecurityHeaders.create({
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: true,
      },
    }, 'production');
    const headers = sh.generate();
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Content-Security-Policy']).toContain("script-src 'self'");
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
    expect(headers['Content-Security-Policy']).toContain('upgrade-insecure-requests');
  });

  it('6.5 Permissions-Policy empty list = deny', () => {
    const sh = SecurityHeaders.create({
      permissionsPolicy: { camera: [], microphone: [] },
    }, 'production');
    const headers = sh.generate();
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Permissions-Policy']).toContain('microphone=()');
  });

  it('6.6 Permissions-Policy allow list', () => {
    const sh = SecurityHeaders.create({
      permissionsPolicy: { fullscreen: ['self'], clipboardRead: ['self'] },
    }, 'production');
    const headers = sh.generate();
    expect(headers['Permissions-Policy']).toContain('fullscreen=("self")');
  });
});

// ── 7. SecurityHeaders.validatePolicy ───────────────────────────────────────

describe('7. SecurityHeaders.validatePolicy', () => {
  it('7.1 rejects invalid CSP source', () => {
    expect(() => SecurityHeaders.create({
      csp: { scriptSrc: ['javascript:evil()'] as never },
    }, 'production')).toThrow(/Invalid CSP source/);
  });

  it('7.2 rejects HSTS max-age > 2 years', () => {
    expect(() => SecurityHeaders.create({
      hsts: { enabled: true, maxAge: 99999999, includeSubDomains: true, preload: false },
    }, 'production')).toThrow(/max-age/);
  });

  it('7.3 rejects invalid permissions policy value', () => {
    expect(() => SecurityHeaders.create({
      permissionsPolicy: { camera: ['evil' as never] },
    }, 'production')).toThrow(/permissions policy/);
  });

  it('7.4 rejects invalid header name in customHeaders', () => {
    expect(() => SecurityHeaders.create({
      customHeaders: { 'Bad Name With Spaces': 'value' },
    }, 'production')).toThrow(/header name/);
  });

  it('7.5 rejects header injection in customHeaders value', () => {
    expect(() => SecurityHeaders.create({
      customHeaders: { 'X-Custom': 'value\r\nX-Injected: 1' },
    }, 'production')).toThrow(/header value/);
  });
});

// ── 8. CSRF_PROTECTION_CONSTANTS ────────────────────────────────────────────

describe('8. CSRF_PROTECTION_CONSTANTS', () => {
  it('8.1 has correct schema version', () => {
    expect(CSRF_PROTECTION_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });

  it('8.2 has 1 hour default lifetime', () => {
    expect(CSRF_PROTECTION_CONSTANTS.DEFAULT_TOKEN_LIFETIME_SECONDS).toBe(3600);
  });

  it('8.3 has 24h max and 60s min lifetimes', () => {
    expect(CSRF_PROTECTION_CONSTANTS.MAX_TOKEN_LIFETIME_SECONDS).toBe(86400);
    expect(CSRF_PROTECTION_CONSTANTS.MIN_TOKEN_LIFETIME_SECONDS).toBe(60);
  });

  it('8.4 has 16-byte nonce', () => {
    expect(CSRF_PROTECTION_CONSTANTS.NONCE_BYTES).toBe(16);
  });

  it('8.5 default cookie + header names', () => {
    expect(CSRF_PROTECTION_CONSTANTS.DEFAULT_COOKIE_NAME).toBe('fpa_csrf_token');
    expect(CSRF_PROTECTION_CONSTANTS.DEFAULT_HEADER_NAME).toBe('X-CSRF-Token');
  });
});

// ── 9. CsrfProtection.create ────────────────────────────────────────────────

describe('9. CsrfProtection.create', () => {
  it('9.1 creates instance with valid secret', () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    expect(csrf.getTokenLifetime()).toBe(CSRF_PROTECTION_CONSTANTS.DEFAULT_TOKEN_LIFETIME_SECONDS);
    expect(csrf.getCookieName()).toBe(CSRF_PROTECTION_CONSTANTS.DEFAULT_COOKIE_NAME);
    expect(csrf.getHeaderName()).toBe(CSRF_PROTECTION_CONSTANTS.DEFAULT_HEADER_NAME);
  });

  it('9.2 rejects secret < 32 chars', () => {
    expect(() => CsrfProtection.create({ secretKey: 'short' })).toThrow(CsrfProtectionError);
  });

  it('9.3 rejects lifetime < 60 seconds', () => {
    expect(() => CsrfProtection.create({ secretKey: 'a'.repeat(32), tokenLifetimeSeconds: 10 })).toThrow(/lifetime/);
  });

  it('9.4 rejects lifetime > 24 hours', () => {
    expect(() => CsrfProtection.create({ secretKey: 'a'.repeat(32), tokenLifetimeSeconds: 99999 })).toThrow(/lifetime/);
  });

  it('9.5 custom cookie and header names', () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32), cookieName: 'my_csrf', headerName: 'X-My-Token' });
    expect(csrf.getCookieName()).toBe('my_csrf');
    expect(csrf.getHeaderName()).toBe('X-My-Token');
  });
});

// ── 10. CsrfProtection.generate ─────────────────────────────────────────────

describe('10. CsrfProtection.generate', () => {
  it('10.1 generates token with 3-part structure', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const result = await csrf.generate();
    const parts = result.token.split('.');
    expect(parts.length).toBe(3);
  });

  it('10.2 cookie attributes are secure by default', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const result = await csrf.generate();
    expect(result.cookieAttributes.httpOnly).toBe(true);
    expect(result.cookieAttributes.secure).toBe(true);
    expect(result.cookieAttributes.sameSite).toBe('Strict');
    expect(result.cookieAttributes.path).toBe('/');
  });

  it('10.3 generates unique tokens on each call', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const a = await csrf.generate();
    const b = await csrf.generate();
    expect(a.token).not.toBe(b.token);
  });

  it('10.4 expiresAt is in the future', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const result = await csrf.generate();
    const expires = new Date(result.expiresAt).getTime();
    expect(expires).toBeGreaterThan(Date.now());
  });
});

// ── 11. CsrfProtection.verify ───────────────────────────────────────────────

describe('11. CsrfProtection.verify', () => {
  it('11.1 valid token returns valid:true', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const token = await csrf.generate();
    const result = await csrf.verify(token.token, token.token);
    expect(result.valid).toBe(true);
  });

  it('11.2 missing cookie returns MISSING_COOKIE', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const result = await csrf.verify(null, 'some-header-value');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('MISSING_COOKIE');
  });

  it('11.3 missing header returns MISSING_HEADER', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const result = await csrf.verify('some-cookie-value', null);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('MISSING_HEADER');
  });

  it('11.4 mismatch returns MISMATCH', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const token = await csrf.generate();
    const result = await csrf.verify(token.token, 'different-header-value');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('MISMATCH');
  });

  it('11.5 malformed token returns MALFORMED', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const result = await csrf.verify('not-a-valid-token', 'not-a-valid-token');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('MALFORMED');
  });

  it('11.6 invalid signature returns INVALID_SIGNATURE', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const token = await csrf.generate();
    const parts = token.token.split('.');
    const tampered = `${parts[0]}.${parts[1]}.${'A'.repeat(parts[2].length)}`;
    const result = await csrf.verify(tampered, tampered);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INVALID_SIGNATURE');
  });

  it('11.7 different secrets produce different signatures', async () => {
    const csrf1 = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const csrf2 = CsrfProtection.create({ secretKey: 'b'.repeat(32) });
    const token1 = await csrf1.generate();
    const result = await csrf2.verify(token1.token, token1.token);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INVALID_SIGNATURE');
  });
});

// ── 12. CsrfProtection.buildSetCookieHeader ─────────────────────────────────

describe('12. CsrfProtection.buildSetCookieHeader', () => {
  it('12.1 builds correct Set-Cookie string', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const token = await csrf.generate();
    const header = csrf.buildSetCookieHeader(token.cookieAttributes);
    expect(header).toContain('fpa_csrf_token=');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Strict');
    expect(header).toContain('Path=/');
    expect(header).toContain('Max-Age=3600');
  });

  it('12.2 no header injection in cookie value', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const token = await csrf.generate();
    const header = csrf.buildSetCookieHeader(token.cookieAttributes);
    expect(header).not.toContain('\r');
    expect(header).not.toContain('\n');
  });
});

// ── 13. Integration scenarios ───────────────────────────────────────────────

describe('13. Integration scenarios', () => {
  it('13.1 FinPlan Pro v1.0.0 production security headers', () => {
    const sh = SecurityHeaders.fromPreset('strict', 'production');
    const headers = sh.generate();
    // Verify SOC 2 CC6.6 requirements
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Strict-Transport-Security']).toContain('max-age=');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('13.2 CSP nonce integration: generate + include in CSP', () => {
    const nonce = generateCspNonce();
    const sh = SecurityHeaders.create({
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: [`'nonce-${nonce}'`],
        styleSrc: [`'nonce-${nonce}'`],
      },
    }, 'production');
    const headers = sh.generate();
    expect(headers['Content-Security-Policy']).toContain(`'nonce-${nonce}'`);
  });

  it('13.3 CSRF token + security headers: full request setup', async () => {
    const csrf = CsrfProtection.create({ secretKey: 'a'.repeat(32) });
    const sh = SecurityHeaders.fromPreset('strict', 'production');
    const token = await csrf.generate();
    const headers = sh.generate();
    // Combine: Set-Cookie from CSRF + security headers
    expect(headers['Content-Security-Policy']).toBeDefined();
    const setCookie = csrf.buildSetCookieHeader(token.cookieAttributes);
    expect(setCookie).toContain('fpa_csrf_token=');
  });
});
