/**
 * Security utilities for FinPlan Pro.
 * Provides HTML escaping, XSS prevention, URL sanitization, CSRF protection,
 * and input validation for an FP&A desktop application.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Security-related constants used across the module. */
export const SECURITY_CONSTANTS = {
  /** Maximum allowed length for user input fields. */
  MAX_INPUT_LENGTH: 10000,
  /** Length of generated CSRF tokens. */
  CSRF_TOKEN_LENGTH: 32,
  /** HTTP header name for CSRF token transmission. */
  CSRF_HEADER_NAME: 'X-CSRF-Token',
  /** URI schemes considered safe for navigation. */
  SAFE_PROTOCOLS: ['https:', 'http:'] as readonly string[],
  /** URI schemes that must be blocked to prevent code execution. */
  DANGEROUS_PROTOCOLS: ['javascript:', 'data:', 'vbscript:'] as readonly string[],
} as const;

// ---------------------------------------------------------------------------
// CSRF State
// ---------------------------------------------------------------------------

/** Module-level storage for the current CSRF token. */
let _csrfToken: string | null = null;

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a string representation of the input, or empty string for non-string
 * values. Used as a guard at the top of every public sanitizer.
 */
function toStringOrEmpty(value: unknown): string {
  if (typeof value === 'string') return value;
  return '';
}

/**
 * Constant-time string comparison to prevent timing attacks on token
 * validation. Returns `true` only when both strings are identical in length
 * and content.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// HTML Escaping
// ---------------------------------------------------------------------------

/**
 * Escapes HTML-sensitive characters in a string to prevent injection when
 * rendering user-supplied text into the DOM.
 *
 * Escaped characters: `& < > " ' / \``
 *
 * @param input - Raw string to escape.
 * @returns Escaped string safe for HTML insertion, or empty string for
 *   non-string input.
 *
 * @example
 * escapeHTML('<b>"hi"</b>');
 * // → '&lt;b&gt;&quot;hi&quot;&lt;&#x2F;b&gt;'
 */
export function escapeHTML(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[&<>"'`/]/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#x27;';
      case '/':
        return '&#x2F;';
      case '`':
        return '&#96;';
      default:
        return char;
    }
  });
}

// ---------------------------------------------------------------------------
// Script / Tag Stripping
// ---------------------------------------------------------------------------

/**
 * Removes `<script>` tags and their contents from a string. Handles tags with
 * arbitrary attributes (e.g. `<script type="text/javascript">`).
 *
 * @param input - Raw HTML string.
 * @returns String with all script tags removed, or empty string for non-string
 *   input.
 *
 * @example
 * stripScripts('<p>Safe</p><script>evil()</script>');
 * // → '<p>Safe</p>'
 */
export function stripScripts(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  return s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

/**
 * Strips all HTML tags from a string, leaving only the text content.
 *
 * @param input - Raw HTML string.
 * @returns Plain text with tags removed, or empty string for non-string input.
 *
 * @example
 * stripAllTags('<p>Hello <b>World</b></p>');
 * // → 'Hello World'
 */
export function stripAllTags(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '');
}

// ---------------------------------------------------------------------------
// Attribute Sanitization
// ---------------------------------------------------------------------------

/**
 * Removes inline event handler attributes (`onclick`, `onerror`, `onload`,
 * etc.) from HTML tags.
 *
 * @param input - Raw HTML string.
 * @returns HTML with event handler attributes removed, or empty string for
 *   non-string input.
 *
 * @example
 * stripEventHandlers('<div onclick="alert(1)">');
 * // → '<div >'
 */
export function stripEventHandlers(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  return s.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ' ');
}

// ---------------------------------------------------------------------------
// URI / CSS Sanitization
// ---------------------------------------------------------------------------

