/**
 * The DEC-055 trap, as a ratchet.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `Money` is an OBJECT. So every one of these readers silently returns its
 * fallback for a `Money`:
 *
 *     typeof v === 'number' ? v : 0
 *     Number(cellValue)
 *     parseFloat(String(cellValue))
 *
 * The first form is the one that has actually bitten this tree three times, all
 * in engines that aggregate cube cells: `CubeEngine.aggregate`,
 * `CubeEngine.aggregateCells` and `AggregationDesigner.materialize`. Each time,
 * the compiler was satisfied (the parameter is `unknown` or a union) and the
 * aggregate silently became 0 — a green build reporting an empty ledger.
 *
 * Fixing the third copy by hand does not stop a fourth. This file does: it
 * fails when the shape reappears in `src/engines` or `src/store`, and it pins
 * the three sites that were fixed to the crossing that fixed them, so a later
 * "tidy-up" cannot quietly restore the guard.
 *
 * Deliberately narrow: only `typeof <expr containing .value> === 'number'` is
 * banned. A plain `typeof x === 'number'` guard elsewhere is usually correct and
 * is not this file's business (the four remaining occurrences in the tree are
 * forecast series values, a plugin sandbox delay and a grid delta — none of them
 * money-shaped, and none in the scanned trees).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCANNED_TREES = ['src/engines', 'src/store'] as const;

/**
 * Modules allowed to keep the guard, each with a reason that says why the value
 * cannot be a `Money`. An entry without a reason is not a decision, it is a
 * silencer — so the type demands one.
 */
const ALLOWED: Record<string, string> = {};

/**
 * `typeof <cell> === 'number' ? <cell> : <literal>` — the trap's exact shape.
 *
 * Both halves matter and both were learned the hard way:
 *  - the expression does not have to be `x.value`; the third copy read a bare
 *    `value` bound from `for (const [key, value] of cells)`, so an
 *    `.value`-only pattern missed it (caught by mutating this census);
 *  - the fallback must be a LITERAL. A `typeof` guard whose else-branch is a
 *    real value is ordinary narrowing and is not flagged — it is the literal
 *    fallback (`0`, `undefined`, `null`) that turns "cannot read" into "empty".
 */
const TRAP =
  /typeof\s+[A-Za-z_$][\w$.]*\s*===\s*'number'\s*\?\s*[A-Za-z_$][\w$.]*\s*:\s*(?:0|undefined|null)\b/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (/\.test\.tsx?$/.test(entry)) continue;
    if (/\.benchmark\.ts$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

interface Finding {
  file: string;
  line: number;
  text: string;
}

function scan(): { files: number; findings: Finding[] } {
  const files = SCANNED_TREES.flatMap((tree) => walk(join(ROOT, tree)));
  const findings: Finding[] = [];
  for (const file of files) {
    const key = relative(ROOT, file).split('\\').join('/');
    if (key in ALLOWED) continue;
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        // A comment that quotes the trap is documentation, not the trap.
        const code = line.trim();
        if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return;
        if (TRAP.test(line)) findings.push({ file: key, line: index + 1, text: code });
      });
  }
  return { files: files.length, findings };
}

describe('DEC-055 trap census', () => {
  it('scans a non-empty set of files (a broken walk must not pass quietly)', () => {
    expect(scan().files).toBeGreaterThan(50);
  });

  it('never reads a cell value through a typeof-number guard', () => {
    const { findings } = scan();
    const report = findings.map((f) => `${f.file}:${f.line}  ${f.text}`).join('\n');
    expect(report, `A cube/report cell value may be a Money:\n${report}`).toBe('');
  });

  it('pins every fixed site to the crossing that fixed it', () => {
    // Each entry: file, the function that reads cell values, the minimum number
    // of crossing calls expected there, and which crossing. A refactor that
    // drops the crossing fails here even if no `typeof` guard comes back.
    const sites = [
      {
        file: 'src/engines/CubeEngine.ts',
        name: 'aggregate() + aggregateCells()',
        minimum: 2,
      },
      { file: 'src/engines/AggregationDesigner.ts', name: 'materialize()', minimum: 1 },
      {
        file: 'src/engines/DriverCascadeEngine.ts',
        name: 'formula cell binder',
        minimum: 1,
        crossing: 'optionalAmountFrom(',
      },
    ] as const;

    for (const site of sites) {
      const source = readFileSync(join(ROOT, site.file), 'utf8');
      const crossing = 'crossing' in site ? site.crossing : 'amountFrom(';
      const calls = source.match(new RegExp(crossing.replace('(', '\\('), 'g')) ?? [];
      expect(
        calls.length,
        `${site.file} ${site.name} must cross cell values through amountFrom`
      ).toBeGreaterThanOrEqual(site.minimum);
    }
  });
});
