import { describe, it, expect } from 'vitest';
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  getTauriSecurityHeaders,
  getViteSecurityHeaders,
  getCSPMetaContent,
} from '../securityHeaders';

describe('securityHeaders', () => {
  it('CONTENT_SECURITY_POLICY contains default-src', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('SECURITY_HEADERS contains all required headers', () => {
    expect(SECURITY_HEADERS).toHaveProperty('Content-Security-Policy');
    expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options', 'DENY');
    expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options', 'nosniff');
    expect(SECURITY_HEADERS).toHaveProperty('Referrer-Policy');
    expect(SECURITY_HEADERS).toHaveProperty('Permissions-Policy');
    expect(SECURITY_HEADERS).toHaveProperty('Cross-Origin-Opener-Policy', 'same-origin');
    expect(SECURITY_HEADERS).toHaveProperty('Cross-Origin-Resource-Policy', 'same-origin');
  });

  it('getTauriSecurityHeaders returns copy of SECURITY_HEADERS', () => {
    const headers = getTauriSecurityHeaders();
    expect(headers).toEqual(SECURITY_HEADERS);
    expect(headers).not.toBe(SECURITY_HEADERS);
  });

  it('getViteSecurityHeaders includes ws: in connect-src', () => {
    const headers = getViteSecurityHeaders();
    expect(headers['Content-Security-Policy']).toContain('ws:');
    expect(headers['Content-Security-Policy']).toContain('wss:');
  });

  it('getCSPMetaContent returns CSP string', () => {
    expect(getCSPMetaContent()).toBe(CONTENT_SECURITY_POLICY);
  });
});