/**
 * Removes dangerous URI schemes (`javascript:`, `vbscript:`, `data:`) from
 * attribute values within an HTML string.
 *
 * @param input - Raw HTML string or attribute string.
 * @returns String with dangerous URI schemes stripped, or empty string for
 *   non-string input.
 *
 * @example
 * stripDangerousURIs('href="javascript:alert(1)"');
 * // → 'href="alert(1)"'
 */
export function stripDangerousURIs(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  // Remove data: URIs entirely (strip the whole attribute value)
  let result = s.replace(/(href|src|action)\s*=\s*"data:[^"]*"/gi, (_match, attr) => `${attr}=""`);
  // Remove javascript:/vbscript: URIs (strip only the scheme prefix)
  result = result.replace(
    /(href|src|action)\s*=\s*"(?:javascript|vbscript):([^"]*)"/gi,
    (_match, attr, rest) => `${attr}="${rest}"`
  );
  return result;
}

/**
 * Removes dangerous CSS constructs such as `expression()` calls that can
 * execute JavaScript in older browsers.
 *
 * @param input - Raw CSS string.
 * @returns CSS string with dangerous constructs removed, or empty string for
 *   non-string input.
 *
 * @example
 * stripDangerousCSS('width: expression(alert(1))');
 * // → 'width: '
 */
export function stripDangerousCSS(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  return s.replace(/expression\s*\([^)]*\)/gi, '');
}

// ---------------------------------------------------------------------------
// Composite Sanitizers
// ---------------------------------------------------------------------------

/**
 * Fully sanitizes a string for safe display in HTML. Applies a three-step
 * pipeline: strip scripts, strip event handlers, then escape all remaining
 * HTML.
 *
 * @param input - Raw user-supplied string.
 * @returns HTML-safe escaped string, or empty string for non-string input.
 *
 * @example
 * sanitizeForDisplay('<script>alert(1)</script><b>bold</b>');
 * // → '&lt;b&gt;bold&lt;&#x2F;b&gt;'
 */
export function sanitizeForDisplay(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  return escapeHTML(stripEventHandlers(stripScripts(s)));
}

/**
 * Encodes a string for safe inclusion in a URL query parameter or path
 * segment. Uses percent-encoding for all characters except unreserved URI
 * characters.
 *
 * @param input - Raw string to encode.
 * @returns Percent-encoded string, or empty string for non-string input.
 *
 * @example
 * sanitizeForURL('hello world');
 * // → 'hello%20world'
 */
export function sanitizeForURL(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  return encodeURIComponent(s);
}

/**
 * Sanitizes a filename by removing path traversal characters, null bytes,
 * leading dots (hidden files), and collapsing consecutive dots.
 *
 * @param input - Raw filename string.
 * @returns Safe filename, or empty string for non-string input.
 *
 * @example
 * sanitizeFilename('../../../etc/passwd');
 * // → 'etcpasswd'
 */
export function sanitizeFilename(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';
  return s
    .replace(/[/\\]/g, '') // remove path separators
    .replace(/\x00/g, '') // remove null bytes
    .replace(/^\.+/, '') // remove leading dots
    .replace(/\.{2,}/g, '.'); // collapse consecutive dots
}

// ---------------------------------------------------------------------------
// URL Validation
// ---------------------------------------------------------------------------

/**
 * Sanitizes a URL by allowing only safe protocols (`http:`, `https:`,
 * `mailto:`) and relative paths. Dangerous schemes (`javascript:`, `data:`,
 * `vbscript:`) return an empty string.
 *
 * @param input - Raw URL string.
 * @returns Safe URL or empty string if the scheme is dangerous, input is
 *   empty, or input is not a string.
 *
 * @example
 * sanitizeURL('https://example.com');  // → 'https://example.com'
 * sanitizeURL('javascript:alert(1)');  // → ''
 */
