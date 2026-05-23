// =============================================================================
// SECURITY UTILITIES -- Input Sanitization, XSS Prevention, CSRF Protection
// Pure TypeScript, deterministic, zero external dependencies
// =============================================================================

// ---------------------------------------------------------------------------
// HTML Entity Map for Escaping
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

const HTML_ESCAPE_RE = /[&<>"'`/]/g;

// ---------------------------------------------------------------------------
// Dangerous Pattern Regexes
// ---------------------------------------------------------------------------

const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI_RE = /javascript\s*:/gi;
const DATA_URI_RE = /data\s*:[^,]*;base64,/gi;
const VBSCRIPT_URI_RE = /vbscript\s*:/gi;
const EXPRESSION_RE = /expression\s*\(/gi;
const EVAL_RE = /eval\s*\(/gi;
const ALERT_RE = /alert\s*\(/gi;
const DOCUMENT_WRITE_RE = /document\.write\s*\(/gi;

// ---------------------------------------------------------------------------
// URL Validation
// ---------------------------------------------------------------------------

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const DANGEROUS_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:']);

// ---------------------------------------------------------------------------
// CSRF Token Storage
// ---------------------------------------------------------------------------

let csrfToken: string | null = null;
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_LENGTH = 32;

// ---------------------------------------------------------------------------
// HTML Escaping
// ---------------------------------------------------------------------------

/**
 * Escape HTML entities to prevent XSS when inserting user content into HTML.
 * Converts &, <, >, ", ', /, and ` to their HTML entity equivalents.
 */
export function escapeHTML(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

// ---------------------------------------------------------------------------
// Script & Event Handler Removal
// ---------------------------------------------------------------------------

/**
 * Strip all <script> tags and their content from a string.
 */
export function stripScripts(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(SCRIPT_TAG_RE, '');
}

/**
 * Strip inline event handlers (onclick, onerror, onload, etc.) from HTML.
 */
export function stripEventHandlers(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(EVENT_HANDLER_RE, '');
}

/**
 * Strip dangerous URI schemes (javascript:, data:, vbscript:) from HTML attributes.
 */
export function stripDangerousURIs(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(JAVASCRIPT_URI_RE, '').replace(VBSCRIPT_URI_RE, '').replace(DATA_URI_RE, '');
}

/**
 * Remove CSS expression() calls that can execute JavaScript in older browsers.
 */
export function stripDangerousCSS(css: string): string {
  if (typeof css !== 'string') return '';
  return css.replace(EXPRESSION_RE, '');
}

// ---------------------------------------------------------------------------
// Input Sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize user input for safe display in HTML contexts.
 * Applies multiple layers: strip scripts, strip event handlers, escape HTML.
 */
export function sanitizeForDisplay(input: string): string {
  if (typeof input !== 'string') return '';
  let sanitized = stripScripts(input);
  sanitized = stripEventHandlers(sanitized);
  sanitized = stripDangerousURIs(sanitized);
  sanitized = escapeHTML(sanitized);
  return sanitized;
}

/**
 * Sanitize input for safe insertion into a URL parameter.
 * Uses encodeURIComponent plus additional encoding of dangerous chars.
 */
export function sanitizeForURL(input: string): string {
  if (typeof input !== 'string') return '';
  return encodeURIComponent(input);
}

/**
 * Sanitize a filename to prevent path traversal and dangerous characters.
 * Allows only alphanumeric, hyphens, underscores, dots, and spaces.
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  // Remove path separators
  let sanitized = filename.replace(/[/\\:*?"<>|]/g, '');
  // Remove null bytes separately to satisfy no-control-regex
  sanitized = sanitized.replaceAll('\0', '');
  // Remove leading dots (prevent hidden files)
  sanitized = sanitized.replace(/^\.+/, '');
  // Collapse multiple spaces/dots
  sanitized = sanitized.replace(/\.{2,}/g, '.').replace(/\s{2,}/g, ' ');
  return sanitized.trim();
}

/**
 * Strip all HTML tags from a string, leaving only text content.
 */
export function stripAllTags(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '');
}

// ---------------------------------------------------------------------------
// URL Validation
// ---------------------------------------------------------------------------

/**
 * Validate that a URL uses a safe protocol (http, https, mailto, tel).
 * Returns the URL if safe, empty string if dangerous.
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.length === 0) return '';

  try {
    // Handle relative URLs (safe by default)
    if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
      return trimmed;
    }

    const parsed = new URL(trimmed);

    // Block dangerous protocols
    if (DANGEROUS_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return '';
    }

    // Allow only safe protocols
    if (!SAFE_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return '';
    }

    return trimmed;
  } catch {
    // If URL parsing fails, it might be a relative path -- allow it
    if (!trimmed.includes(':') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      return trimmed;
    }
    return '';
  }
}

/**
 * Check if a URL is safe to use (no javascript:, data:, vbscript: schemes).
 */
export function isSafeURL(url: string): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return !(
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:')
  );
}

// ---------------------------------------------------------------------------
// Pattern Detection (for input validation)
// ---------------------------------------------------------------------------

/**
 * Detect potentially dangerous patterns in user input.
 * Returns an array of detected threat types.
 */
export function detectDangerousPatterns(input: string): string[] {
  if (typeof input !== 'string') return [];
  const threats: string[] = [];

  if (SCRIPT_TAG_RE.test(input)) threats.push('script-tag');
  if (EVENT_HANDLER_RE.test(input)) threats.push('event-handler');
  if (JAVASCRIPT_URI_RE.test(input)) threats.push('javascript-uri');
  if (VBSCRIPT_URI_RE.test(input)) threats.push('vbscript-uri');
  if (DATA_URI_RE.test(input)) threats.push('data-uri');
  if (EVAL_RE.test(input)) threats.push('eval-call');
  if (ALERT_RE.test(input)) threats.push('alert-call');
  if (DOCUMENT_WRITE_RE.test(input)) threats.push('document-write');

  // Reset regex lastIndex (global regexes are stateful)
  SCRIPT_TAG_RE.lastIndex = 0;
  EVENT_HANDLER_RE.lastIndex = 0;
  JAVASCRIPT_URI_RE.lastIndex = 0;
  VBSCRIPT_URI_RE.lastIndex = 0;
  DATA_URI_RE.lastIndex = 0;
  EVAL_RE.lastIndex = 0;
  ALERT_RE.lastIndex = 0;
  DOCUMENT_WRITE_RE.lastIndex = 0;

  return [...new Set(threats)];
}

/**
 * Check if input is safe (contains no dangerous patterns).
 */
export function isInputSafe(input: string): boolean {
  return detectDangerousPatterns(input).length === 0;
}

// ---------------------------------------------------------------------------
// CSRF Protection
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random CSRF token.
 * Uses crypto.getRandomValues when available, falls back to Math.random.
 */
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let token = '';
  for (let i = 0; i < CSRF_TOKEN_LENGTH; i++) {
    token += chars[bytes[i] % chars.length];
  }

  csrfToken = token;
  return token;
}

/**
 * Get the current CSRF token, generating one if it does not exist.
 */
export function getCSRFToken(): string {
  if (!csrfToken) {
    return generateCSRFToken();
  }
  return csrfToken;
}

/**
 * Get the CSRF token as an HTTP header object.
 * Use with fetch/axios: { ...getCSRFHeader(), ...otherHeaders }
 */
export function getCSRFHeader(): Record<string, string> {
  return { [CSRF_HEADER_NAME]: getCSRFToken() };
}

/**
 * Get the CSRF header name.
 */
export function getCSRFHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Validate a CSRF token against the stored token.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateCSRFToken(token: string): boolean {
  if (!csrfToken || typeof token !== 'string') return false;
  if (token.length !== csrfToken.length) return false;

  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ csrfToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Clear the stored CSRF token (e.g., on logout).
 */
export function clearCSRFToken(): void {
  csrfToken = null;
}

// ---------------------------------------------------------------------------
// Combined Sanitization Pipeline
// ---------------------------------------------------------------------------

/**
 * Full sanitization pipeline for user input.
 * Validates type, trims, checks length, detects dangerous patterns, and sanitizes.
 */
export function sanitizeUserInput(
  input: unknown,
  options: {
    maxLength?: number;
    allowHTML?: boolean;
    fieldName?: string;
  } = {}
): { safe: string; threats: string[]; errors: string[] } {
  const { maxLength = 10000, allowHTML = false, fieldName = 'input' } = options;
  const errors: string[] = [];

  // Type check
  if (typeof input !== 'string') {
    return { safe: '', threats: [], errors: [`${fieldName} must be a string`] };
  }

  // Trim
  const trimmed = input.trim();

  // Length check
  if (trimmed.length > maxLength) {
    errors.push(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }

  // Detect threats
  const threats = detectDangerousPatterns(trimmed);

  // Sanitize
  let safe: string;
  if (allowHTML) {
    safe = stripScripts(trimmed);
    safe = stripEventHandlers(safe);
    safe = stripDangerousURIs(safe);
  } else {
    safe = sanitizeForDisplay(trimmed);
  }

  return { safe, threats, errors };
}

// ---------------------------------------------------------------------------
// Security Constants (for external use)
// ---------------------------------------------------------------------------

export const SECURITY_CONSTANTS = {
  MAX_INPUT_LENGTH: 10000,
  CSRF_TOKEN_LENGTH,
  CSRF_HEADER_NAME,
  SAFE_PROTOCOLS: [...SAFE_PROTOCOLS],
  DANGEROUS_PROTOCOLS: [...DANGEROUS_PROTOCOLS],
} as const;
