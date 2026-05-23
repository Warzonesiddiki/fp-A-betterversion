/**
 * Security headers configuration for FinPlan Pro.
 * Compatible with Tauri (custom protocol) and standard web servers.
 */

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/**
 * Returns headers for Tauri custom protocol responses.
 */
export function getTauriSecurityHeaders(): Record<string, string> {
  return { ...SECURITY_HEADERS };
}

/**
 * Returns headers for Vite dev server middleware.
 */
export function getViteSecurityHeaders(): Record<string, string> {
  const dev = { ...SECURITY_HEADERS };
  // Allow HMR websocket in dev
  dev['Content-Security-Policy'] = CONTENT_SECURITY_POLICY.replace(
    "connect-src 'self' https:",
    "connect-src 'self' https: ws: wss:"
  );
  return dev;
}

/**
 * Returns meta tag content for embedding CSP in HTML <meta> tags.
 */
export function getCSPMetaContent(): string {
  return CONTENT_SECURITY_POLICY;
}
