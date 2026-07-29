/**
 * F-0032 — Content-Security-Policy regression tests.
 *
 * The audit flagged `style-src 'unsafe-inline'`. Measured finding: it cannot be
 * removed today without breaking rendering. Evidence, from a real `npm run build`
 * output at 2026-07-29:
 *   - `dist/assets/DataGrid-*.js`, `ReportDesignerPage-*.js`, `pdf-vendor-*.js`,
 *     `Combination-*.js` and the entry chunk all contain runtime
 *     `createElement('style')` / `insertRule(` calls (ag-grid, framer-motion,
 *     jsPDF), which are injected inline at runtime and cannot be hashed ahead of
 *     time;
 *   - 145 `.tsx` files render `style={{ ... }}` attributes, which CSP also
 *     governs through `style-src`.
 * A nonce cannot be applied to third-party runtime injection we do not control,
 * and hashing is impossible for styles generated per render.
 *
 * The risk accepted is limited: `style-src 'unsafe-inline'` permits CSS
 * injection (data exfiltration via selectors, UI redress), NOT script execution.
 * The controls that stop script execution — `script-src` without 'unsafe-inline'
 * and without 'unsafe-eval', `object-src 'none'`, `base-uri 'self'`,
 * `frame-ancestors 'none'` — are the ones these tests pin, and they are the
 * reason the relaxation is survivable.
 *
 * These tests fail if the policy weakens anywhere else, and they fail if
 * `unsafe-inline` spreads beyond `style-src`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function parseCsp(policy: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const part of policy.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    directives.set(tokens[0]!, tokens.slice(1));
  }
  return directives;
}

function webCsp(): Map<string, string[]> {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const match = html.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/?>/i
  );
  if (!match) throw new Error('index.html has no Content-Security-Policy meta tag');
  return parseCsp(match[1]!);
}

function desktopCsp(): Map<string, string[]> {
  const conf = JSON.parse(readFileSync(join(ROOT, 'src-tauri', 'tauri.conf.json'), 'utf8'));
  const policy = conf?.app?.security?.csp;
  if (typeof policy !== 'string') throw new Error('tauri.conf.json has no app.security.csp string');
  return parseCsp(policy);
}

const SURFACES: ReadonlyArray<{ name: string; load: () => Map<string, string[]> }> = [
  { name: 'web (index.html)', load: webCsp },
  { name: 'desktop (tauri.conf.json)', load: desktopCsp },
];

describe('F-0032 Content-Security-Policy', () => {
  for (const surface of SURFACES) {
    describe(surface.name, () => {
      it('never allows inline or eval script', () => {
        const scriptSrc = surface.load().get('script-src') ?? [];
        expect(scriptSrc).not.toContain("'unsafe-inline'");
        expect(scriptSrc).not.toContain("'unsafe-eval'");
      });

      it('restricts default-src to self', () => {
        expect(surface.load().get('default-src')).toEqual(["'self'"]);
      });

      it('forbids plugins and embedded objects', () => {
        expect(surface.load().get('object-src')).toEqual(["'none'"]);
      });

      it('pins base-uri and form-action to self', () => {
        const csp = surface.load();
        expect(csp.get('base-uri')).toEqual(["'self'"]);
        expect(csp.get('form-action')).toEqual(["'self'"]);
      });

      it('forbids framing (clickjacking defence)', () => {
        expect(surface.load().get('frame-ancestors')).toEqual(["'none'"]);
      });

      it("confines 'unsafe-inline' to style-src and nowhere else", () => {
        // The documented, evidence-backed exception. If any OTHER directive
        // gains 'unsafe-inline', that is a new hole and this fails.
        for (const [directive, values] of surface.load()) {
          if (directive === 'style-src') continue;
          expect(values, `${directive} must not allow 'unsafe-inline'`).not.toContain(
            "'unsafe-inline'"
          );
        }
      });

      it('never allows a wildcard source', () => {
        for (const [directive, values] of surface.load()) {
          expect(values, `${directive} must not use a bare wildcard`).not.toContain('*');
          for (const value of values) {
            expect(value, `${directive} must not allow scheme-wide http:`).not.toBe('http:');
          }
        }
      });

      it('does not permit data: or blob: script sources', () => {
        const scriptSrc = surface.load().get('script-src') ?? [];
        expect(scriptSrc).not.toContain('data:');
        expect(scriptSrc).not.toContain('blob:');
      });
    });
  }

  it('web policy allows exactly the expected remote connect targets', () => {
    // Widening connect-src is how data leaves the app; changes must be deliberate.
    expect(webCsp().get('connect-src')).toEqual([
      "'self'",
      'https://*.tauri.app',
      'https://*.huggingface.co',
    ]);
  });

  it('documents the style-src exception in the security docs', () => {
    const doc = readFileSync(join(ROOT, 'docs', 'architecture', 'security.md'), 'utf8');
    expect(doc).toMatch(/style-src/);
    expect(doc).toMatch(/unsafe-inline/);
  });
});
