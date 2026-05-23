// =============================================================================
// SECURITY UTILITIES TESTS
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  escapeHTML,
  stripScripts,
  stripEventHandlers,
  stripDangerousURIs,
  stripDangerousCSS,
  sanitizeForDisplay,
  sanitizeForURL,
  sanitizeFilename,
  stripAllTags,
  sanitizeURL,
  isSafeURL,
  detectDangerousPatterns,
  isInputSafe,
  generateCSRFToken,
  getCSRFToken,
  getCSRFHeader,
  getCSRFHeaderName,
  validateCSRFToken,
  clearCSRFToken,
  sanitizeUserInput,
  SECURITY_CONSTANTS,
} from './security';

// ---------------------------------------------------------------------------
// escapeHTML
// ---------------------------------------------------------------------------

describe('escapeHTML', () => {
  it('should escape ampersand', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
  });

  it('should escape angle brackets', () => {
    expect(escapeHTML('<div>')).toBe('&lt;div&gt;');
  });

  it('should escape double quotes', () => {
    expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHTML("'hello'")).toBe('&#x27;hello&#x27;');
  });

  it('should escape forward slashes', () => {
    expect(escapeHTML('</script>')).toBe('&lt;&#x2F;script&gt;');
  });

  it('should escape backticks', () => {
    expect(escapeHTML('`template`')).toBe('&#96;template&#96;');
  });

  it('should handle empty string', () => {
    expect(escapeHTML('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(escapeHTML(null as unknown as string)).toBe('');
    expect(escapeHTML(undefined as unknown as string)).toBe('');
    expect(escapeHTML(123 as unknown as string)).toBe('');
  });

  it('should not alter safe text', () => {
    expect(escapeHTML('Hello World 123')).toBe('Hello World 123');
  });

  it('should escape multiple entities in one string', () => {
    expect(escapeHTML('<b>"bold" & \'italic\'</b>')).toBe(
      '&lt;b&gt;&quot;bold&quot; &amp; &#x27;italic&#x27;&lt;&#x2F;b&gt;'
    );
  });
});

// ---------------------------------------------------------------------------
// stripScripts
// ---------------------------------------------------------------------------

