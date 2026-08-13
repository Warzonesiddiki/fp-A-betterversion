import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { compile } from 'tailwindcss';

/**
 * UI-01 — Theme signal contract.
 *
 * FinPlan resolves its theme from an explicit `.dark` / `.light` class on
 * <html>, written by the inline bootstrap in index.html and by ThemeProvider.
 * Tailwind v4, however, defaults `dark:` to `@media (prefers-color-scheme: dark)`.
 *
 * If those two signals ever diverge again, the ~150 modules that use `dark:`
 * utilities silently follow the operating system while every CSS custom
 * property follows the in-app toggle — a user switching theme gets a
 * half-themed screen, and the light theme is unreachable for anyone whose OS is
 * set to dark. That failure is invisible to jsdom tests (which never evaluate
 * media queries) and to type/lint gates, so it is pinned here at the CSS level.
 */

const CSS_ENTRY = path.resolve(__dirname, '../index.css');

async function compileWithDarkUtility(): Promise<string> {
  const source = fs.readFileSync(CSS_ENTRY, 'utf8');
  const compiler = await compile(source, {
    base: path.dirname(CSS_ENTRY),
    // Tailwind v4 only emits a utility it has actually seen. Feed it a probe
    // rather than scanning the repo so the test stays fast and deterministic.
    loadStylesheet: async (id, base) => {
      const resolved = id.startsWith('tailwindcss')
        ? path.resolve(process.cwd(), 'node_modules/tailwindcss/index.css')
        : path.resolve(base, id);
      return {
        path: resolved,
        base: path.dirname(resolved),
        content: fs.readFileSync(resolved, 'utf8'),
      };
    },
  });

  return compiler.build(['dark:bg-gray-800', 'bg-gray-800']);
}

describe('theme signal contract (UI-01)', () => {
  it('resolves `dark:` from the .dark class, not the OS preference', async () => {
    const css = await compileWithDarkUtility();

    expect(css).toContain('.dark');
    expect(css).toMatch(/\.dark\\:bg-gray-800:where\(\.dark/);
  });

  it('never emits a prefers-color-scheme media query for `dark:` utilities', async () => {
    const css = await compileWithDarkUtility();

    // The app owns theme selection; the OS preference is consulted only by
    // ThemeProvider (to resolve the 'system' choice), never by the stylesheet.
    expect(css).not.toContain('prefers-color-scheme');
  });

  it('declares the class-based dark variant in the stylesheet entrypoint', () => {
    const source = fs.readFileSync(CSS_ENTRY, 'utf8');

    expect(source).toMatch(/@custom-variant\s+dark\s*\(&:where\(\.dark, \.dark \*\)\)/);
  });

  it('keeps the class the bootstrap writes aligned with the variant selector', () => {
    const bootstrap = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

    // index.html toggles these two classes before first paint; the variant above
    // keys off `.dark`, so a rename in either place must fail loudly here.
    expect(bootstrap).toContain("classList.toggle('dark', isDark)");
    expect(bootstrap).toContain("classList.toggle('light', !isDark)");
  });
});
