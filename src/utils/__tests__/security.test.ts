/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
} from '../security';

beforeEach(() => {
  vi.stubGlobal('crypto', {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = (i * 7 + 3) % 256;
      return arr;
    },
  });
  clearCSRFToken();
});

describe('security', () => {
  describe('escapeHTML', () => {
    it('escapes HTML entities', () => {
      expect(escapeHTML('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('returns empty for non-string', () => {
      expect(escapeHTML(null as any)).toBe('');
    });

    it('passes through safe strings', () => {
      expect(escapeHTML('hello world')).toBe('hello world');
    });
  });

  describe('stripScripts', () => {
    it('removes script tags', () => {
      expect(stripScripts('<script>alert(1)</script>hello')).toBe('hello');
    });

    it('handles nested script tags', () => {
      expect(stripScripts('<script>if (a < b) {}</script>')).toBe('');
    });

    it('returns empty for non-string', () => {
      expect(stripScripts(null as any)).toBe('');
    });
  });

  describe('stripEventHandlers', () => {
    it('removes onclick handlers', () => {
      const result = stripEventHandlers('<div onclick="alert(1)">click</div>');
      expect(result).not.toContain('onclick');
    });

    it('removes onerror handlers', () => {
      const result = stripEventHandlers('<img src=x onerror="alert(1)">');
      expect(result).not.toContain('onerror');
    });

    it('returns empty for non-string', () => {
      expect(stripEventHandlers(null as any)).toBe('');
    });
  });

  describe('stripDangerousURIs', () => {
    it('removes javascript: URIs', () => {
      expect(stripDangerousURIs('<a href="javascript:void(0)">link</a>')).toBe(
        '<a href="void(0)">link</a>'
      );
    });

    it('returns empty for non-string', () => {
      expect(stripDangerousURIs(null as any)).toBe('');
    });
  });

  describe('stripDangerousCSS', () => {
    it('removes expression() calls', () => {
      const result = stripDangerousCSS('width: expression(alert(1))');
      expect(result).not.toContain('expression(');
    });

    it('returns empty for non-string', () => {
      expect(stripDangerousCSS(null as any)).toBe('');
    });
  });

  describe('sanitizeForDisplay', () => {
    it('removes scripts and escapes HTML', () => {
      const result = sanitizeForDisplay('<script>alert(1)</script><b>bold</b>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<b>');
    });

    it('returns empty for non-string', () => {
      expect(sanitizeForDisplay(undefined as any)).toBe('');
    });
  });

  describe('sanitizeForURL', () => {
    it('encodes URL characters', () => {
      expect(sanitizeForURL('hello world?q=1')).toBe('hello%20world%3Fq%3D1');
    });

    it('returns empty for non-string', () => {
      expect(sanitizeForURL(null as any)).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('removes path separators', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('etcpasswd');
    });

    it('removes leading dots', () => {
      expect(sanitizeFilename('..hidden')).toBe('hidden');
    });

    it('removes null bytes', () => {
      expect(sanitizeFilename('file\x00.txt')).toBe('file.txt');
    });

    it('returns empty for non-string', () => {
      expect(sanitizeFilename(123 as any)).toBe('');
    });
  });

  describe('stripAllTags', () => {
    it('removes all HTML tags', () => {
      expect(stripAllTags('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('returns empty for non-string', () => {
      expect(stripAllTags(null as any)).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    it('allows http URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    });

    it('blocks javascript: URLs', () => {
      expect(sanitizeURL('javascript:alert(1)')).toBe('');
    });

    it('allows relative URLs', () => {
      expect(sanitizeURL('/path/to/page')).toBe('/path/to/page');
    });

    it('returns empty for non-string', () => {
      expect(sanitizeURL(null as any)).toBe('');
    });
  });

  describe('isSafeURL', () => {
    it('returns true for http', () => {
      expect(isSafeURL('https://example.com')).toBe(true);
    });

    it('returns false for javascript:', () => {
      expect(isSafeURL('javascript:void(0)')).toBe(false);
    });

    it('returns false for non-string', () => {
      expect(isSafeURL(null as any)).toBe(false);
    });
  });

  describe('detectDangerousPatterns', () => {
    it('detects script tag', () => {
      const threats = detectDangerousPatterns('<script>alert(1)</script>');
      expect(threats).toContain('script-tag');
    });

    it('returns empty for safe input', () => {
      expect(detectDangerousPatterns('hello world')).toEqual([]);
    });

    it('returns empty for non-string', () => {
      expect(detectDangerousPatterns(null as any)).toEqual([]);
    });
  });

  describe('isInputSafe', () => {
    it('returns true for safe input', () => {
      expect(isInputSafe('hello')).toBe(true);
    });

    it('returns false for dangerous input', () => {
      expect(isInputSafe('<script>alert(1)</script>')).toBe(false);
    });
  });

  describe('CSRF token', () => {
    it('generateCSRFToken returns token', () => {
      const token = generateCSRFToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(32);
    });

    it('getCSRFToken generates token if not set', () => {
      const token = getCSRFToken();
      expect(token.length).toBe(32);
    });

    it('getCSRFToken returns same token if already set', () => {
      const first = getCSRFToken();
      const second = getCSRFToken();
      expect(first).toBe(second);
    });

    it('getCSRFHeader returns header object', () => {
      const header = getCSRFHeader();
      expect(header).toHaveProperty('X-CSRF-Token');
    });

    it('getCSRFHeaderName returns header name', () => {
      expect(getCSRFHeaderName()).toBe('X-CSRF-Token');
    });

    it('validateCSRFToken validates correct token', () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token)).toBe(true);
    });

    it('validateCSRFToken rejects wrong token', () => {
      generateCSRFToken();
      expect(validateCSRFToken('wrongtoken1234567890abcdefghij')).toBe(false);
    });

    it('validateCSRFToken rejects null token', () => {
      expect(validateCSRFToken(null as any)).toBe(false);
    });

    it('clearCSRFToken clears stored token', () => {
      generateCSRFToken();
      clearCSRFToken();
      const token = generateCSRFToken();
      expect(validateCSRFToken(token)).toBe(true);
    });
  });

  describe('sanitizeUserInput', () => {
    it('returns safe output for clean input', () => {
      const result = sanitizeUserInput('hello world');
      expect(result.safe).toBe('hello world');
      expect(result.threats).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('returns error for non-string input', () => {
      const result = sanitizeUserInput(123);
      expect(result.errors[0]!).toContain('expected a string');
    });

    it('returns error for too-long input', () => {
      const result = sanitizeUserInput('a'.repeat(10001));
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('detects threats in unsafe input', () => {
      const result = sanitizeUserInput('<script>alert(1)</script>');
      expect(result.threats).toContain('script-tag');
    });

    it('allows HTML when option set', () => {
      const result = sanitizeUserInput('<b>bold</b>', { allowHTML: true });
      expect(result.safe).toBe('<b>bold</b>');
    });
  });

  describe('SECURITY_CONSTANTS', () => {
    it('contains expected constants', () => {
      expect(SECURITY_CONSTANTS.MAX_INPUT_LENGTH).toBe(10000);
      expect(SECURITY_CONSTANTS.CSRF_TOKEN_LENGTH).toBe(32);
      expect(SECURITY_CONSTANTS.CSRF_HEADER_NAME).toBe('X-CSRF-Token');
      expect(SECURITY_CONSTANTS.SAFE_PROTOCOLS).toContain('https:');
      expect(SECURITY_CONSTANTS.DANGEROUS_PROTOCOLS).toContain('javascript:');
    });
  });
});