describe('stripScripts', () => {
  it('should remove script tags', () => {
    expect(stripScripts('<script>alert(1)</script>')).toBe('');
  });

  it('should remove script tags with attributes', () => {
    expect(stripScripts('<script type="text/javascript">alert(1)</script>')).toBe('');
  });

  it('should remove multiple script tags', () => {
    const input = '<p>Safe</p><script>evil1</script><div>Also safe</div><script>evil2</script>';
    expect(stripScripts(input)).toBe('<p>Safe</p><div>Also safe</div>');
  });

  it('should preserve non-script content', () => {
    expect(stripScripts('<p>Hello World</p>')).toBe('<p>Hello World</p>');
  });

  it('should handle non-string input', () => {
    expect(stripScripts(null as unknown as string)).toBe('');
  });

  it('should handle empty string', () => {
    expect(stripScripts('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// stripEventHandlers
// ---------------------------------------------------------------------------

describe('stripEventHandlers', () => {
  it('should remove onclick handlers', () => {
    expect(stripEventHandlers('<div onclick="alert(1)">')).toBe('<div >');
  });

  it('should remove onerror handlers', () => {
    expect(stripEventHandlers('<img onerror="alert(1)">')).toBe('<img >');
  });

  it('should remove onload handlers', () => {
    expect(stripEventHandlers('<body onload="evil()">')).toBe('<body >');
  });

  it('should preserve safe attributes', () => {
    expect(stripEventHandlers('<div class="safe" id="test">')).toBe('<div class="safe" id="test">');
  });

  it('should handle non-string input', () => {
    expect(stripEventHandlers(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// stripDangerousURIs
// ---------------------------------------------------------------------------

describe('stripDangerousURIs', () => {
  it('should remove javascript: URIs', () => {
    expect(stripDangerousURIs('href="javascript:alert(1)"')).toBe('href="alert(1)"');
  });

  it('should remove vbscript: URIs', () => {
    expect(stripDangerousURIs('href="vbscript:MsgBox"')).toBe('href="MsgBox"');
  });

  it('should remove data: URIs with base64', () => {
    const result = stripDangerousURIs('src="data:text/html;base64,PHNjcmlwdD4="');
    expect(result).not.toContain('data:');
    expect(result).not.toContain('base64');
  });

  it('should preserve http/https URIs', () => {
    expect(stripDangerousURIs('href="https://example.com"')).toBe('href="https://example.com"');
  });

  it('should handle non-string input', () => {
    expect(stripDangerousURIs(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// stripDangerousCSS
// ---------------------------------------------------------------------------

describe('stripDangerousCSS', () => {
  it('should remove CSS expression()', () => {
    const result = stripDangerousCSS('width: expression(alert(1))');
    expect(result).not.toContain('expression(');
  });

  it('should preserve safe CSS', () => {
    expect(stripDangerousCSS('color: red; font-size: 14px')).toBe('color: red; font-size: 14px');
  });

  it('should handle non-string input', () => {
    expect(stripDangerousCSS(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeForDisplay
// ---------------------------------------------------------------------------

describe('sanitizeForDisplay', () => {
  it('should sanitize script injection', () => {
    expect(sanitizeForDisplay('<script>alert(1)</script>')).toBe('');
  });

  it('should sanitize event handler injection', () => {
    const result = sanitizeForDisplay('<img onerror="alert(1)">');
    expect(result).not.toContain('onerror');
  });

  it('should escape remaining HTML', () => {
    const result = sanitizeForDisplay('<b>bold</b>');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('should handle complex XSS payload', () => {
    const payload = '<img src=x onerror=alert(1)><script>document.cookie</script>';
    const result = sanitizeForDisplay(payload);
    // Script tags should be stripped entirely
    expect(result).not.toContain('<script');
    // The img tag should be HTML-escaped so onerror is not a live attribute
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;');
  });

  it('should handle non-string input', () => {
    expect(sanitizeForDisplay(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeForURL
// ---------------------------------------------------------------------------

describe('sanitizeForURL', () => {
  it('should encode special characters', () => {
    expect(sanitizeForURL('hello world')).toBe('hello%20world');
  });

  it('should encode ampersand', () => {
    expect(sanitizeForURL('a&b')).toBe('a%26b');
  });

  it('should encode angle brackets', () => {
    expect(sanitizeForURL('<script>')).toBe('%3Cscript%3E');
  });

  it('should handle non-string input', () => {
    expect(sanitizeForURL(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeFilename
// ---------------------------------------------------------------------------

describe('sanitizeFilename', () => {
  it('should remove path separators', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
  });

  it('should remove null bytes', () => {
    expect(sanitizeFilename('file\x00.txt')).toBe('file.txt');
  });

  it('should remove leading dots', () => {
    expect(sanitizeFilename('.hidden')).toBe('hidden');
  });

  it('should collapse multiple dots', () => {
    expect(sanitizeFilename('file...name.txt')).toBe('file.name.txt');
  });

  it('should preserve safe filenames', () => {
    expect(sanitizeFilename('report-2026.pdf')).toBe('report-2026.pdf');
  });

  it('should handle non-string input', () => {
    expect(sanitizeFilename(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// stripAllTags
// ---------------------------------------------------------------------------

describe('stripAllTags', () => {
  it('should strip all HTML tags', () => {
    expect(stripAllTags('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('should handle self-closing tags', () => {
    expect(stripAllTags('Hello<br/>World')).toBe('HelloWorld');
  });

  it('should handle non-string input', () => {
    expect(stripAllTags(null as unknown as string)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeURL
// ---------------------------------------------------------------------------

describe('sanitizeURL', () => {
  it('should allow http URLs', () => {
    expect(sanitizeURL('http://example.com')).toBe('http://example.com');
  });

  it('should allow https URLs', () => {
    expect(sanitizeURL('https://example.com/path')).toBe('https://example.com/path');
  });

  it('should allow mailto URLs', () => {
    expect(sanitizeURL('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('should allow relative URLs', () => {
    expect(sanitizeURL('/path/to/page')).toBe('/path/to/page');
    expect(sanitizeURL('#anchor')).toBe('#anchor');
    expect(sanitizeURL('?query=1')).toBe('?query=1');
  });

  it('should block javascript: URLs', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
  });

  it('should block data: URLs', () => {
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('should block vbscript: URLs', () => {
    expect(sanitizeURL('vbscript:MsgBox')).toBe('');
  });

  it('should handle empty string', () => {
    expect(sanitizeURL('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeURL(null as unknown as string)).toBe('');
  });

  it('should allow relative paths', () => {
    expect(sanitizeURL('./file.txt')).toBe('./file.txt');
    expect(sanitizeURL('../parent/file.txt')).toBe('../parent/file.txt');
  });
});

// ---------------------------------------------------------------------------
// isSafeURL
// ---------------------------------------------------------------------------

describe('isSafeURL', () => {
  it('should return true for http', () => {
    expect(isSafeURL('http://example.com')).toBe(true);
  });

  it('should return true for https', () => {
    expect(isSafeURL('https://example.com')).toBe(true);
  });

  it('should return false for javascript:', () => {
    expect(isSafeURL('javascript:alert(1)')).toBe(false);
  });

  it('should return false for data:', () => {
    expect(isSafeURL('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
  });

  it('should return false for vbscript:', () => {
    expect(isSafeURL('vbscript:MsgBox')).toBe(false);
  });

  it('should handle non-string input', () => {
    expect(isSafeURL(null as unknown as string)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectDangerousPatterns
// ---------------------------------------------------------------------------

describe('detectDangerousPatterns', () => {
  it('should detect script tags', () => {
    const threats = detectDangerousPatterns('<script>alert(1)</script>');
    expect(threats).toContain('script-tag');
  });

  it('should detect event handlers', () => {
    const threats = detectDangerousPatterns('<img onerror="alert(1)">');
    expect(threats).toContain('event-handler');
  });

  it('should detect javascript: URIs', () => {
    const threats = detectDangerousPatterns('href="javascript:void(0)"');
    expect(threats).toContain('javascript-uri');
  });

  it('should detect eval calls', () => {
    const threats = detectDangerousPatterns('eval("alert(1)")');
    expect(threats).toContain('eval-call');
  });

  it('should return empty array for safe input', () => {
    expect(detectDangerousPatterns('Hello World')).toEqual([]);
  });

  it('should handle non-string input', () => {
    expect(detectDangerousPatterns(null as unknown as string)).toEqual([]);
  });

  it('should detect multiple threats', () => {
    const threats = detectDangerousPatterns('<script>eval("alert(1)")</script>');
    expect(threats.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// isInputSafe
// ---------------------------------------------------------------------------

describe('isInputSafe', () => {
  it('should return true for safe input', () => {
    expect(isInputSafe('Hello World')).toBe(true);
  });

  it('should return false for script injection', () => {
    expect(isInputSafe('<script>alert(1)</script>')).toBe(false);
  });

  it('should return false for event handler injection', () => {
    expect(isInputSafe('<img onerror="alert(1)">')).toBe(false);
  });

  it('should return false for javascript: URIs', () => {
    expect(isInputSafe('javascript:alert(1)')).toBe(false);
  });

  it('should handle non-string input', () => {
    expect(isInputSafe(null as unknown as string)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSRF Protection
// ---------------------------------------------------------------------------

describe('CSRF Protection', () => {
  beforeEach(() => {
    clearCSRFToken();
  });

  describe('generateCSRFToken', () => {
    it('should generate a token of correct length', () => {
      const token = generateCSRFToken();
      expect(token.length).toBe(SECURITY_CONSTANTS.CSRF_TOKEN_LENGTH);
    });

    it('should generate alphanumeric tokens', () => {
      const token = generateCSRFToken();
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('getCSRFToken', () => {
    it('should return the same token on subsequent calls', () => {
      const token1 = getCSRFToken();
      const token2 = getCSRFToken();
      expect(token1).toBe(token2);
    });

    it('should generate a token if none exists', () => {
      const token = getCSRFToken();
      expect(token.length).toBe(SECURITY_CONSTANTS.CSRF_TOKEN_LENGTH);
    });
  });

  describe('getCSRFHeader', () => {
    it('should return an object with the CSRF header', () => {
      const header = getCSRFHeader();
      expect(header).toHaveProperty(SECURITY_CONSTANTS.CSRF_HEADER_NAME);
      expect(typeof header[SECURITY_CONSTANTS.CSRF_HEADER_NAME]).toBe('string');
    });
  });

  describe('getCSRFHeaderName', () => {
    it('should return X-CSRF-Token', () => {
      expect(getCSRFHeaderName()).toBe('X-CSRF-Token');
    });
  });

  describe('validateCSRFToken', () => {
    it('should validate a correct token', () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token)).toBe(true);
    });

    it('should reject an incorrect token', () => {
      generateCSRFToken();
      expect(validateCSRFToken('wrong-token')).toBe(false);
    });

    it('should reject non-string input', () => {
      generateCSRFToken();
      expect(validateCSRFToken(null as unknown as string)).toBe(false);
    });

    it('should reject when no token is stored', () => {
      clearCSRFToken();
      expect(validateCSRFToken('any-token')).toBe(false);
    });

    it('should use constant-time comparison', () => {
      const token = generateCSRFToken();
      // Even tokens of same length but different content should fail
      const fakeToken = 'A'.repeat(token.length);
      expect(validateCSRFToken(fakeToken)).toBe(false);
    });
  });

  describe('clearCSRFToken', () => {
    it('should clear the stored token', () => {
      generateCSRFToken();
      clearCSRFToken();
      // After clearing, getCSRFToken should generate a new one
      const token1 = getCSRFToken();
      clearCSRFToken();
      const token2 = getCSRFToken();
      // They could theoretically be the same, but extremely unlikely
      // More importantly, validateCSRFToken should fail with old token
      expect(validateCSRFToken(token1)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// sanitizeUserInput
// ---------------------------------------------------------------------------

describe('sanitizeUserInput', () => {
  it('should sanitize safe input', () => {
    const result = sanitizeUserInput('Hello World');
    expect(result.safe).toBe('Hello World');
    expect(result.threats).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('should detect threats in dangerous input', () => {
    const result = sanitizeUserInput('<script>alert(1)</script>');
    expect(result.threats.length).toBeGreaterThan(0);
  });

  it('should escape HTML by default', () => {
    const result = sanitizeUserInput('<b>bold</b>');
    expect(result.safe).toContain('&lt;');
  });

  it('should allow HTML when allowHTML is true', () => {
    const result = sanitizeUserInput('<b>bold</b>', { allowHTML: true });
    expect(result.safe).toContain('<b>');
  });

  it('should still strip scripts when allowHTML is true', () => {
    const result = sanitizeUserInput('<script>alert(1)</script><b>bold</b>', { allowHTML: true });
    expect(result.safe).not.toContain('<script>');
    expect(result.safe).toContain('<b>');
  });

  it('should reject non-string input', () => {
    const result = sanitizeUserInput(123);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should enforce maxLength', () => {
    const longInput = 'a'.repeat(101);
    const result = sanitizeUserInput(longInput, { maxLength: 100 });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should include fieldName in error messages', () => {
    const result = sanitizeUserInput(123, { fieldName: 'username' });
    expect(result.errors[0]).toContain('username');
  });

  it('should trim input', () => {
    const result = sanitizeUserInput('  hello  ');
    expect(result.safe).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// SECURITY_CONSTANTS
// ---------------------------------------------------------------------------

describe('SECURITY_CONSTANTS', () => {
  it('should expose MAX_INPUT_LENGTH', () => {
    expect(SECURITY_CONSTANTS.MAX_INPUT_LENGTH).toBe(10000);
  });

  it('should expose CSRF_TOKEN_LENGTH', () => {
    expect(SECURITY_CONSTANTS.CSRF_TOKEN_LENGTH).toBe(32);
  });

  it('should expose CSRF_HEADER_NAME', () => {
    expect(SECURITY_CONSTANTS.CSRF_HEADER_NAME).toBe('X-CSRF-Token');
  });

  it('should expose SAFE_PROTOCOLS', () => {
    expect(SECURITY_CONSTANTS.SAFE_PROTOCOLS).toContain('https:');
    expect(SECURITY_CONSTANTS.SAFE_PROTOCOLS).toContain('http:');
  });

  it('should expose DANGEROUS_PROTOCOLS', () => {
    expect(SECURITY_CONSTANTS.DANGEROUS_PROTOCOLS).toContain('javascript:');
    expect(SECURITY_CONSTANTS.DANGEROUS_PROTOCOLS).toContain('data:');
  });
});