export function sanitizeURL(input: string): string {
  const s = toStringOrEmpty(input);
  if (!s) return '';

  const lower = s.toLowerCase().trim();

  // Relative URLs are always safe
  if (
    lower.startsWith('/') ||
    lower.startsWith('#') ||
    lower.startsWith('?') ||
    lower.startsWith('./') ||
    lower.startsWith('../')
  ) {
    return s;
  }

  // Check for dangerous schemes
  for (const scheme of SECURITY_CONSTANTS.DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(scheme)) return '';
  }

  // Check for safe absolute schemes
  for (const scheme of SECURITY_CONSTANTS.SAFE_PROTOCOLS) {
    if (lower.startsWith(scheme)) return s;
  }

  // mailto is safe
  if (lower.startsWith('mailto:')) return s;

  // Reject anything with an unrecognized scheme
  if (/^[a-z][a-z0-9+.-]*:/.test(lower)) return '';

  // Default: treat as relative path
  return s;
}

/**
 * Checks whether a URL uses a safe protocol. Returns `true` for `http:` and
 * `https:` URLs, `false` for dangerous schemes and non-string input.
 *
 * @param input - URL string to check.
 * @returns `true` if the URL is safe, `false` otherwise.
 *
 * @example
 * isSafeURL('https://example.com');  // → true
 * isSafeURL('javascript:alert(1)');  // → false
 */
export function isSafeURL(input: string): boolean {
  const s = toStringOrEmpty(input);
  if (!s) return false;

  const lower = s.toLowerCase().trim();

  for (const scheme of SECURITY_CONSTANTS.SAFE_PROTOCOLS) {
    if (lower.startsWith(scheme)) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Threat Detection
// ---------------------------------------------------------------------------

/**
 * Scans a string for common XSS attack patterns and returns a list of
 * detected threat categories.
 *
 * Detected categories: `script-tag`, `event-handler`, `javascript-uri`,
 * `eval-call`.
 *
 * @param input - Raw string to scan.
 * @returns Array of threat identifier strings. Empty if input is safe or not
 *   a string.
 *
 * @example
 * detectDangerousPatterns('<script>alert(1)</script>');
 * // → ['script-tag']
 */
export function detectDangerousPatterns(input: string): string[] {
  const s = toStringOrEmpty(input);
  if (!s) return [];

  const threats: string[] = [];

  if (/<script\b/i.test(s)) {
    threats.push('script-tag');
  }

  if (/\bon\w+\s*=/i.test(s)) {
    threats.push('event-handler');
  }

  if (/javascript\s*:/i.test(s)) {
    threats.push('javascript-uri');
  }

  if (/\beval\s*\(/i.test(s)) {
    threats.push('eval-call');
  }

  return threats;
}

/**
 * Quick safety check — returns `true` if the input contains no detected
 * XSS patterns. Returns `true` for non-string input (no threat detected).
 *
 * @param input - String to check.
 * @returns `true` if safe, `false` if dangerous patterns found.
 *
 * @example
 * isInputSafe('Hello World');          // → true
 * isInputSafe('<script>alert(1)</script>');  // → false
 */
export function isInputSafe(input: string): boolean {
  const s = toStringOrEmpty(input);
  if (!s) return true;
  return detectDangerousPatterns(s).length === 0;
}

// ---------------------------------------------------------------------------
// CSRF Token Management
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random alphanumeric CSRF token.
 *
 * @returns Token string of length {@link SECURITY_CONSTANTS.CSRF_TOKEN_LENGTH}.
 */
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = SECURITY_CONSTANTS.CSRF_TOKEN_LENGTH;

  // Use crypto.getRandomValues when available (browser / modern Node)
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars[bytes[i] % chars.length];
    }
    _csrfToken = token;
    return token;
  }

  // Fallback for environments without crypto
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  _csrfToken = token;
  return token;
}

/**
 * Returns the current CSRF token, generating one if none exists. Subsequent
 * calls return the same token until {@link clearCSRFToken} is called.
 *
 * @returns The current CSRF token string.
 */
