import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * DEC-020 census guard (Phase 14): SafeMathParser is the canonical
 * formula engine. Other evaluators (FormulaEngine above all) may not
 * gain product-path call sites silently — every import of a formula
 * evaluator from product code (pages/components/services/workers/
 * store) is pinned here, with its reason. Adding one requires
 * updating this census in the same change, which is the deliberate
 * retire-or-wire decision DEC-020 demands.
 */

const SRC = join(process.cwd(), 'src');
const PRODUCT_DIRS = ['pages', 'components', 'services', 'workers', 'store'];

/** Pinned: file -> why it may touch a non-canonical evaluator. */
const FORMULA_ENGINE_ALLOWLIST: Record<string, string> = {
  'components/spreadsheet/CircularRefWarning.tsx':
    'Detection + iterative-recalc ORCHESTRATION only: cell evaluation is delegated to the caller-supplied recalcCell callback. The hook has no product consumer today; it must never call FormulaEngine.evaluate.',
};

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) yield full;
  }
}

describe('DEC-020 formula-engine census', () => {
  it('no product file imports FormulaEngine outside the pinned allowlist', () => {
    const offenders: string[] = [];
    for (const dir of PRODUCT_DIRS) {
      for (const file of walk(join(SRC, dir))) {
        const rel = file.slice(SRC.length + 1);
        const text = readFileSync(file, 'utf8');
        if (/engines\/FormulaEngine/.test(text) && !(rel in FORMULA_ENGINE_ALLOWLIST)) {
          offenders.push(rel);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the allowlisted use is detection-only, never evaluation', () => {
    const text = readFileSync(join(SRC, 'components/spreadsheet/CircularRefWarning.tsx'), 'utf8');
    expect(text).toMatch(/analyzeForCircularReferences/);
    expect(text).not.toMatch(/FormulaEngine\.evaluate\(/);
  });

  it('product code reaches SafeMathParser only through known funnels', () => {
    // The batch worker (safeExpression) and engine internals are the
    // evaluation funnels. Direct SafeMathParser imports from product
    // dirs would bypass them; pin the current (empty) set.
    const direct: string[] = [];
    for (const dir of PRODUCT_DIRS) {
      for (const file of walk(join(SRC, dir))) {
        const text = readFileSync(file, 'utf8');
        if (/engines\/SafeMathParser/.test(text)) direct.push(file.slice(SRC.length + 1));
      }
    }
    expect(direct).toEqual([]);
  });
});
