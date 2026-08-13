import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * UI-01 step 2/4 — the core primitives must be expressed in semantic tokens,
 * and those tokens must actually be legible in BOTH themes.
 *
 * Two distinct failure modes are pinned here, because each one shipped:
 *
 * 1. **A fill token is not a text token.** A colour used as *text* has to
 *    contrast with the page; the same colour used as a *fill behind white
 *    text* has to contrast with white. Those requirements pull in opposite
 *    directions. `.btn-primary` in index.css fills with `--accent-primary`
 *    and sets `color: white`, which in dark theme is #0284c7 under #ffffff —
 *    **4.10:1, below AA**. `.btn-danger` is worse at 3.67:1. The dedicated
 *    `--action-fill` / `--danger-fill` tokens exist to satisfy both sides,
 *    and this test is what keeps them honest.
 *
 * 2. **Translucent tokens must be composited before measuring.** In dark
 *    theme `--accent-subtle` is `rgba(2,132,199,0.15)`. Measuring the text
 *    against that raw value is meaningless; it has to be flattened over
 *    `--bg-surface` first. Skipping this step is how a badge can look
 *    checked-and-passing while being unreadable.
 *
 * The values are read out of `src/index.css` rather than restated here, so
 * the test fails when the stylesheet changes rather than when someone
 * remembers to update a fixture.
 */

const CSS = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

/** Extract a `:root { … }` / `.light { … }` declaration block by selector. */
function block(selector: string): string {
  const start = CSS.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`selector ${selector} not found in index.css`);
  const open = CSS.indexOf('{', start);
  const end = CSS.indexOf('\n}', open);
  return CSS.slice(open, end);
}

const ROOT = block(':root');
const LIGHT = block('.light');

/**
 * Resolve a custom property within a theme block, following `var()` aliases
 * and falling back to :root the way the cascade does for a partial override.
 */
function token(name: string, scope: string): string {
  const read = (src: string): string | undefined => {
    const m = src.match(new RegExp(`--${name}:\\s*([^;]+);`));
    return m?.[1]?.trim();
  };
  const raw = read(scope) ?? read(ROOT);
  if (!raw) throw new Error(`token --${name} is not defined`);
  const alias = raw.match(/^var\(--([a-z0-9-]+)\)$/i);
  return alias ? token(alias[1]!, scope) : raw;
}

type RGB = [number, number, number];

function parseColor(value: string): { rgb: RGB; alpha: number } {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1]!;
    return {
      rgb: [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
      ],
      alpha: 1,
    };
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1]!.split(',').map((p) => parseFloat(p.trim()));
    return {
      rgb: [parts[0]! / 255, parts[1]! / 255, parts[2]! / 255],
      alpha: parts[3] ?? 1,
    };
  }
  throw new Error(`unsupported colour format: ${value}`);
}

/** Flatten a possibly-translucent colour over an opaque backdrop. */
function flatten(value: string, backdrop: RGB): RGB {
  const { rgb, alpha } = parseColor(value);
  return rgb.map((c, i) => alpha * c + (1 - alpha) * backdrop[i]!) as RGB;
}

function luminance(rgb: RGB): number {
  const [r, g, b] = rgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  ) as RGB;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: RGB, b: RGB): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_TEXT = 4.5;
/** WCAG 1.4.11 — a control's fill must be distinguishable from the page. */
const AA_NON_TEXT = 3.0;

const THEMES = [
  { name: 'dark', scope: ROOT },
  { name: 'light', scope: LIGHT },
] as const;

describe('UI-01 — filled action tokens are legible in both themes', () => {
  for (const { name, scope } of THEMES) {
    describe(name, () => {
      const page = () => flatten(token('bg-surface', scope), [1, 1, 1]);
      const onAccent = () => flatten(token('text-on-accent', scope), page());

      for (const fill of ['action-fill', 'action-fill-hover', 'danger-fill', 'danger-fill-hover']) {
        it(`--${fill} carries --text-on-accent at AA`, () => {
          const ratio = contrast(flatten(token(fill, scope), page()), onAccent());
          expect(
            ratio,
            `--${fill} (${token(fill, scope)}) under --text-on-accent in ${name}`
          ).toBeGreaterThanOrEqual(AA_TEXT);
        });

        it(`--${fill} separates from the page background`, () => {
          const ratio = contrast(flatten(token(fill, scope), page()), page());
          expect(
            ratio,
            `--${fill} (${token(fill, scope)}) against --bg-surface in ${name}`
          ).toBeGreaterThanOrEqual(AA_NON_TEXT);
        });
      }
    });
  }
});

describe('UI-01 — tinted badge fills pair with a legible text token', () => {
  const PAIRS = [
    ['accent-subtle', 'text-on-accent-subtle'],
    ['negative-subtle', 'text-on-danger-subtle'],
    ['positive-subtle', 'text-on-positive-subtle'],
  ] as const;

  for (const { name, scope } of THEMES) {
    for (const [fillToken, textToken] of PAIRS) {
      it(`${name}: --${textToken} on --${fillToken} meets AA`, () => {
        const page = flatten(token('bg-surface', scope), [1, 1, 1]);
        // The -subtle fills are translucent in dark theme; composite first.
        const fill = flatten(token(fillToken, scope), page);
        const text = flatten(token(textToken, scope), fill);
        expect(
          contrast(text, fill),
          `--${textToken} (${token(textToken, scope)}) on --${fillToken} (${token(fillToken, scope)}) in ${name}`
        ).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }
});

describe('UI-01 — the migrated primitives use no raw palette utilities', () => {
  // Scoped to the primitives actually converted in this step. Widening this
  // list is the intended way to ratchet the rest of src/components/ui over.
  const MIGRATED = ['Button', 'Card', 'Input', 'Badge', 'Select', 'Alert'];

  const RAW_PALETTE =
    /\b(?:bg|text|border|ring|from|via|to|placeholder|divide|outline|shadow|accent|caret|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/;

  /** Comment lines describe the rule; only real code should be matched. */
  const isComment = (line: string) => /^\s*(\/\/|\/\*|\*)/.test(line);

  for (const component of MIGRATED) {
    const source = readFileSync(resolve(__dirname, `../components/ui/${component}.tsx`), 'utf8');

    it(`${component}.tsx has no numbered palette utility`, () => {
      const offenders = source
        .split('\n')
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => RAW_PALETTE.test(line) && !isComment(line));
      expect(
        offenders.map((o) => `${component}.tsx:${o.n} ${o.line.trim()}`),
        'use a semantic token from index.css instead'
      ).toEqual([]);
    });

    it(`${component}.tsx declares no dark: variant`, () => {
      // Every semantic token already flips in `.light`. A `dark:` variant here
      // is a second source of truth that drifts from the stylesheet.
      const offenders = source
        .split('\n')
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => /\bdark:/.test(line) && !isComment(line));
      expect(offenders.map((o) => `${component}.tsx:${o.n} ${o.line.trim()}`)).toEqual([]);
    });
  }
});
