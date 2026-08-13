import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * UI-04 — light-mode contrast guardrail.
 *
 * The application defaults to the light theme (`uiStore.ts`) and paints the
 * canvas `--bg-root: #f8fafc`. Any element that hardcodes a light Tailwind
 * text colour without a dark background on one of its JSX ancestors renders
 * near-invisible text. At the time this guard was written the codebase had
 * 836 such sites, including six page `<h1>` titles that were literally white
 * on white on first load.
 *
 * The fix was to route those through the semantic tokens, which are defined
 * per-theme. This test walks the JSX ancestor chain with the TypeScript AST
 * and fails if the pattern ever comes back.
 *
 * Naive grep is NOT sufficient here: white text on `bg-blue-600` is correct,
 * and grep reported 45 such false positives. Ancestry is the whole point.
 */

/** Backgrounds dark enough that light text on them is intentional. */
const DARK_BG =
  /\bbg-(black|(slate|gray|zinc|neutral|stone)-(600|700|800|900|950)|(blue|indigo|emerald|green|red|rose|amber|orange|purple|violet|sky|cyan|teal|fuchsia|pink|lime|yellow)-(500|600|700|800|900))\b|\bbg-gradient|\bfrom-\w+-(500|600|700|800|900)|\bbg-\[|\bbg-primary\b|\bbg-destructive\b|\bbg-accent\b|\bbg-current\b/;

/**
 * Text colours that fail WCAG 2.1 AA against #f8fafc:
 *   text-white      1.04:1     text-slate-200  1.24:1
 *   text-slate-300  1.42:1     text-slate-400  2.45:1
 * (slate-500 at 4.55:1 passes and is deliberately not listed.)
 */
const LIGHT_TEXT =
  /\btext-white\b|\btext-white\/|\btext-(slate|gray|zinc|neutral)-(50|100|200|300|400)\b/;

/** An explicit dark: variant means the author handled both themes. */
const GUARD = /dark:text-/;

/** An inline style that paints a background is a backdrop we cannot judge statically. */
const STYLE_BG = /(background|backgroundColor)\s*:/;

interface Hit {
  file: string;
  line: number;
  tag: string;
  className: string;
}

function readAttributes(open: ts.JsxOpeningElement | ts.JsxSelfClosingElement) {
  let className = '';
  let style = '';
  for (const attribute of open.attributes.properties) {
    if (attribute.kind !== ts.SyntaxKind.JsxAttribute || !attribute.initializer) continue;
    const name = attribute.name.getText();
    if (name === 'className') className += ' ' + attribute.initializer.getText();
    if (name === 'style') style += ' ' + attribute.initializer.getText();
  }
  return { className, style };
}

function scan(): Hit[] {
  const files = execSync(
    "find src -name '*.tsx' ! -name '*.test.tsx' ! -path '*/test/*' ! -path '*/__tests__/*'",
    { encoding: 'utf8' }
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  const hits: Hit[] = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    // Cheap pre-filter: most files contain none of these classes at all.
    if (!LIGHT_TEXT.test(source)) continue;

    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const ancestorsWithDarkBackdrop: boolean[] = [];

    const visit = (node: ts.Node): void => {
      const isElement = ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);
      if (isElement) {
        const open = ts.isJsxElement(node) ? node.openingElement : node;
        const { className, style } = readAttributes(open);
        ancestorsWithDarkBackdrop.push(DARK_BG.test(className) || STYLE_BG.test(style));

        if (
          LIGHT_TEXT.test(className) &&
          !GUARD.test(className) &&
          !ancestorsWithDarkBackdrop.some(Boolean)
        ) {
          hits.push({
            file,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            tag: open.tagName.getText(),
            className: className.replace(/\s+/g, ' ').trim().slice(0, 90),
          });
        }
        ts.forEachChild(node, visit);
        ancestorsWithDarkBackdrop.pop();
        return;
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }
  return hits;
}

describe('light-mode contrast contract', () => {
  const hits = scan();

  it('has no light text rendered without a dark backdrop', () => {
    const report = hits.map((h) => `  ${h.file}:${h.line} <${h.tag}> ${h.className}`).join('\n');
    expect(
      hits.length,
      hits.length === 0
        ? ''
        : `${hits.length} element(s) use a light text colour with no dark background on any ` +
            `JSX ancestor. The app defaults to the light theme, so this text is unreadable.\n` +
            `Use the semantic tokens instead — text-[var(--text-primary)] / ` +
            `--text-secondary / --text-muted — or add a dark backdrop.\n${report}`
    ).toBe(0);
  });

  it('detects the pattern it claims to detect', () => {
    // Mutation guard: if the matchers ever stop matching, the test above
    // would pass vacuously and the bug class could silently return.
    expect(LIGHT_TEXT.test('text-2xl font-bold text-white')).toBe(true);
    expect(LIGHT_TEXT.test('text-sm text-slate-400')).toBe(true);
    expect(LIGHT_TEXT.test('text-sm text-slate-300')).toBe(true);
    // ...and does not flag colours that actually pass AA on #f8fafc.
    expect(LIGHT_TEXT.test('text-sm text-slate-500')).toBe(false);
    expect(LIGHT_TEXT.test('text-[var(--text-muted)]')).toBe(false);
    // A dark ancestor makes light text correct.
    expect(DARK_BG.test('rounded bg-blue-600 p-2')).toBe(true);
    expect(DARK_BG.test('rounded bg-white p-2')).toBe(false);
    expect(STYLE_BG.test("{{ background: 'var(--accent-primary)' }}")).toBe(true);
  });

  it('scans a meaningful number of files', () => {
    // Guards against the find command silently returning nothing.
    const count = execSync(
      "find src -name '*.tsx' ! -name '*.test.tsx' ! -path '*/test/*' ! -path '*/__tests__/*' | wc -l",
      { encoding: 'utf8' }
    ).trim();
    expect(Number(count)).toBeGreaterThan(400);
  });
});