export function getCSRFToken(): string {
  if (!_csrfToken) {
    return generateCSRFToken();
  }
  return _csrfToken;
}

/**
 * Returns an HTTP header object containing the CSRF token, suitable for
 * spreading into fetch/axios headers.
 *
 * @returns Object with the CSRF header name as key and the token as value.
 *
 * @example
 * fetch(url, { headers: { ...getCSRFHeader() } });
 */
export function getCSRFHeader(): Record<string, string> {
  return {
    [SECURITY_CONSTANTS.CSRF_HEADER_NAME]: getCSRFToken(),
  };
}

/**
 * Returns the configured CSRF header name.
 *
 * @returns The header name string (`X-CSRF-Token`).
 */
export function getCSRFHeaderName(): string {
  return SECURITY_CONSTANTS.CSRF_HEADER_NAME;
}

/**
 * Validates a submitted CSRF token against the stored token using
 * constant-time comparison to prevent timing attacks.
 *
 * @param token - Token string submitted by the client.
 * @returns `true` if the token matches the stored token, `false` otherwise.
 */
export function validateCSRFToken(token: string): boolean {
  if (typeof token !== 'string') return false;
  if (!_csrfToken) return false;
  return constantTimeEqual(token, _csrfToken);
}

/**
 * Clears the stored CSRF token. The next call to {@link getCSRFToken} will
 * generate a fresh token.
 */
export function clearCSRFToken(): void {
  _csrfToken = null;
}

// ---------------------------------------------------------------------------
// User Input Sanitization
// ---------------------------------------------------------------------------

interface SanitizeUserInputOptions {
  /** When `true`, HTML tags are preserved (scripts still stripped). */
  allowHTML?: boolean;
  /** Maximum allowed input length. Defaults to {@link SECURITY_CONSTANTS.MAX_INPUT_LENGTH}. */
  maxLength?: number;
  /** Field name included in error messages for debugging. */
  fieldName?: string;
}

interface SanitizeUserInputResult {
  /** Sanitized string safe for rendering. */
  safe: string;
  /** List of detected threat categories. */
  threats: string[];
  /** List of validation error messages. */
  errors: string[];
}

/**
 * Comprehensive input sanitization pipeline. Validates the input type and
 * length, detects XSS threats, and returns a sanitized string along with
 * any threats or errors found.
 *
 * @param input - Raw user input (any type).
 * @param options - Optional configuration for HTML allowance, max length,
 *   and field name.
 * @returns Object containing the sanitized `safe` string, detected `threats`,
 *   and validation `errors`.
 *
 * @example
 * const { safe, threats, errors } = sanitizeUserInput('<b>bold</b>');
 * // safe = '&lt;b&gt;bold&lt;/b&gt;', threats = [], errors = []
 */
export function sanitizeUserInput(
  input: unknown,
  options?: SanitizeUserInputOptions
): SanitizeUserInputResult {
  const threats: string[] = [];
  const errors: string[] = [];
  const fieldName = options?.fieldName ?? 'input';
  const maxLength = options?.maxLength ?? SECURITY_CONSTANTS.MAX_INPUT_LENGTH;
  const allowHTML = options?.allowHTML ?? false;

  // Type guard
  if (typeof input !== 'string') {
    errors.push(`${fieldName}: expected a string but received ${typeof input}`);
    return { safe: '', threats, errors };
  }

  // Trim
  let value = input.trim();

  // Length check
  if (value.length > maxLength) {
    errors.push(`${fieldName}: exceeds maximum length of ${maxLength} characters`);
  }

  // Threat detection
  const detected = detectDangerousPatterns(value);
  threats.push(...detected);

  // Sanitization pipeline
  value = stripScripts(value);

  if (allowHTML) {
    // Preserve safe HTML tags but strip event handlers
    value = stripEventHandlers(value);
  } else {
    // Full HTML escape
    value = escapeHTML(stripEventHandlers(value));
  }

  return { safe: value, threats, errors };
}
